const response = require('./../response')
const queryPromise = require('../settings/database')
const fs = require('fs')
const { getAudioDurationInSeconds } = require('get-audio-duration')

exports.getMe = async (req,res) =>
{
    try
    {
        if (!req.user) return response.status(401,'API: Auth required',res);

        const users = await queryPromise('SELECT `login`, `email`, `custom_theme`, `theme`, `accent_color`, `profile_picture` FROM `users` WHERE `login` = ?',[req.user.login]);
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

exports.putTheme = async (req,res) =>
{
    try
    {
        if (!req.user) return response.status(401,'API: Auth required',res);

        const putThemeResult = await queryPromise('UPDATE `users` SET `theme` = ?, `custom_theme` = ? WHERE `login` = ?',[req.body.theme,req.body.customTheme, req.user.login]);
        if (!putThemeResult.affectedRows) return response.status(304,'API: User theme not modified',res);

        return response.status(200,'API: User theme updated',res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}

exports.putAccentColor = async (req,res) =>
{
    try
    {
        if (!req.user) return response.status(401,'API: Auth required',res);

        const putAccentColorResult = await queryPromise('UPDATE `users` SET `accent_color` = ? WHERE `login` = ?',[req.body.accentColor, req.user.login]);
        if (!putAccentColorResult.affectedRows) return response.status(304,'API: User theme not modified',res);

        return response.status(200,'API: User accent color updated',res);
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

exports.postSong = async (req,res) =>
{
    try
    {
        if (!req.user?.login) return response.status(401,"API: Auth required",res);
        const song = JSON.parse(req.body.songJSON);

        const error = { artistsError:[] };

        const artistExistsPromises = song.artists.map
        (
            async (artist,index) =>
            {
                if (artist.login)
                {
                    const userExists = await queryPromise('SELECT EXISTS (SELECT 1 FROM `users` WHERE `login` = ?) AS `exists`',[artist.login]);
                    if (!userExists[0].exists)
                    {
                        error.artistsError.push({index: index, message: "User not found."});
                    }
                }
            }
        )
        await Promise.all(artistExistsPromises);

        if (error.artistsError.length>0) return response.status(400,error,res);

        const audiosrc = req.files.songAudio?.[0].filename;
        const coversrc = req.files.songCover?.[0].filename;
        const duration = Math.floor(await getAudioDurationInSeconds(req.files.songAudio?.[0].path));
        const postSongParams = [song.name, audiosrc, coversrc, duration, new Date().toISOString().slice(0, 19).replace('T', ' '), req.user.login];
        const postSongSQL = "INSERT INTO `songs` (`name`, `audiosrc`, `cover`, `duration`, `created_at`, `created_by`) VALUES (?, ?, ?, ?, ?, ?)";
        const postSongResult = await queryPromise(postSongSQL,postSongParams);

        const addSongArtistsPromises = song.artists.map
        (
            async (artist,index) =>
            {
                const addSongArtistSQL = "INSERT INTO `song_artists` (`songID`, `artistLogin`, `artistName`, `artistSongPosition`) VALUES (?, ?, ?, ?)";
                const addSongArtistResult = await queryPromise(addSongArtistSQL,[postSongResult.insertId,artist.login,artist.pseudoname,index]);
            }
        )
        await Promise.all(addSongArtistsPromises);

        const addSongTagsPromises = song.tags.map
        (
            async (tag) =>
            {
                const addSongTagSQL = "INSERT INTO `audioplayerdb`.`song_tags` (`songID`, `tag`) VALUES (?, ?)";
                const addSongTagResult = await queryPromise(addSongTagSQL,[postSongResult.insertId,tag]);
            }
        )
        await Promise.all(addSongTagsPromises);

        return response.status(201,'API: Song posted',res);
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
        const deleteUserFollowingResult = await queryPromise(deleteUserFollowingSQL,[req.params.login,req.user.login]);
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

        const profilePicture = await queryPromise("SELECT `profile_picture` FROM `users` WHERE `login` = ?",[req.user.login]);
        if (profilePicture[0].profile_picture)
        {
            var filePath = 'upload/images/user images/profile pictures/'+profilePicture[0].profile_picture;
            fs.unlink(filePath, (error) => { if (error) { console.log(error); } } );
        }

        const postProfilePictureResult = await queryPromise("UPDATE `users` SET `profile_picture` = ? WHERE `login` = ?",[req.file.filename,req.user.login]);

        return response.status(200,'API: User profile picture updated',res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}

exports.deleteProfilePicture = async (req,res) =>
{
    try
    {
        if (!req.user?.login) return response.status(401,"API: Auth required",res);

        const profilePicture = await queryPromise("SELECT `profile_picture` FROM `users` WHERE `login` = ?",[req.user.login]);
        if (profilePicture[0].profile_picture)
        {
            var filePath = 'upload/images/user images/profile pictures/'+profilePicture[0].profile_picture;
            fs.unlink(filePath, (error) => { if (error) { console.log(error); } } );
        }

        const deleteProfilePictureResult = await queryPromise("UPDATE `users` SET `profile_picture` = ? WHERE `login` = ?",[null, req.user.login]);

        return response.status(200,'API: User profile picture updated',res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}

exports.postBanner = async (req,res) =>
{
    try
    {
        if (!req.user?.login) return response.status(401,"API: Auth required",res);

        const bannerPicture = await queryPromise("SELECT `banner` FROM `users` WHERE `login` = ?",[req.user.login]);
        if (bannerPicture[0].banner)
        {
            var filePath = 'upload/images/user images/banners/'+bannerPicture[0].banner;
            fs.unlink(filePath, (error) => { if (error) { console.log(error); } } );
        }

        const postBannerResult = await queryPromise("UPDATE `users` SET `banner` = ? WHERE `login` = ?",[req.file.filename,req.user.login]);

        return response.status(200,'API: User banner updated',res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}

exports.deleteBanner = async (req,res) =>
{
    try
    {
        if (!req.user?.login) return response.status(401,"API: Auth required",res);

        const bannerPicture = await queryPromise("SELECT `banner` FROM `users` WHERE `login` = ?",[req.user.login]);
        if (bannerPicture[0].banner)
        {
            var filePath = 'upload/images/user images/banners/'+bannerPicture[0].banner;
            fs.unlink(filePath, (error) => { if (error) { console.log(error); } } );
        }

        const deleteBannerResult = await queryPromise("UPDATE `users` SET `banner` = ? WHERE `login` = ?",[null,req.user.login]);

        return response.status(200,'API: User banner updated',res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}

exports.getRecommendations = async (req,res) =>
{
    try
    {
        if (!req.user?.login) return response.status(401,"API: Auth required",res);
        const recommendedArtistsSQL = "SELECT `login` FROM `view_user_profile` WHERE `songs_count`>0 AND `login`<>? AND `login` NOT IN\
        (SELECT `user_login` as `login` FROM `user_follows` WHERE `user_follower_login`=?) ORDER BY RAND() LIMIT 3";

        let recommendedArtists = await queryPromise(recommendedArtistsSQL,[req.user.login,req.user.login]);
        if (recommendedArtists.length<1) recommendedArtists = {error:{status:404,message:"API: No recommendations"}};
        return response.status(200,recommendedArtists,res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}