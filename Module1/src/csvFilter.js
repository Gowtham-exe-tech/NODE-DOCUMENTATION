import { Transform } from "node:stream";

// Read one CSV line and find the requested column.
// We do not create an array containing every column.
// If paymentStatusIndex is 2,
// this function returns "PAID".
function getCsvField(line, targetIndex) {
  let fieldStart = 0;
  let fieldIndex = 0;
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const character = line[i];

    if (character === '"') {
      // Two quotes inside a quoted field represent
      // one actual quote character.
      if (insideQuotes && line[i + 1] === '"') {
        i++;
        continue;
      }

      insideQuotes = !insideQuotes;
      continue;
    }

    // A comma outside quotes means the current field ended.
    if (character === "," && !insideQuotes) {
      if (fieldIndex === targetIndex) {
        return line.slice(fieldStart, i);
      }
      fieldIndex++;
      fieldStart = i + 1;
    }
  }

  // Handle the final field because there is no comma
  // after the last column.
  if (fieldIndex === targetIndex) {
    return line.slice(fieldStart);
  }
  return null;
}

// Count how many columns exist in a CSV line.
function countCsvColumns(line) {
  let columnCount = 1;
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const character = line[i];

    if (character === '"') {
      // Skip escaped quotes: ""
      if (insideQuotes && line[i + 1] === '"') {
        i++;
        continue;
      }

      insideQuotes = !insideQuotes;
      continue;
    }

    // Only commas outside quoted fields separate columns.
    if (character === "," && !insideQuotes) {
      columnCount++;
    }
  }
  return columnCount;
}

export function createCsvFilter(filterValue, statistics) {
  // Stores only the unfinished part of the previous chunk.
  // chunk 1 -> "101,Gowtham,PA"
  // chunk 2 -> "ID,5000\n"
  // remaining keeps "101,Gowtham,PA" until the next chunk arrives.
  let remaining = "";

  // Header information is needed only once.
  let headers = null;
  let paymentStatusIndex = -1;

  // Process one complete CSV line.
  function processLine(line, stream) {
    // Make sure the row has the same number of columns
    // as the header.
    const columnCount = countCsvColumns(line);

    if (columnCount !== headers.length) {
      throw new Error(
        `Invalid CSV row. Expected ${headers.length} columns but received ${columnCount}.`,
      );
    }

    // Find only the payment_status value.
    // We do NOT create an array containing every column.
    const paymentStatus = getCsvField(line, paymentStatusIndex).trim();
    statistics.totalRecords++;

    // If the status doesn't match, discard the row immediately.
    if (paymentStatus !== filterValue) {
      return;
    }

    statistics.matchedRecords++;

    // The original CSV line is already valid.
    // There is no need to parse it into an array and
    stream.push(line + "\n");
  }

  return new Transform({
    // Called whenever the Transform receives another chunk.
    transform(chunk, encoding, callback) {
      try {
        // Keep the previous incomplete line and add the
        // newly received chunk.
        remaining += chunk;
        let lineStart = 0;

        // Scan the chunk for newline characters.
    
        for (let i = 0; i < remaining.length; i++) {
          if (remaining[i] !== "\n") {
            continue;
          }

          // We found one complete line.
          const rawLine = remaining.slice(lineStart, i);

          // Windows files normally use \r\n.
          // Remove the \r because \n was already detected.
          const line = rawLine.replace(/\r$/, "");

          // Ignore completely empty lines.
          if (!line.trim()) {
            lineStart = i + 1;
            continue;
          }

          // The first non-empty line is the CSV header.
          if (!headers) {
            headers = [];
            let insideQuotes = false;
            let fieldStart = 0;

            // Parse only the header because we need
            // to find the payment_status column index.
            for (let j = 0; j < line.length; j++) {
              const character = line[j];

              if (character === '"') {
                if (insideQuotes && line[j + 1] === '"') {
                  j++;
                  continue;
                }

                insideQuotes = !insideQuotes;
                continue;
              }

              if (character === "," && !insideQuotes) {
                headers.push(line.slice(fieldStart, j));

                fieldStart = j + 1;
              }
            }

            // Add the final header field.
            headers.push(line.slice(fieldStart));

            paymentStatusIndex = headers.indexOf("payment_status");

            if (paymentStatusIndex === -1) {
              callback(new Error("payment_status column not found"));
              return;
            }

            // The output must still contain the header.
            this.push(line + "\n");
          } else {
            // Process one complete data row.
            processLine(line, this);
          }

          // The next line starts after this newline.
          lineStart = i + 1;
        }

        // Keep only the unfinished line.
        // Everything before lineStart has already been processed and can be released.
        remaining = remaining.slice(lineStart);

        callback();
      } catch (error) {
        callback(error);
      }
    },

    // Called after the input stream has no more data.
    flush(callback) {
      try {
        // The final line may not end with \n.
        const line = remaining.replace(/\r$/, "");

        // Nothing remains to process.
        if (!line.trim()) {
          callback();
          return;
        }

        // A CSV file without a header is invalid.
        if (!headers) {
          callback(new Error("CSV file does not contain a header"));
          return;
        }

        // Process the final row.
        processLine(line, this);

        callback();
      } catch (error) {
        callback(error);
      }
    },
  });
}
