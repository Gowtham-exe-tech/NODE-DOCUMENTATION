import fs from "node:fs";
import { pipeline } from "node:stream/promises";
import { createCsvFilter } from "./csvFilter.js";

export async function processFile(inputFile, outputFile, filterValue) {
    let totalRecords = 0;
    let matchedRecords = 0;
    let peakMemoryMB = 0;

    const readStream = fs.createReadStream(inputFile, {
        encoding: "utf8",
        highWaterMark: 64 * 1024,
    });

    const writeStream = fs.createWriteStream(outputFile);

    const filterStream = createCsvFilter(filterValue, () => {
        totalRecords++;
    });

    const memoryMonitor = setInterval(() => {
        const memoryUsage = process.memoryUsage();
        const currentMemoryMB = memoryUsage.rss / 1024 / 1024;
        peakMemoryMB = Math.max(peakMemoryMB, currentMemoryMB);
    }, 100);

    const originalPush = filterStream.push.bind(filterStream);

    filterStream.push = (chunk, encoding) => {
        if (chunk) {
        const text = chunk.toString();

        if (text !== "" && !text.startsWith("order_id")) {
            const lines = text.split("\n").filter(Boolean);

            matchedRecords += lines.length;
        }
        }

        return originalPush(chunk, encoding);
    };

    try {
        await pipeline(readStream, filterStream, writeStream);
    } 
    finally {
        clearInterval(memoryMonitor);

        const finalMemoryMB = process.memoryUsage().rss / 1024 / 1024;
        peakMemoryMB = Math.max(peakMemoryMB, finalMemoryMB);
    }

    return {
        totalRecords,
        matchedRecords,
        peakMemoryMB: peakMemoryMB.toFixed(2),
    };
    }

    // chunk is not complete csv row, got broken record,
    // so i need buffer/remainder
    // readStream.on("data", (chunk) => {
    //     console.log("Received chunk:");
    //     console.log(chunk.toString());
    // });

    //  readStream.on("end", () => {
    //     console.log("Finished reading file.");
    // });
