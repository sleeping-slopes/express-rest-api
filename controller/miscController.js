const response = require('./../response')

exports.getError = async (req,res) =>
{
    return response.status(418,'I`m a teapot :)',res);
}