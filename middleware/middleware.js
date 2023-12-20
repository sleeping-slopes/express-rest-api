const response = require('./../response')
const jwt = require('jsonwebtoken')
const config = require('./../config')

exports.authToken = (req,res,next) =>
{
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token==null)
    {
        req.user=null;
        return next();
    }
    jwt.verify(token,config.JWTSECRET,(err,user)=>
    {
        if (err) req.user=null;
        else req.user=user;
        return next();
    });
}