const response = require('./../response')
const connection = require('../settings/database')



exports.getByVerifiedJWT = (req,res) =>
{
    if (!req.user) return response.status(401,'No auth',res);
    connection.query('SELECT `login` FROM `users` WHERE `login` = ?',[req.user.login],(error,rows,fields)=>
    {
        if (error) return response.status(400,error,res);
        if (rows.length<1) return response.status(404,'User not found',res);
        const row = rows[0];
        return response.status(200,row,res);
    })
}

exports.getUsername = (req,res) =>
{
    connection.query('SELECT `username` FROM `users` WHERE `login` = ?',[req.params.login],(error,rows,fields)=>
    {
        if (error) return response.status(400,error,res);
        if (rows.length<1) return response.status(404,'User not found',res);
        const row = rows[0];
        return response.status(200,row,res);
    })
}

exports.getProfile = (req,res) =>
{
    connection.query('SELECT * FROM `view_user_profile` WHERE `login` = ?',[req.params.login],(error,rows,fields)=>
    {
        if (error) return response.status(400,error,res);
        if (rows.length<1) return response.status(404,'User not found',res);

        const row = rows[0];
        if (req.user)
        {
            if (req.user.login==req.params.login) row.me=true;
            connection.query('SELECT * FROM `user_follows` WHERE `user_login` = ? AND `user_follower_login` = ?',[req.params.login,req.user.login],(error,youFollow,fields)=>
            {
                if (error) return response.status(400,error,res);
                row.youFollow = youFollow.length>0;
                connection.query('SELECT * FROM `user_follows` WHERE `user_login` = ? AND `user_follower_login` = ?',[req.user.login,req.params.login],(error,followsYou,fields)=>
                {
                    if (error) return response.status(400,error,res);
                    row.followsYou = followsYou.length>0;
                    return response.status(200,row,res);
                })
            })
        }
        else return response.status(200,row,res);
    })
}

exports.getLinks = (req,res) =>
{
    connection.query('SELECT `url`,`description` FROM `user_links` WHERE `userLogin` = ?',[req.params.login],(error,rows,fields)=>
    {
        if (error) return response.status(400,error,res);
        rows.forEach(row => { if (!row.description) row.description=row.url });
        return response.status(200,rows,res);
    })
}

exports.getAllSongs = (req,res) =>
{
    const sql = "SELECT `id`, ROW_NUMBER() OVER(PARTITION BY null) AS `pos` FROM(SELECT DISTINCT `id` FROM(SELECT `songID` as `id`,`time` FROM `song_likes` WHERE `userLogin` = ? UNION SELECT `songID` as `id`,`created_at` FROM `view_song_artists` WHERE `login` = ? ORDER by `time` DESC) as a) as b";
    connection.query(sql,[req.params.login,req.params.login],(error,rows,fields)=>
    {
        if (error) return response.status(400,error,res);
        if (rows.length<1) return response.status(404,'API No All songs',res);
        return response.status(200,{id:'API '+req.params.login+" ALL",songs:rows},res);
    })
}

exports.getCreatedSongs = (req,res) =>
{

    connection.query('SELECT `songID` as `id`, ROW_NUMBER() OVER(PARTITION BY null ORDER BY `created_at` DESC) AS `pos` FROM `view_song_artists` WHERE `login` = ?',[req.params.login],(error,rows,fields)=>
    {
        if (error) return response.status(400,error,res);
        if (rows.length<1) return response.status(404,'API No created songs',res);
        return response.status(200,{id:'API '+req.params.login+" created",songs:rows},res);
    })
}

exports.getCreatedPopularSongs = (req,res) =>
{
    connection.query('SELECT `songID` as `id`, ROW_NUMBER() OVER(PARTITION BY null ORDER BY `likes_count` DESC) AS `pos` FROM `view_song_artists` WHERE `login` = ?',[req.params.login],(error,rows,fields)=>
    {
        if (error) return response.status(400,error,res);
        if (rows.length<1) return response.status(404,'API No created popular songs',res);
        return response.status(200,{id:'API '+req.params.login+" created popular",songs:rows},res);
    })
}

exports.getLikedSongs = (req,res) =>
{
    connection.query('SELECT `songID` as `id`, ROW_NUMBER() OVER(PARTITION BY null ORDER BY `song_likes`.`time` DESC) AS `pos` FROM `song_likes` WHERE `userLogin` = ?',[req.params.login],(error,rows,fields)=>
    {
        if (error) return response.status(400,error,res);
        if (rows.length<1) return response.status(404,'API No liked songs',res);
        return response.status(200,{id:'API '+req.params.login+" liked",songs:rows},res);
    })
}

exports.getAllPlaylists = (req,res) =>
{
    const sql="SELECT DISTINCT `id` FROM(SELECT `playlistID` as `id`,`time` FROM `playlist_likes` WHERE `userLogin` = ? UNION SELECT `playlistID` as `id`,`created_at` FROM `view_playlist_artists` WHERE `login` = ? ORDER by `time` DESC) as a";
    connection.query(sql,[req.params.login,req.params.login],(error,rows,fields)=>
    {
        if (error) return response.status(400,error,res);
        if (rows.length<1) return response.status(404,'API No all playlists',res);
        return response.status(200,rows,res);
    })
}

exports.getCreatedPlaylists = (req,res) =>
{

    connection.query('SELECT `playlistID` as `id` FROM `view_playlist_artists` WHERE `login` = ? ORDER BY `created_at` DESC',[req.params.login],(error,rows,fields)=>
    {
        if (error) return response.status(400,error,res);
        if (rows.length<1) return response.status(404,'API No created playlists',res);
        return response.status(200,rows,res);
    })
}

exports.getCreatedPopularPlaylists = (req,res) =>
{

    connection.query('SELECT `playlistID` as `id` FROM `view_playlist_artists` WHERE `login` = ? ORDER BY `likes_count` DESC',[req.params.login],(error,rows,fields)=>
    {
        if (error) return response.status(400,error,res);
        if (rows.length<1) return response.status(404,'API No created popular playlists',res);
        return response.status(200,rows,res);
    })
}

exports.getLikedPlaylists = (req,res) =>
{
    connection.query('SELECT `playlistID` as `id` FROM `playlist_likes` WHERE `userLogin` = ? ORDER BY `playlist_likes`.`time` DESC',[req.params.login],(error,rows,fields)=>
    {
        if (error) return response.status(400,error,res);
        if (rows.length<1) return response.status(404,'API No liked playlists',res);
        return response.status(200,rows,res);
    })
}

exports.getProfilePicture = (req,res) =>
{
    connection.query("SELECT `profile_picture` FROM `users` WHERE `login` = ?",[req.params.login],(error,rows,fields)=>
    {
        if (error) return response.status(400,error,res);
        if (rows.length<1) return response.status(404,'User not found',res);

        const row = rows[0];
        res.sendFile("images/user images/profile pictures/"+row.profile_picture,{root: '.'}, function (error)
        {
            if (error) return response.status(error.status,error,res);
        });
    })
}

exports.getBanner = (req,res) =>
{
    connection.query("SELECT `banner` FROM `users` WHERE `login` = ?",[req.params.login],(error,rows,fields)=>
    {
        if (error) return response.status(400,error,res);
        if (rows.length<1) return response.status(404,'User not found',res);

        const row = rows[0];
        res.sendFile("images/user images/banners/"+row.banner,{root: '.'}, function (error)
        {
            if (error) return response.status(error.status,error,res);
        });
    })
}

exports.getFollowers = (req,res) =>
{
    connection.query('SELECT `user_follower_login` as `login` FROM `user_follows` WHERE `user_login` = ? ORDER BY `time` DESC',[req.params.login],(error,rows,fields)=>
    {
        if (error) return response.status(400,error,res);
        return response.status(200,rows,res);
    })
}

exports.getFollowing = (req,res) =>
{

    connection.query('SELECT `user_login` as `login` FROM `user_follows` WHERE `user_follower_login` = ? ORDER BY `time` DESC',[req.params.login],(error,rows,fields)=>
    {
        if (error) return response.status(400,error,res);
        return response.status(200,rows,res);
    })
}

exports.postFollow = (req,res) =>
{
    if (!req.user?.login) return response.status(401,"no auth",res);
    const sql = 'INSERT INTO `user_follows`(`user_login`,`user_follower_login`,`time`) VALUES (?,?,?)';
    connection.query(sql,[req.params.id,req.user.login,new Date().toISOString().slice(0, 19).replace('T', ' ')],(error,results)=>
    {
        if (error) return response.status(400,error,res);
        return response.status(201,'Follow posted',res);
    })
}

exports.deleteFollow = (req,res) =>
{
    if (!req.user?.login) return response.status(401,"no auth",res);
    const sql = 'DELETE FROM `user_follows` WHERE `user_login`=? AND `user_follower_login`=?';
    connection.query(sql,[req.params.id,req.user.login],(error,results)=>
    {
        if (error) return response.status(400,error,res);
        return response.status(201,'Follow deleted',res);
    })
}