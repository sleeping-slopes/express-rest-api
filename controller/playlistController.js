const response = require('./../response')
const queryPromise = require('../settings/database')

exports.getAll = async (req,res) =>
{
    try
    {
        const playlists = await queryPromise("SELECT `id` FROM `playlists` ORDER BY `playlists`.`created_at` DESC");
        if (playlists.length<1) return response.status(404,'API: Playlists not found',res);
        return response.status(200,playlists,res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}

exports.getByID = async (req,res) =>
{
    try
    {
        const playlists = await queryPromise("SELECT * FROM `view_playlist` WHERE `id` = ?",[req.params.id]);
        if (playlists.length<1) return response.status(404,'API: Playlist not found',res);
        const playlist = playlists[0];
        if (!playlist.name) playlist.name = "Unnamed playlist";

        const getPlaylistSongsSQL = "SELECT `id`, ROW_NUMBER() OVER(PARTITION BY null ORDER BY `pos` ASC) - 1 AS `pos` FROM `view_playlist_songs` WHERE `playlistID` = ? ORDER BY `view_playlist_songs`.`pos`";
        const playlistSongs = await queryPromise(getPlaylistSongsSQL,[req.params.id]);
        if (playlistSongs.length<1) playlist.songList = {error:{status:"404", message:"API: Empty playlist"}};
        else
        {
            playlist.songList = {id:req.params.id,songs:[]};
            playlistSongs.forEach(playlistSong=>
            {
                playlist.songList.songs.push({id:playlistSong.id,pos:playlistSong.pos});
            });
        }

        const getPlaylistArtistsSQL = 'SELECT `login`,`pseudoname`,`username` FROM `view_playlist_artists` WHERE `playlistID` = ? ORDER BY `view_playlist_artists`.`artistPlaylistPosition`';
        const playlistArtists = await queryPromise(getPlaylistArtistsSQL,[req.params.id]);
        playlist.artists = [];
        if (playlistArtists.length<1) { playlist.artists.push({name:"Unknown artist"}); }
        else
        {
            playlistArtists.forEach(playlistArtist=>
            {
                playlist.artists.push({login:playlistArtist.login,name:playlistArtist.pseudoname || playlistArtist.username || playlistArtist.login});
            });
        }
        if (req.user)
        {
            const playlistYouLiked = await queryPromise('SELECT `id` FROM `playlist_likes` WHERE `playlistID` = ? AND `userLogin` = ?',[playlist.id,req.user.login]);
            playlist.liked = playlistYouLiked.length>0;
        }
        else playlist.liked = false;
        return response.status(200,playlist,res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}

exports.getCover = async (req,res) =>
{
    try
    {
        const playlistCovers = await queryPromise("SELECT `coversrc` FROM `playlists` WHERE `id` = ?",[req.params.id]);
        if (playlistCovers.length<1) return response.status(404,'API: Playlist not found',res);
        const playlistCover = playlistCovers[0];

        res.sendFile("images/covers/"+playlistCover.coversrc,{root: '.'}, function (error)
        {
            if (error) return response.status(404,'API: Playlist cover file not found',res);
        });
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}

exports.postLike = async (req,res) =>
{
    try
    {
        if (!req.user?.login) return response.status(401,"API: Auth required",res);
        const postPlaylistLikeSQL = 'INSERT INTO `playlist_likes`(`userLogin`,`playlistID`,`time`) VALUES (?,?,?)';
        await queryPromise(postPlaylistLikeSQL,[req.user.login,req.params.id,new Date().toISOString().slice(0, 19).replace('T', ' ')]);
        return response.status(201,'API: Playlist like posted',res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}

exports.deleteLike = async (req,res) =>
{
    try
    {
        if (!req.user?.login) return response.status(401,"API: Auth required",res);
        const deletePlaylistLikeSQL = 'DELETE FROM `playlist_likes` WHERE`userLogin`=? AND `playlistID`=?';
        await queryPromise(deletePlaylistLikeSQL,[req.user.login,req.params.id]);
        return response.status(201,'API: Playlist like deleted',res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}