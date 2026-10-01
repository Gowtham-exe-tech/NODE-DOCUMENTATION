import { Transform } from "node:stream";

function parseCsvLine(line) {
  const columns = [];
  let currentValue = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const character = line[i];

    if (character === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        currentValue += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (character === "," && !insideQuotes) {
      columns.push(currentValue);
      currentValue = "";
      continue;
    }
    currentValue += character;
  }

  columns.push(currentValue);
  return columns;
}

function escapeCsvField(value) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replaceAll('"', '""')}"`;
  }

  return value;
}

export function createCsvFilter(filterValue, statistics) {
  let remaining = "";
  let headers = null;
  let paymentStatusIndex = -1;

  return new Transform({
    transform(chunk, encoding, callback) {
      try {
        
        console.log(
          "Chunk size:",
          (Buffer.byteLength(chunk, "utf8") / 1024).toFixed(2),"KB");

        remaining += chunk.toString();
        const lines = remaining.split("\n");
        remaining = lines.pop();

        for (const rawLine of lines) {
          const line = rawLine.replace(/\r$/, "");

          if (!line.trim()) {
            continue;
          }

          if (!headers) {
            headers = parseCsvLine(line);

            paymentStatusIndex = headers.indexOf("payment_status");

            if (paymentStatusIndex === -1) {
              callback(new Error("payment_status column not found"));
              return;
            }

            this.push(line + "\n");
            continue;
          }

          const columns = parseCsvLine(line);

          if (columns.length !== headers.length) {
            callback(
              new Error(
                `Invalid CSV row. Expected ${headers.length} columns but received ${columns.length}.`,
              ),
            );

            return;
          }

          const paymentStatus = columns[paymentStatusIndex].trim();

          statistics.totalRecords++;

          if (paymentStatus === filterValue) {
            statistics.matchedRecords++;
            this.push(columns.map(escapeCsvField).join(",") + "\n");
          }
        }
        callback();
      } catch (error) {
        callback(error);
      }
    },

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

        const columns = parseCsvLine(line);

        if (columns.length !== headers.length) {
          callback(
            new Error(
              `Invalid final CSV row. Expected ${headers.length} columns but received ${columns.length}.`,
            ),
          );
          return;
        }

        const paymentStatus = columns[paymentStatusIndex].trim();

        statistics.totalRecords++;

        if (paymentStatus === filterValue) {
          statistics.matchedRecords++;
          this.push(columns.map(escapeCsvField).join(",") + "\n");
        }
        callback();
      } catch (error) {
        callback(error);
      }
    },
  });
}
