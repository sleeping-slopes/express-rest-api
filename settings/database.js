const mysql = require("mysql2");

require('dotenv').config()

const pool=mysql.createPool
(
    {
        host:process.env.DB_HOST,
        user:process.env.DB_USER,
        password:process.env.DB_PASSWORD,
        database:process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 1,
        idleTimeout: 10000,
        queueLimit: 0
    }
);

function queryPromise(query, params)
{
    return new Promise((resolve, reject) =>
    {
        pool.query(query, params, (err, result, fields) =>
        {
            if (err) reject(err);
            resolve(result);
        });
    })
}

module.exports = queryPromise