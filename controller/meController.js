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
        if (!deleteMeResult.affectedRows) return response.status(304,'API: User not modified',res)

        return response.status(204, 'API: User deleted');
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

exports.patchSongLikes = async (req,res) =>
{
    try
    {
        if (!req.user?.login) return response.status(401,"API: Auth required",res);
        switch (req.body.op)
        {
            case "add":
                const postSongLikeSQL = 'INSERT INTO `song_likes`(`userLogin`,`songID`,`time`) VALUES (?,?,?)';
                await queryPromise(postSongLikeSQL,[req.user.login,req.body.id,new Date().toISOString().slice(0, 19).replace('T', ' ')]);
                return response.status(200,'API: Song like added',res);

            case "remove":
                const deleteSongLikeSQL = 'DELETE FROM `song_likes` WHERE`userLogin`=? AND `songID`=?';
                const deleteSongLikeResult = await queryPromise(deleteSongLikeSQL,[req.user.login,req.body.id]);
                if (!deleteSongLikeResult.affectedRows) return response.status(304,'API: User song likes not modified',res);
                return response.status(204,'API: Song like removed',res);

            default:
                throw new Error("API: Unknown op");
        }
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}

exports.patchPlaylistLikes = async (req,res) =>
{
    try
    {
        if (!req.user?.login) return response.status(401,"API: Auth required",res);

        switch (req.body.op)
        {
            case "add":
                const postPlaylistLikeSQL = 'INSERT INTO `playlist_likes`(`userLogin`,`playlistID`,`time`) VALUES (?,?,?)';
                await queryPromise(postPlaylistLikeSQL,[req.user.login,req.body.id,new Date().toISOString().slice(0, 19).replace('T', ' ')]);
                return response.status(200,'API: Playlist like added',res);

            case "remove":
                const deletePlaylistLikeSQL = 'DELETE FROM `playlist_likes` WHERE`userLogin`=? AND `playlistID`=?';
                const deletePlaylistLikeResult = await queryPromise(deletePlaylistLikeSQL,[req.user.login,req.body.id]);
                if (!deletePlaylistLikeResult.affectedRows) return response.status(304,'API: User playlist likes not modified',res);
                return response.status(204,'API: Playlist like removed',res);

            default:
                throw new Error("API: Unknown op");
        }
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}

exports.patchFollowing = async (req,res) =>
{
    try
    {
        if (!req.user?.login) return response.status(401,"API: Auth required",res);

        switch (req.body.op)
        {
            case "add":
                const postUserFollowSQL = 'INSERT INTO `user_follows`(`user_login`,`user_follower_login`,`time`) VALUES (?,?,?)';
                await queryPromise(postUserFollowSQL,[req.body.login,req.user.login,new Date().toISOString().slice(0, 19).replace('T', ' ')]);
                return response.status(200,'API: Follow added',res);

            case "remove":
                const deleteUserFollowSQL = 'DELETE FROM `user_follows` WHERE `user_login`=? AND `user_follower_login`=?';
                const deleteUserFollowResult = await queryPromise(deleteUserFollowSQL,[req.body.login,req.user.login]);
                if (!deleteUserFollowResult.affectedRows) return response.status(304,'API: User follows not modified',res);
                return response.status(204,'API: Follow deleted',res);

            default:
                throw new Error("API: Unknown op");
        }
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}