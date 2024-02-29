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

app.listen(process.env.API_PORT,(error)=>
{
    console.log("server listen on port "+process.env.API_PORT)
});