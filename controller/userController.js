const response = require('./../response')
const connection = require('../settings/database')



exports.getByUsername = (req,res) =>
{
    connection.query('SELECT `username`,`email`,`profile_picture` FROM `users` WHERE `username` = ?',[req.user.username],(error,rows,fields)=>
    {
        if (error)
        {
            response.status(400,error,res);
        }
        else if (rows.length<1)
        {
            response.status(404,{error: 'user not found'},res);
        }
        else
        {
            const row = rows[0];
            response.status(200,row,res);
        }
    })
}

exports.getByUsername222 = (req,res) =>
{
    connection.query('SELECT `username`,`status`,`description` FROM `users` WHERE `username` = ?',[req.params.username],(error,rows,fields)=>
    {
        if (error)
        {
            response.status(400,error,res);
        }
        else if (rows.length<1)
        {
            response.status(404,{error: 'user not found'},res);
        }
        else
        {
            const row = rows[0];
            response.status(200,row,res);
        }
    })
}

exports.getProfilePicture = (req,res) =>
{
    connection.query("SELECT `profile_picture` FROM `users` WHERE `username` = ?",[req.params.username],(error,rows,fields)=>
    {
        if (error)
        {
            response.status(400,error,res);
        }
        else if (rows.length<1)
        {
            response.status(404,{error: 'user not found'},res);
        }
        else
        {
            const row = rows[0];
            res.sendFile("images/user images/profile pictures/"+row.profile_picture,{root: '.'}, function (error)
            {
                if (error)
                {
                  response.status(error.status,error,res);
                }
            });
        }
    })
}

exports.getBanner = (req,res) =>
{
    connection.query("SELECT `banner` FROM `users` WHERE `username` = ?",[req.params.username],(error,rows,fields)=>
    {
        if (error)
        {
            response.status(400,error,res);
        }
        else if (rows.length<1)
        {
            response.status(404,{error: 'user not found'},res);
        }
        else
        {
            const row = rows[0];
            res.sendFile("images/user images/banner/"+row.banner,{root: '.'}, function (error)
            {
                if (error)
                {
                  response.status(error.status,error,res);
                }
            });
        }
    })
}