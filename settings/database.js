const mysql = require("mysql2");

const config = require('../config');

const connection=mysql.createConnection
(
    {
        host:config.DB_HOST,
        user:config.DB_USER,
        password:config.DB_PASSWORD,
        database:config.DB_NAME,
    }
);

connection.connect((error)=>
{
    if (error) return console.log("cannot connect to mysql database "+config.DB_NAME+" on "+config.DB_HOST);
    return console.log("successfully connected to mysql database "+config.DB_NAME+" on "+config.DB_HOST);
});

function queryPromise(query, params)
{
    return new Promise((resolve, reject) =>
    {
        connection.query(query, params, (err, result, fields) =>
        {
            if (err) reject(err);
            resolve(result);
        });
    })
}

module.exports = queryPromise