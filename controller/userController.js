const response = require('./../response')
const connection = require('../settings/database')



exports.getByVerifiedJWT = (req,res) =>
{
    connection.query('SELECT `login` FROM `users` WHERE `login` = ?',[req.user.login],(error,rows,fields)=>
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

exports.getUsername = (req,res) =>
{
    connection.query('SELECT `username` FROM `users` WHERE `login` = ?',[req.params.login],(error,rows,fields)=>
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

exports.getProfile = (req,res) =>
{
    connection.query('SELECT * FROM `view_user_profile` WHERE `login` = ?',[req.params.login],(error,rows,fields)=>
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

exports.getShortProfile = (req,res) =>
{
    connection.query('SELECT `username`,`followers_count` FROM `view_user_profile` WHERE `login` = ?',[req.params.login],(error,rows,fields)=>
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

exports.getLinks = (req,res) =>
{
    connection.query('SELECT `url`,`description` FROM `user_links` WHERE `userLogin` = ?',[req.params.login],(error,rows,fields)=>
    {
        if (error)
        {
            response.status(400,error,res);
        }
        else
        {
            rows.forEach(row => { if (!row.description) row.description=row.url });
            response.status(200,rows,res);
        }
    })
}

exports.getLikedSongs = (req,res) =>
{

    connection.query('SELECT `songID` as `id`, ROW_NUMBER() OVER(PARTITION BY null ORDER BY `song_likes`.`time` DESC) AS `pos` FROM `song_likes` WHERE `userLogin` = ?',[req.params.login],(error,rows,fields)=>
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

exports.getLikedPlaylists = (req,res) =>
{
    connection.query('SELECT `playlistID` as `id` FROM `playlist_likes` WHERE `userLogin` = ? ORDER BY `playlist_likes`.`time` DESC',[req.params.login],(error,rows,fields)=>
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

    connection.query('SELECT `songID` as `id`, ROW_NUMBER() OVER(PARTITION BY null ORDER BY `created_at` DESC) AS `pos` FROM `view_song_artists` WHERE `login` = ?',[req.params.login],(error,rows,fields)=>
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

exports.getPlaylists = (req,res) =>
{

    connection.query('SELECT `playlistID` as `id` FROM `view_playlist_artists` WHERE `login` = ? ORDER BY `created_at` DESC',[req.params.login],(error,rows,fields)=>
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



exports.getProfilePicture = (req,res) =>
{
    connection.query("SELECT `profile_picture` FROM `users` WHERE `login` = ?",[req.params.login],(error,rows,fields)=>
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
    connection.query("SELECT `banner` FROM `users` WHERE `login` = ?",[req.params.login],(error,rows,fields)=>
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

exports.getFollowers = (req,res) =>
{
    connection.query('SELECT `user_follower_login` as `login` FROM `user_follows` WHERE `user_login` = ? ORDER BY `time` DESC',[req.params.login],(error,rows,fields)=>
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

exports.getFollowing = (req,res) =>
{

    connection.query('SELECT `user_login` as `login` FROM `user_follows` WHERE `user_follower_login` = ? ORDER BY `time` DESC',[req.params.login],(error,rows,fields)=>
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