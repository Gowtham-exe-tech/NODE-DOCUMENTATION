import fs from "node:fs";
import { pipeline } from "node:stream/promises";
import { createCsvFilter } from "./csvFilter.js";

export async function processFile(inputFile, outputFile, filterValue) {

    //it will get updated in transform stream in CSVFilter
    const statistics = {
        totalRecords: 0,
        matchedRecords: 0,
    };

    let peakMemoryMB = 0;//to measure RSS(max one)

    //to read chunk by chunk
    const readStream = fs.createReadStream(inputFile, {
          encoding: "utf8", //incoming raw bytes converted into readable js strings instead of buffers
          highWaterMark: 32 * 1024, // for bytes conversion
    });

    //progressively write 
    const writeStream = fs.createWriteStream(outputFile);
  

    const filterStream = createCsvFilter(filterValue, statistics); // custom transform stream

    const memoryMonitor = setInterval(() => {
          const memoryUsage = process.memoryUsage(); // to get memory statistics
       console.log({
                rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
                heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
                heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
                external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`,
                arrayBuffers: `${(memoryUsage.arrayBuffers / 1024 / 1024).toFixed(2)} MB`,
       });
          const currentMemoryMB = memoryUsage.rss / 1024 / 1024;
          peakMemoryMB = Math.max(peakMemoryMB, currentMemoryMB);
    }, 100);

    try {
      await pipeline(readStream, filterStream, writeStream);

    } finally {
      clearInterval(memoryMonitor);
      const finalMemoryMB = process.memoryUsage().rss / 1024 / 1024;
      peakMemoryMB = Math.max(peakMemoryMB, finalMemoryMB);
      console.log(peakMemoryMB ,"peakMemoryMB")
    }

    return {
      ...statistics,
      peakMemoryMB: peakMemoryMB.toFixed(2),
    };
}
