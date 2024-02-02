const response = require('./../response')
const queryPromise = require('../settings/database')



exports.getByVerifiedJWT = async (req,res) =>
{
    try
    {
        if (!req.user) return response.status(401,'API: Auth required',res);
        const rows = await queryPromise('SELECT `login` FROM `users` WHERE `login` = ?',[req.user.login]);
        if (rows.length<1) return response.status(404,'API: User not found',res);
        const row = rows[0];
        return response.status(200,row,res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}

exports.getUsername = async (req,res) =>
{
    try
    {
        const rows = await queryPromise('SELECT `username` FROM `users` WHERE `login` = ?',[req.params.login]);
        if (rows.length<1) return response.status(404,'API: User not found',res);
        const row = rows[0];
        if (!rows[0].username) rows[0].username = req.params.login;
        return response.status(200,row,res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}

exports.getProfile = async (req,res) =>
{
    try
    {
        const rows = await queryPromise('SELECT * FROM `view_user_profile` WHERE `login` = ?',[req.params.login]);
        if (rows.length<1) return response.status(404,'API: User not found',res);
        const row = rows[0];
        if (!rows[0].username) rows[0].username = req.params.login;
        const links = await queryPromise('SELECT `url`,`description` FROM `user_links` WHERE `userLogin` = ?',[req.params.login]);
        links.forEach(link => { if (!link.description) link.description=link.url });
        row.links=links;
        if (req.user)
        {
            if (req.user.login==req.params.login) row.me=true;
            else
            {
                const youFollow = await queryPromise('SELECT * FROM `user_follows` WHERE `user_login` = ? AND `user_follower_login` = ?',[req.params.login,req.user.login]);
                row.youFollow = youFollow.length>0;

                const followsYou = await queryPromise('SELECT * FROM `user_follows` WHERE `user_login` = ? AND `user_follower_login` = ?',[req.user.login,req.params.login]);
                row.followsYou = followsYou.length>0;
            }
        }
        return response.status(200,row,res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}

exports.getAllSongs = async (req,res) =>
{
    try
    {
        const sql = "SELECT `id`, ROW_NUMBER() OVER(PARTITION BY null) - 1 AS `pos` FROM(SELECT DISTINCT `id` FROM(SELECT `songID` as `id`,`time` FROM `song_likes` WHERE `userLogin` = ? UNION SELECT `songID` as `id`,`created_at` FROM `view_song_artists` WHERE `login` = ? ORDER by `time` DESC) as a) as b";
        const rows = await queryPromise(sql,[req.params.login,req.params.login]);
        if (rows.length<1) return response.status(404,'API: User has not created or liked any song yet',res);
        return response.status(200,{id:'API '+req.params.login+" ALL",songs:rows},res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}

exports.getCreatedSongs = async (req,res) =>
{
    try
    {
        const rows = await queryPromise('SELECT `songID` as `id`, ROW_NUMBER() OVER(PARTITION BY null ORDER BY `created_at` DESC) - 1 AS `pos` FROM `view_song_artists` WHERE `login` = ?',[req.params.login]);
        if (rows.length<1) return response.status(404,'API: User has not created any song yet',res);
        return response.status(200,{id:'API '+req.params.login+" created",songs:rows},res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}

exports.getCreatedPopularSongs = async (req,res) =>
{
    try
    {
        const rows = await queryPromise('SELECT `songID` as `id`, ROW_NUMBER() OVER(PARTITION BY null ORDER BY `likes_count` DESC) - 1 AS `pos` FROM `view_song_artists` WHERE `login` = ?',[req.params.login]);
        if (rows.length<1) return response.status(404,'API: User has not created any song yet',res);
        return response.status(200,{id:'API '+req.params.login+" created popular",songs:rows},res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}

exports.getLikedSongs = async (req,res) =>
{
    try
    {
        const rows = await queryPromise('SELECT `songID` as `id`, ROW_NUMBER() OVER(PARTITION BY null ORDER BY `song_likes`.`time` DESC) - 1 AS `pos` FROM `song_likes` WHERE `userLogin` = ?',[req.params.login]);
        if (rows.length<1) return response.status(404,'API: User has not liked any song yet',res);
        return response.status(200,{id:'API '+req.params.login+" liked",songs:rows},res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}

exports.getAllPlaylists = async (req,res) =>
{
    try
    {
        const sql = "SELECT DISTINCT `id` FROM(SELECT `playlistID` as `id`,`time` FROM `playlist_likes` WHERE `userLogin` = ? UNION SELECT `playlistID` as `id`,`created_at` FROM `view_playlist_artists` WHERE `login` = ? ORDER by `time` DESC) as a";
        const rows = await queryPromise(sql,[req.params.login,req.params.login]);
        if (rows.length<1) return response.status(404,'API: User has not created or liked any playlist yet',res);
        return response.status(200,rows,res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}

exports.getCreatedPlaylists = async (req,res) =>
{
    try
    {
        const rows = await queryPromise('SELECT `playlistID` as `id` FROM `view_playlist_artists` WHERE `login` = ? ORDER BY `created_at` DESC',[req.params.login]);
        if (rows.length<1) return response.status(404,'API: User has not created any playlist yet',res);
        return response.status(200,rows,res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}

exports.getCreatedPopularPlaylists = async (req,res) =>
{
    try
    {
        const rows = await queryPromise('SELECT `playlistID` as `id` FROM `view_playlist_artists` WHERE `login` = ? ORDER BY `likes_count` DESC',[req.params.login]);
        if (rows.length<1) return response.status(404,'API: User has not created any playlist yet',res);
        return response.status(200,rows,res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}

exports.getLikedPlaylists = async (req,res) =>
{
    try
    {
        const rows = await queryPromise('SELECT `playlistID` as `id` FROM `playlist_likes` WHERE `userLogin` = ? ORDER BY `playlist_likes`.`time` DESC',[req.params.login]);
        if (rows.length<1) return response.status(404,'API: User has not liked any playlist yet',res);
        return response.status(200,rows,res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}

exports.getProfilePicture = async (req,res) =>
{
    try
    {
        const rows = await queryPromise("SELECT `profile_picture` FROM `users` WHERE `login` = ?",[req.params.login]);
        if (rows.length<1) return response.status(404,'API: User not found',res);
        const row = rows[0];

        res.sendFile("images/user images/profile pictures/"+row.profile_picture,{root: '.'}, function (error)
        {
            if (error) return response.status(404,'API: User profile picture file not found',res);
        });
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}

exports.getBanner = async (req,res) =>
{
    try
    {
        const rows = await queryPromise("SELECT `banner` FROM `users` WHERE `login` = ?",[req.params.login]);
        if (rows.length<1) return response.status(404,'API: User not found',res);
        const row = rows[0];

        res.sendFile("images/user images/banners/"+row.banner,{root: '.'}, function (error)
        {
            if (error) return response.status(404,'API: User banner picture file not found',res);
        });
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}

exports.getFollowers = async (req,res) =>
{
    try
    {
        const rows = await queryPromise("SELECT `user_follower_login` as `login` FROM `user_follows` WHERE `user_login` = ? ORDER BY `time` DESC",[req.params.login]);
        if (rows.length<1) return response.status(404,'API: User has not any followers yet',res);
        return response.status(200,rows,res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}

exports.getFollowing = async (req,res) =>
{
    try
    {
        const rows = await queryPromise("SELECT `user_login` as `login` FROM `user_follows` WHERE `user_follower_login` = ? ORDER BY `time` DESC",[req.params.login]);
        if (rows.length<1) return response.status(404,'API: User has not following anyone yet',res);
        return response.status(200,rows,res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}

exports.postFollow = async (req,res) =>
{
    try
    {
        if (!req.user?.login) return response.status(401,"API: Auth required",res);
        const sql = 'INSERT INTO `user_follows`(`user_login`,`user_follower_login`,`time`) VALUES (?,?,?)';
        await queryPromise(sql,[req.params.login,req.user.login,new Date().toISOString().slice(0, 19).replace('T', ' ')]);
        return response.status(201,' API: Follow posted',res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}

exports.deleteFollow = async (req,res) =>
{
    try
    {
        if (!req.user?.login) return response.status(401,"API: Auth required",res);
        const sql = 'DELETE FROM `user_follows` WHERE `user_login`=? AND `user_follower_login`=?';
        await queryPromise(sql,[req.params.login,req.user.login]);
        return response.status(201,'API: Follow deleted',res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}


exports.putProfile = async (req,res) =>
{
    try
    {

        if (!req.user?.login) return response.status(401,"API: Auth required",res);
        if (req.user.login!=req.params.login) return response.status(401,"API: Can't edit other user",res);
        const sql = 'UPDATE `audioplayerdb`.`users` SET `username` = ?, `status` = ?,`city` = ?,`country` = ?,`bio` = ? WHERE (`login` = ?)';
        await queryPromise(sql,[req.body.username,req.body.status,req.body.city,req.body.country,req.body.bio,req.user.login]);

        const deleteAllLinksSQL = 'DELETE FROM `user_links` WHERE`userLogin` = ?'
        await queryPromise(deleteAllLinksSQL,[req.user.login]);

        for (let i = 0;i<req.body.links.length;i++)
        {
            const insertLinkSQL = 'INSERT INTO `audioplayerdb`.`user_links` (`userLogin`, `url`, `description`) VALUES (?, ?, ?)';
            await queryPromise(insertLinkSQL,[req.user.login,req.body.links[i].url,req.body.links[i].description || req.body.links[i].url]);
        }

        return response.status(201,'API: User profile updated',res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}