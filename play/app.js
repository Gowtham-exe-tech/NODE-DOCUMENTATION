import express from 'express';

const app = express();

app.get('/', (req,res) => {
    console.log("heyyyy");
    // res.download("app.js");
    res.json({message: "Error occured"});
});


app.listen(3000);

//res.status
//res.send
//res.json
//res.sendStatus
// res.download