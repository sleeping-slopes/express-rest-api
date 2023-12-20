const express = require('express');
const config = require('./config');
const cors = require("cors");
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

const routes = require('./routes/routes');
routes(app);

app.listen(config.API_PORT,config.API_HOST,()=>
{
    console.log("app listen on "+config.API_HOST+":"+config.API_PORT)
});