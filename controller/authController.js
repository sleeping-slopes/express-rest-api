const response = require('../response')
const queryPromise = require('../settings/database')
const jwt = require('jsonwebtoken')
const config = require('../config')

exports.signUp = async (req,res) =>
{
    try
    {
        const users = await queryPromise("SELECT `login`,`email` FROM `users` WHERE `email` =  ? OR `login` = ?", [req.body.email,req.body.login]);
        if (users.length>0)
        {
            const error = {};
            users.map(user=>
            {
                if (user.email==req.body.email) error.emailError = 'Account with this email already exists.';
                if (user.login==req.body.login) error.loginError = 'Account with this login already exists.';
                return true;
            });
            return response.status(409,error,res);
        }

        await queryPromise('INSERT INTO `users`(`login`,`email`,`password`) VALUES (?,?,?)', [req.body.login,req.body.email,req.body.password]);
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
        const users = await queryPromise("SELECT * FROM `users` WHERE (`login` = ? OR `email` = ?)", [req.body.login,req.body.login]);

        if (users.length<1)
        {
            const error = { loginError: 'User with this login/email does not exist.' };
            return response.status(404,error,res);
        }
        const user = users[0];
        if (user.password!=req.body.password)
        {
            const error = { passwordError: 'Incorrect password.' };
            return response.status(401,error,res);
        }
        const token = jwt.sign({ login: user.login },config.JWTSECRET);
        return response.status(201,{token: "Bearer " + token},res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}