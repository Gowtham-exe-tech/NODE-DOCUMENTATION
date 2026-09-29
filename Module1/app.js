const fs = require("fs");
const data = fs.readFileSync("complexData.csv", "utf8");
const rows = data.split("\n");
const filtered = rows.filter(row => row.includes("PAID"));
fs.writeFileSync("output.txt", filtered.join("\n"));