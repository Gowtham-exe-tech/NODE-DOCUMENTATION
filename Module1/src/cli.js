import { processFile } from "./processor.js";


//read user input arguments
const inputFile = process.argv[2]; //process.argv stores in array 
const outputFile = process.argv[3];
const filterValue = process.argv[4];

// to handle undefined value when user not give arguments in cmd line
if (!inputFile || !outputFile || !filterValue) {
    console.error("usage: npm run dev -- <input-file> <output-file> <filter-value>");
    process.exit(1); //"1" conventially means something wrong(Failure), "0" represents successful termination(success- clean exit)
}


//initial memory usage 
const startupRSSMB = process.memoryUsage().rss / 1024 / 1024;


console.log("Input:", inputFile);
console.log("Output:", outputFile);
console.log("Filter:", filterValue);

try {
    //calling processFile()
    // startupRSSMB is passed so processor.js can calculate
    // how much additional RSS the processing used
    const result = await processFile(
        inputFile,
        outputFile,
        filterValue,
        startupRSSMB
    );
    console.log("Total records:", result.totalRecords);
    console.log("Matched records:", result.matchedRecords);
    console.log("Startup RSS:", result.startupRSSMB + " MB");
    console.log("Peak RSS:", result.peakRSSMB + " MB");
    console.log("Processing RSS increase:", result.processingRSSIncreaseMB + " MB");

} catch (error) {
    console.error("Processing failed:", error.message);
    process.exit(1);
}