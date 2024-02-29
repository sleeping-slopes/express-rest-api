const express = require('express');
const cors = require("cors");
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

const routes = require('./routes/routes');
routes(app);

require('dotenv').config()

console.log("server started");

const port = process.env.PORT || 3000;

app.listen(port,(error)=>
{
    if (error) return console.log("server error");
    console.log("server listen on port "+port);
});