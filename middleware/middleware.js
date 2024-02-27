const queryPromise = require('../settings/database')
const jwt = require('jsonwebtoken')

require('dotenv').config()

exports.authToken = async (req,res,next) =>
{
    try
    {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token==null) { req.user=null; return next(); }

        const user = await jwt.verify(token,process.env.JWTSECRET);

        const userExists = await queryPromise('SELECT EXISTS (SELECT 1 FROM `users` WHERE `login` = ?) AS `exists`',[user.login]);
        if (userExists[0].exists) { req.user=user; return next(); }

        req.user=null; return next();
    }
    catch(error)
    {
        req.user=null; return next();
    }
}