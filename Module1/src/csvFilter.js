//transform stream is both input -> prcess -> output
import { Transform } from "node:stream";

//Convert one csv line into array of column values
function parseCsvLine(line) {
  const columns = [];
  let currentValue = "";
  let insideQuotes = false;

  //process csv line one charcter at a time
  for (let i = 0; i < line.length; i++) {
    const character = line[i];

    if (character === '"') {
      //to handle inside double quotes , add one actual quote skip next
      if (insideQuotes && line[i + 1] === '"') {
        currentValue += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    //to handle comma which is not used to denote field.
    if (character === "," && !insideQuotes) {
      columns.push(currentValue);
      currentValue = "";
      continue;
    }
    currentValue += character;
  }
  // last column not end with comma
  columns.push(currentValue);
  return columns;
}

//to wrap the vaule in quotes(quote inside quote field)
function escapeCsvField(value) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replaceAll('"', '""')}"`;
  }

  return value;
}

//transform stream creation
export function createCsvFilter(filterValue, statistics) {
  // to keep incomplete chunk part and then to combine it
  let remaining = "";
  // to store field names first row
  let headers = null;
  let paymentStatusIndex = -1;

  function processLine(line, stream) {

      const columns = parseCsvLine(line);
    
      // validate csv row
      if (columns.length !== headers.length) {
            throw new Error(`Invalid CSV row. Expected ${headers.length} columns but received ${columns.length}.`);
      }

      const paymentStatus = columns[paymentStatusIndex].trim();
      statistics.totalRecords++;

      if (paymentStatus === filterValue) {
            statistics.matchedRecords++;
            
            // converts array into valid csv
            stream.push(columns.map(escapeCsvField).join(",") + "\n");
      }
    }   
            
  return new Transform({
    //calls this when our transform stream receives data
    transform(chunk, encoding, callback) {
      try {
        
        // console.log("Chunk size:",(Buffer.byteLength(chunk, "utf8") / 1024).toFixed(2),"KB");

        // add incomplete data from previous chunk
        remaining += chunk;
        const lines = remaining.split("\n");
        //remove last incomplete in lines array
        remaining = lines.pop()

        //process every complete line
        for (const rawLine of lines) {

          // windows line endings commonly have \r\n , \n is splitted, so \r is removed now
          const line = rawLine.replace(/\r$/, "");

          // to ignore empty lines
          if (!line.trim()) {
            continue;
          }

          // if it is first line
          if (!headers) {
            headers = parseCsvLine(line);
            paymentStatusIndex = headers.indexOf("payment_status");

            //validate header
            if (paymentStatusIndex === -1) {
              callback(new Error("payment_status column not found"));
              return;
            }
            
            // output still need field headings
            this.push(line + "\n");
            continue;
          }

          processLine(line,this);
        }

        callback();       //part of transform stream api, ask next chunk for process
      } catch (error) {
        callback(error);      // pass error to the stream, so pipeline() can handle it
      }
    },

    //when the input stream has finished, to handle the last remaining  data
    flush(callback) {
      try {
        const line = remaining.replace(/\r$/, "");

        if (!line.trim()) {
          callback();
          return;
        }

        if (!headers) {
          callback(new Error("CSV file does not contain a header"));
          return;
        }

       
        processLine(line,this);
        callback();

      } catch (error) {
        callback(error);
      }
    },
  });
}
