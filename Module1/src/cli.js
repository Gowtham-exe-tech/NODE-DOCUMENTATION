import { processFile } from "./processor.js";

const inputFile = process.argv[2];
const outputFile = process.argv[3];
const filterValue = process.argv[4];

// to handle undefined value when user not give arguments in cmd line
if (!inputFile || !outputFile || !filterValue) {
    console.error("usage: npm run dev -- <input-file> <output-file> <filter-value>");
    process.exit(1);
}

console.log("Input:", inputFile);
console.log("Output:", outputFile);
console.log("Filter:", filterValue);

try {
    const result = await processFile(
        inputFile,
        outputFile,
        filterValue
    );
    console.log("Processing completed.");
    console.log("Total records:", result.totalRecords);
    console.log("Matched records:", result.matchedRecords);
    console.log("Peak memory:", result.peakMemoryMB + " MB");

} catch (error) {
    console.error("Processing failed:", error.message);
    process.exit(1);
}