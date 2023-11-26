const response = require('../response')
const connection = require('../settings/database')
const jwt = require('jsonwebtoken')
const config = require('../config')

exports.signUp = (req,res) =>
{
    connection.query("SELECT `id`,`email`,`username` FROM `users` WHERE `email` =  ? OR `username` = ?", [req.body.email,req.body.username],(error,rows,fields)=>
    {
        if (error)
        {
            response.status(400,error,res);
        }
        else if (rows.length>0)
        {
            const error = {};
            const row = JSON.parse(JSON.stringify(rows));
            row.map(r=>
            {
                if (r.email==req.body.email)
                {
                    error.emailError = 'account with this email already exists';
                }
                if (r.username==req.body.username)
                {
                    error.usernameError = 'account with this username already exists';
                }
                return true;
            });
            response.status(409,error,res);
        }
        else
        {
            const sql = 'INSERT INTO `users`(`username`,`email`,`password`) VALUES (?,?,?)';
            connection.query(sql,[req.body.username,req.body.email,req.body.password],(error,results)=>
            {
                if (error)
                {
                    response.status(400,error,res);
                }
                else
                {
                    const token = jwt.sign({ id: results.insertId },config.JWTSECRET,{ expiresIn: 60 * 120});
                    response.status(200,{error:'user has been successfully registered',token: "Bearer " + token,results},res);
                }
            })
        }
    })
}

exports.logIn = (req,res) =>
{
    connection.query("SELECT * FROM `users` WHERE (`username` = ? OR `email` = ?)", [req.body.username,req.body.username],(error,rows,fields)=>
    {
        if (error)
        {
            response.status(400,error,res);
        }
        else if (rows.length<1)
        {
            const error = { usernameError: 'user with this username/email does not exist' };
            response.status(401,error,res);
        }
        else
        {
            const row = rows[0];
            if (row.password==req.body.password)
            {
                const token = jwt.sign({ id: row.id },config.JWTSECRET,{ expiresIn: 60 * 120});
                response.status(200,{token: "Bearer " + token},res);
            }
            else
            {
                const error = { passwordError: 'incorrect password' };
                response.status(401,error,res);
            }
        }
    })
}