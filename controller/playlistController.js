const response = require('./../response')
const queryPromise = require('../settings/database')

exports.getAll = async (req,res) =>
{
    try
    {
        let playlists = await queryPromise("SELECT `id` FROM `playlists` ORDER BY `playlists`.`created_at` DESC");
        if (playlists.length<1) playlists = {error:{status:404,message:'API: Playlists not found'}};

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
        playlist.cover=!!playlist.cover;

        const getPlaylistSongsSQL = "SELECT `id`, ROW_NUMBER() OVER(PARTITION BY null ORDER BY `pos` ASC) - 1 AS `pos` FROM `view_playlist_songs` WHERE `playlistID` = ? ORDER BY `view_playlist_songs`.`pos`";
        const playlistSongs = await queryPromise(getPlaylistSongsSQL,[req.params.id]);
        if (playlistSongs.length<1) playlist.songList = {error:{status:"404", message:"API: Empty playlist"}};
        else playlist.songList = { id: playlist.id, songs: playlistSongs };

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
            const playlistLikeExists = await queryPromise('SELECT EXISTS (SELECT 1 FROM `playlist_likes` WHERE `playlistID` = ? AND `userLogin` = ?) AS `exists`',[req.params.id,req.user.login]);
            playlist.liked = !!playlistLikeExists[0].exists;
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
        const playlistCovers = await queryPromise("SELECT `cover` FROM `playlists` WHERE `id` = ?",[req.params.id]);
        if (playlistCovers.length<1) return response.status(404,'API: Playlist not found',res);
        const playlistCover = playlistCovers[0];

        res.sendFile("upload/images/covers/"+playlistCover.cover,{root: '.'}, function (error)
        {
            if (error) return response.status(404,'API: Playlist cover file not found',res);
        });
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}