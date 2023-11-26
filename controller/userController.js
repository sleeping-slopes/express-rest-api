const response = require('./../response')
const connection = require('../settings/database')



exports.getByID = (req,res) =>
{
    connection.query('SELECT `username`,`email`,`profile_picture` FROM `users` WHERE `id` = ?',[req.user.id],(error,rows,fields)=>
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

exports.getPlaylists = (req,res) =>
{
    connection.query('SELECT `playlistID` as `id` FROM `user_playlists` WHERE `userID` = ?',[req.user.id],(error,rows,fields)=>
    {
        if (error)
        {
            response.status(400,error,res);
        }
        else
        {
            response.status(200,rows,res);
        }
    })
}

exports.getSongs = (req,res) =>
{
    connection.query('SELECT `songID` as `id` FROM `user_songs` WHERE `userID` = ?',[req.user.id],(error,rows,fields)=>
    {
        if (error)
        {
            response.status(400,error,res);
        }
        else
        {
            response.status(200,rows,res);
        }
    })
}