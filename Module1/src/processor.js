import fs from "node:fs";
import { pipeline } from "node:stream/promises";
import { createCsvFilter } from "./csvFilter.js";

export async function processFile(inputFile, outputFile, filterValue, startupRSSMB) {
  
  //it will get updated in transform stream in CSVFilter
    const statistics = {
          totalRecords: 0,
          matchedRecords: 0,
    };

    let peakRSSMB = startupRSSMB; //to measure RSS(max one)
  
    //to read chunk by chunk
    const readStream = fs.createReadStream(inputFile, {
          encoding: "utf8", //incoming raw bytes converted into readable js strings instead of buffers
          highWaterMark: 32 * 1024, // for bytes conversion
    });

    //progressively write 
    const writeStream = fs.createWriteStream(outputFile);
  

    const filterStream = createCsvFilter(filterValue, statistics); // custom transform stream

    const memoryMonitor = setInterval(() => {
        const currentRSSMB = process.memoryUsage().rss / 1024 / 1024;
        peakRSSMB = Math.max(peakRSSMB, currentRSSMB);
     }, 100);

    try {
      await pipeline(readStream, filterStream, writeStream);

    } finally {
    clearInterval(memoryMonitor);
    const finalRSSMB = process.memoryUsage().rss / 1024 / 1024;
    peakRSSMB = Math.max(
        peakRSSMB,
        finalRSSMB
      );
    }

    return {
        ...statistics,
        startupRSSMB: startupRSSMB.toFixed(2),
        peakRSSMB: peakRSSMB.toFixed(2),
        processingRSSIncreaseMB: (peakRSSMB - startupRSSMB).toFixed(2),
    };
}
