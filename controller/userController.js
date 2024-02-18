const response = require('./../response')
const queryPromise = require('../settings/database')

const jwt = require('jsonwebtoken')
const config = require('../config')

exports.postUser = async (req,res) =>
{
    try
    {
        const users = await queryPromise("SELECT `login`,`email` FROM `users` WHERE `email` =  ? OR `login` = ?", [req.body.email,req.body.login]);
        if (users.length>0)
        {
            const error = {};
            users.map(user=>
            {
                if (user.email==req.body.email) error.emailError = 'Account with this email already exists.';
                if (user.login==req.body.login) error.loginError = 'Account with this login already exists.';
                return true;
            });
            return response.status(409,error,res);
        }

        await queryPromise('INSERT INTO `users`(`login`,`email`,`password`) VALUES (?,?,?)', [req.body.login,req.body.email,req.body.password]);

        const token = jwt.sign({ login: req.body.login },config.JWTSECRET);
        const currentUser = await queryPromise('SELECT `login`, `email`,`theme`, `custom_theme`, `profile_picture` FROM `users` WHERE `login` = ?',[req.body.login]);
        if (currentUser.length<1) return response.status(404,'API: User not found',res);
        const loginData = { loginData: {authJWT: "Bearer " + token, user: currentUser[0]} };

        return response.status(201,loginData,res);
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
        const users = await queryPromise('SELECT `username` FROM `users` WHERE `login` = ?',[req.params.login]);
        if (users.length<1) return response.status(404,'API: User not found',res);
        const user = users[0];

        if (!user.username) user.username = req.params.login;

        return response.status(200,user,res);
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
        const users = await queryPromise('SELECT * FROM `view_user_profile` WHERE `login` = ?',[req.params.login]);
        if (users.length<1) return response.status(404,'API: User not found',res);
        const user = users[0];

        if (!user.username) user.username = req.params.login;
        user.banner = !!user.banner;
        user.profile_picture = !!user.profile_picture;

        const userLinks = await queryPromise('SELECT `url`,`description` FROM `user_links` WHERE `userLogin` = ?',[req.params.login]);
        userLinks.forEach(userLink => { if (!userLink.description) userLink.description=userLink.url });
        user.links=userLinks;

        if (req.user)
        {
            if (req.user.login==req.params.login) user.me=true;
            else
            {
                const userFollowingExists = await queryPromise('SELECT EXISTS (SELECT 1 FROM `user_follows` WHERE `user_login` = ? AND `user_follower_login` = ?) AS `exists`',[req.params.login,req.user.login]);
                user.youFollow = !!userFollowingExists[0].exists;

                const userFollowExists = await queryPromise('SELECT EXISTS (SELECT 1 FROM `user_follows` WHERE `user_login` = ? AND `user_follower_login` = ?) AS `exists`',[req.user.login,req.params.login]);
                user.followsYou = !!userFollowExists[0].exists;
            }
        }

        return response.status(200,user,res);
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
        const playlist = { id:'[API] '+req.params.login+"\'S ALL SONGS", name:req.params.login+"\'s all songs", artists:[{name:"Auto generated"}] };

        const getUserAllSongsSQL = "SELECT `id`, ROW_NUMBER() OVER(PARTITION BY null) - 1 AS `pos` FROM\
        (SELECT DISTINCT `id` FROM\
        (SELECT `id` as `id`, `created_at` as `time` FROM `songs` WHERE `created_by` = ?\
        UNION SELECT `songID` as `id`, `created_at` as `time` FROM `view_song_artists` WHERE `login` = ?\
        UNION SELECT `songID` as `id`, `time` FROM `song_likes` WHERE `userLogin` = ?) as a\
        ORDER BY `time` DESC) as b";
        const songs = await queryPromise(getUserAllSongsSQL,[req.params.login,req.params.login,req.params.login]);
        if (songs.length<1) playlist.songList = {error:{status:"404", message:"API: User has not created or liked any song yet"}};
        else playlist.songList = { id: playlist.id, songs: songs };

        return response.status(200, playlist, res);
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
        const orderColumn =  (req.query["popular"] || req.query["popular"]==="")?"likes_count":"created_at";

        const playlist = { id:'[API] '+req.params.login+"\'S CREATED SONGS", name:req.params.login+"\'s created songs", artists:[{name:"Auto generated"}] };

        const getUserCreatedSongsSQL = "SELECT `id`, ROW_NUMBER() OVER(PARTITION BY null ORDER BY ?? DESC) - 1 AS `pos` FROM `view_song` WHERE `id` IN\
        (SELECT `id` as `id` FROM `songs` WHERE `created_by` = ?\
        UNION SELECT DISTINCT `songID` as `id` FROM `song_artists` WHERE `artistLogin` = ?)";
        const songs = await queryPromise(getUserCreatedSongsSQL,[orderColumn,req.params.login,req.params.login]);
        if (songs.length<1) playlist.songList = {error:{status:"404", message:"API: User has not created any song yet"}};
        else playlist.songList = { id: playlist.id, songs: songs };
        return response.status(200,playlist,res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}

exports.getSongLikes = async (req,res) =>
{
    try
    {
        const playlist = { id:'[API] '+req.params.login+"\'S LIKED SONGS", name:req.params.login+"\'s liked songs", artists:[{name:"Auto generated"}] };

        const getUserSongLikesSQL = 'SELECT `songID` as `id`, ROW_NUMBER() OVER(PARTITION BY null ORDER BY `song_likes`.`time` DESC) - 1 AS `pos` FROM `song_likes` WHERE `userLogin` = ?';
        const songs = await queryPromise(getUserSongLikesSQL,[req.params.login]);
        if (songs.length<1) playlist.songList = {error:{status:"404", message:"API: User has not liked any song yet"}};
        else playlist.songList = { id: playlist.id, songs: songs };

        return response.status(200,playlist,res);
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
        const getUserAllPlaylistsSQL = "SELECT DISTINCT `id` FROM\
        (SELECT `id` as `id`,`created_at` as `time` FROM `playlists` WHERE `created_by` = ?\
        UNION SELECT `playlistID` as `id`,`created_at` as `time` FROM `view_playlist_artists` WHERE `login` = ?\
        UNION SELECT `playlistID` as `id`,`time` FROM `playlist_likes` WHERE `userLogin` = ?\
        ) as a\
        ORDER by `time` DESC";
        let playlists = await queryPromise(getUserAllPlaylistsSQL,[req.params.login,req.params.login,req.params.login]);
        if (playlists.length<1) playlists = {error:{status:404,message:"API: User has not created or liked any playlist yet"}};

        return response.status(200,playlists,res);
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
        const orderColumn =  (req.query["popular"] || req.query["popular"]==="")?"likes_count":"created_at";

        const getUserCreatedPlaylistsSQL = "SELECT `id`, ROW_NUMBER() OVER(PARTITION BY null ORDER BY ?? DESC) - 1 AS `pos` FROM `view_playlist` WHERE `id` IN\
        (SELECT `id` as `id` FROM `playlists` WHERE `created_by` = ?\
        UNION SELECT DISTINCT `playlistID` as `id` FROM `playlist_artists` WHERE `artistLogin` = ?)";
        let playlists = await queryPromise(getUserCreatedPlaylistsSQL,[orderColumn,req.params.login,req.params.login]);
        if (playlists.length<1) playlists = {error:{status:404,message:"API: User has not created any playlist yet"}};

        return response.status(200,playlists,res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}

exports.getPlaylistLikes = async (req,res) =>
{
    try
    {
        const getPlaylistLikesSQL = "SELECT `playlistID` as `id` FROM `playlist_likes` WHERE `userLogin` = ? ORDER BY `playlist_likes`.`time` DESC";
        let playlists = await queryPromise(getPlaylistLikesSQL,[req.params.login]);
        if (playlists.length<1) playlists = {error:{status:404,message:"API: User has not liked any playlist yet"}};

        return response.status(200,playlists,res);
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
        const userProfilePictures = await queryPromise("SELECT `profile_picture` FROM `users` WHERE `login` = ?",[req.params.login]);
        if (userProfilePictures.length<1) return response.status(404,'API: User not found',res);
        const userProfilePicture = userProfilePictures[0];

        res.sendFile("upload/images/user images/profile pictures/"+userProfilePicture.profile_picture,{root: '.'}, function (error)
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
        const userBanners = await queryPromise("SELECT `banner` FROM `users` WHERE `login` = ?",[req.params.login]);
        if (userBanners.length<1) return response.status(404,'API: User not found',res);
        const userBanner = userBanners[0];

        res.sendFile("upload/images/user images/banners/"+userBanner.banner,{root: '.'}, function (error)
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
        let userFollowers = await queryPromise("SELECT `user_follower_login` as `login` FROM `user_follows` WHERE `user_login` = ? ORDER BY `time` DESC",[req.params.login]);
        if (userFollowers.length<1) userFollowers = {error:{status:404,message:"API: User has not any followers yet"}};

        return response.status(200,userFollowers,res);
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
        let userFollowings = await queryPromise("SELECT `user_login` as `login` FROM `user_follows` WHERE `user_follower_login` = ? ORDER BY `time` DESC",[req.params.login]);
        if (userFollowings.length<1) userFollowings = {error:{status:404,message:"API: User has not following anyone yet"}};

        return response.status(200,userFollowings,res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}