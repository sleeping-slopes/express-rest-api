const mysql = require("mysql2");

const config = require('../config');

const connection=mysql.createConnection
(
    {
        host:config.HOST,
        user:config.USER,
        password:config.PASSWORD,
        database:config.DATABASE
    }
);

connection.connect((error)=>
{
    if (error) return console.log("cannot connect to mysql database");
    return console.log("successfully connected to mysql database");
});

module.exports = connection