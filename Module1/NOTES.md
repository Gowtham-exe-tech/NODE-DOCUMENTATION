# Problem Statement

* To build a command-line application
    - huge csv file 
    - read the file
    - process it without loading everything into RAM
    - filter required records
    - write matching records
    - output.txt

*Read a csv file, find records that match our condition, lastly write that data into another file .txt.*

Requirement: csv file is huge, but node.js process must stay below 50MB of RAM usage.

## Test I did:

* If i simply run 'npm run dev' the input, output, filter becomes undefined, so i handled it.

* Input/file errors — file doesn't exist, can't be opened, output can't be written.

* Data errors — CSV doesn't contain the required payment_status column.