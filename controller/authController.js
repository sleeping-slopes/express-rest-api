const response = require('../response')
const queryPromise = require('../settings/database')

const jwt = require('jsonwebtoken')
const config = require('../config')

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