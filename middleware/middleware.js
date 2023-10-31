const response = require('./../response')
const jwt = require('jsonwebtoken')
const config = require('./../config')

exports.authToken = (req,res,next) =>
{
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token==null) return response.status(401,{message:"token not found"},res);
    jwt.verify(token,config.JWTSECRET,(err,user)=>
    {
        if (err) return response.status(403,{message:"invalid token"},res);
        req.user=user;
        next();
    });
}