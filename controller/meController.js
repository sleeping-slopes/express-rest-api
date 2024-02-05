const response = require('./../response')
const queryPromise = require('../settings/database')

exports.getByVerifiedJWT = async (req,res) =>
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

exports.putProfile = async (req,res) =>
{
    try
    {
        if (!req.user?.login) return response.status(401,"API: Auth required",res);
        const putUserProfileSQL = 'UPDATE `users` SET `username` = ?, `status` = ?,`city` = ?,`country` = ?,`bio` = ? WHERE (`login` = ?)';
        await queryPromise(putUserProfileSQL,[req.body.username,req.body.status,req.body.city,req.body.country,req.body.bio,req.user.login]);

        const deleteAllLinksSQL = 'DELETE FROM `user_links` WHERE`userLogin` = ?'
        await queryPromise(deleteAllLinksSQL,[req.user.login]);

        for (let i = 0;i<req.body.links.length;i++)
        {
            const insertLinkSQL = 'INSERT INTO `user_links` (`userLogin`, `url`, `description`) VALUES (?, ?, ?)';
            await queryPromise(insertLinkSQL,[req.user.login,req.body.links[i].url,req.body.links[i].description || req.body.links[i].url]);
        }

        return response.status(201,'API: User profile updated',res);
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
                return response.status(201,'API: Song like added',res);

            case "remove":
                const deleteSongLikeSQL = 'DELETE FROM `song_likes` WHERE`userLogin`=? AND `songID`=?';
                await queryPromise(deleteSongLikeSQL,[req.user.login,req.body.id]);
                return response.status(201,'API: Song like removed',res);

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
                return response.status(201,'API: Playlist like added',res);

            case "remove":
                const deletePlaylistLikeSQL = 'DELETE FROM `playlist_likes` WHERE`userLogin`=? AND `playlistID`=?';
                await queryPromise(deletePlaylistLikeSQL,[req.user.login,req.body.id]);
                return response.status(201,'API: Playlist like removed',res);

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
                return response.status(201,'API: Follow added',res);

            case "remove":
                const deleteUserFollowSQL = 'DELETE FROM `user_follows` WHERE `user_login`=? AND `user_follower_login`=?';
                await queryPromise(deleteUserFollowSQL,[req.body.login,req.user.login]);
                return response.status(201,'API: Follow deleted',res);

            default:
                throw new Error("API: Unknown op");
        }
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}