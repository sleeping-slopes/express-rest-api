const response = require('../response')
const queryPromise = require('../settings/database')
const jwt = require('jsonwebtoken')
const config = require('../config')

exports.signUp = async (req,res) =>
{
    try
    {
        const rows = await queryPromise("SELECT `login`,`email` FROM `users` WHERE `email` =  ? OR `login` = ?", [req.body.email,req.body.login]);
        if (rows.length>0)
        {
            const error = {};
            const row = JSON.parse(JSON.stringify(rows));
            row.map(r=>
            {
                if (r.email==req.body.email) error.emailError = 'Account with this email already exists.';
                if (r.login==req.body.login) error.loginError = 'Account with this login already exists.';
                return true;
            });
            return response.status(409,error,res);
        }
        const sql = 'INSERT INTO `users`(`login`,`email`,`password`) VALUES (?,?,?)';
        await queryPromise(sql, [req.body.login,req.body.email,req.body.password]);
        const token = jwt.sign({ login: req.body.login },config.JWTSECRET);
        return response.status(201,{token: "Bearer " + token},res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}

exports.logIn = async (req,res) =>
{
    try
    {
        const rows = await queryPromise("SELECT * FROM `users` WHERE (`login` = ? OR `email` = ?)", [req.body.login,req.body.login]);

        if (rows.length<1)
        {
            const error = { loginError: 'User with this login/email does not exist.' };
            return response.status(404,error,res);
        }
        const row = rows[0];
        if (row.password!=req.body.password)
        {
            const error = { passwordError: 'Incorrect password.' };
            return response.status(401,error,res);
        }
        const token = jwt.sign({ login: row.login },config.JWTSECRET);
        return response.status(201,{token: "Bearer " + token},res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}