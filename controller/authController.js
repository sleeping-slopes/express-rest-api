const response = require('../response')
const queryPromise = require('../settings/database')

const jwt = require('jsonwebtoken')

require('dotenv').config()

exports.logIn = async (req,res) =>
{
    try
    {
        const users = await queryPromise("SELECT `login`,`email`,`password` FROM `users` WHERE (`login` = ? OR `email` = ?)", [req.body.login,req.body.login]);
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
        const token = jwt.sign({ login: user.login },process.env.JWTSECRET);
        const currentUser = await queryPromise('SELECT `login`, `email`,`custom_theme`, `theme`, `accent_color`, `profile_picture` FROM `users` WHERE `login` = ?',[user.login]);
        if (currentUser.length<1) return response.status(404,'API: User not found',res);
        const loginData = { loginData: {authJWT: "Bearer " + token, user: currentUser[0]} };

        return response.status(200,loginData,res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}