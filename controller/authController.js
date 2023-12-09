const response = require('../response')
const connection = require('../settings/database')
const jwt = require('jsonwebtoken')
const config = require('../config')

exports.signUp = (req,res) =>
{
    connection.query("SELECT `login`,`email` FROM `users` WHERE `email` =  ? OR `login` = ?", [req.body.email,req.body.login],(error,rows,fields)=>
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
                    error.emailError = 'Account with this email already exists';
                }
                if (r.login==req.body.login)
                {
                    error.loginError = 'Account with this login already exists';
                }
                return true;
            });
            response.status(409,error,res);
        }
        else
        {
            const sql = 'INSERT INTO `users`(`login`,`email`,`password`) VALUES (?,?,?)';
            connection.query(sql,[req.body.login,req.body.email,req.body.password],(error,results)=>
            {
                if (error)
                {
                    response.status(400,error,res);
                }
                else
                {
                    const token = jwt.sign({ login: req.body.login },config.JWTSECRET,{ expiresIn: 60 * 120});
                    response.status(200,{token: "Bearer " + token},res);
                }
            })
        }
    })
}

exports.logIn = (req,res) =>
{
    connection.query("SELECT * FROM `users` WHERE (`login` = ? OR `email` = ?)", [req.body.login,req.body.email],(error,rows,fields)=>
    {
        if (error)
        {
            response.status(400,error,res);
        }
        else if (rows.length<1)
        {
            const error = { loginError: 'User with this login/email does not exist' };
            response.status(401,error,res);
        }
        else
        {
            const row = rows[0];
            if (row.password==req.body.password)
            {
                const token = jwt.sign({ login: row.login },config.JWTSECRET,{ expiresIn: 60 * 120});
                response.status(200,{token: "Bearer " + token},res);
            }
            else
            {
                const error = { passwordError: 'Incorrect password' };
                response.status(401,error,res);
            }
        }
    })
}