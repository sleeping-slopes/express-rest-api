const response = require('./../response')
const queryPromise = require('../settings/database')

exports.getMe = async (req,res) =>
{
    try
    {
        if (!req.user) return response.status(401,'API: Auth required',res);

        const users = await queryPromise('SELECT `login` FROM `users` WHERE `login` = ?',[req.user.login]);
        if (users.length<1) return response.status(404,'API: User not found',res);
        const user = users[0];

        return response.status(200,user,res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}

exports.deleteMe = async (req,res) =>
{
    try
    {
        if (!req.user) return response.status(401,'API: Auth required',res);

        const deleteMeResult = await queryPromise('DELETE FROM `users` WHERE `login` = ?',[req.user.login]);
        if (!deleteMeResult.affectedRows) return response.status(304,'API: User not modified',res);

        return response.status(204, 'API: User deleted',res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}

exports.getCredentials = async (req,res) =>
{
    try
    {
        if (!req.user) return response.status(401,'API: Auth required',res);

        const users = await queryPromise('SELECT `email` FROM `users` WHERE `login` = ?',[req.user.login]);
        if (users.length<1) return response.status(404,'API: User not found',res);
        const user = users[0];

        return response.status(200,user,res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}

exports.putCredentials = async (req,res) =>
{
    try
    {
        if (!req.user) return response.status(401,'API: Auth required',res);

        const putCredentialsResult = await queryPromise('UPDATE `users` SET `email` = ? WHERE `login` = ?',[req.body.email, req.user.login]);
        if (!putCredentialsResult.affectedRows) return response.status(304,'API: User credentials not modified',res);

        return response.status(200,'API: User credentials updated',res);
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

        const putUserProfileSQL = 'UPDATE `users` SET `username` = ?, `status` = ?,`city` = ?,`country` = ?,`bio` = ? WHERE (`login` = ?)';
        const putProfileResult = await queryPromise(putUserProfileSQL,[req.body.username,req.body.status,req.body.city,req.body.country,req.body.bio,req.user.login]);
        if (!putProfileResult.affectedRows) return response.status(304,'API: User profile not modified',res);

        const deleteAllLinksSQL = 'DELETE FROM `user_links` WHERE`userLogin` = ?'
        await queryPromise(deleteAllLinksSQL,[req.user.login]);

        if (req.body.links.length)
        {
            const insertLinksSQL = 'INSERT INTO `user_links` (`userLogin`, `url`, `description`) VALUES ?';
            await queryPromise(insertLinksSQL,[req.body.links.map((link) => [req.user.login,link.url,link.description])]);
        }

        return response.status(200,'API: User profile updated',res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}

exports.postSongLike = async (req,res) =>
{
    try
    {
        if (!req.user?.login) return response.status(401,"API: Auth required",res);

        const postSongLikeSQL = 'INSERT INTO `song_likes`(`userLogin`,`songID`,`time`) VALUES (?,?,?)';
        await queryPromise(postSongLikeSQL,[req.user.login,req.body.id,new Date().toISOString().slice(0, 19).replace('T', ' ')]);

        return response.status(200,'API: Song like posted',res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}

exports.deleteSongLike = async (req,res) =>
{
    try
    {
        if (!req.user?.login) return response.status(401,"API: Auth required",res);

        const deleteSongLikeSQL = 'DELETE FROM `song_likes` WHERE`userLogin`=? AND `songID`=?';
        const deleteSongLikeResult = await queryPromise(deleteSongLikeSQL,[req.user.login,req.params.id]);
        if (!deleteSongLikeResult.affectedRows) return response.status(404,'API: Song like not found',res);

        return response.status(204,'API: Song like deleted',res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}

exports.postPlaylistLike = async (req,res) =>
{
    try
    {
        if (!req.user?.login) return response.status(401,"API: Auth required",res);

        const postPlaylistLikeSQL = 'INSERT INTO `playlist_likes`(`userLogin`,`playlistID`,`time`) VALUES (?,?,?)';
        await queryPromise(postPlaylistLikeSQL,[req.user.login,req.body.id,new Date().toISOString().slice(0, 19).replace('T', ' ')]);

        return response.status(200,'API: Playlist like posted',res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}

exports.deletePlaylistLike = async (req,res) =>
{
    try
    {
        if (!req.user?.login) return response.status(401,"API: Auth required",res);

        const deletePlaylistLikeSQL = 'DELETE FROM `playlist_likes` WHERE`userLogin`=? AND `playlistID`=?';
        const deletePlaylistLikeResult = await queryPromise(deletePlaylistLikeSQL,[req.user.login,req.params.id]);
        if (!deletePlaylistLikeResult.affectedRows) return response.status(404,'API: Playlist like not found',res);

        return response.status(204,'API: Playlist like removed',res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}

exports.postFollowing = async (req,res) =>
{
    try
    {
        if (!req.user?.login) return response.status(401,"API: Auth required",res);

        const postUserFollowingSQL = 'INSERT INTO `user_follows`(`user_login`,`user_follower_login`,`time`) VALUES (?,?,?)';
        await queryPromise(postUserFollowingSQL,[req.body.login,req.user.login,new Date().toISOString().slice(0, 19).replace('T', ' ')]);

        return response.status(200,'API: Following posted',res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}

exports.deleteFollowing = async (req,res) =>
{
    try
    {
        if (!req.user?.login) return response.status(401,"API: Auth required",res);

        const deleteUserFollowingSQL = 'DELETE FROM `user_follows` WHERE `user_login`=? AND `user_follower_login`=?';
        const deleteUserFollowingResult = await queryPromise(deleteUserFollowSQL,[req.params.login,req.user.login]);
        if (!deleteUserFollowingResult.affectedRows) return response.status(404,'API: Following not found',res);

        return response.status(204,'API: Following deleted',res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}

exports.postProfilePicture = async (req,res) =>
{
    try
    {
        if (!req.user?.login) return response.status(401,"API: Auth required",res);

        const postProfilePictureResult = await queryPromise("UPDATE `users` SET `profile_picture` = ? WHERE `login` = ?",[req.file.filename,req.user.login]);

        return response.status(200,'API: User profile picture updated',res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}