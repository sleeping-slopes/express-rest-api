const response = require('./../response')
const queryPromise = require('../settings/database')

exports.getAll = async (req,res) =>
{
    try
    {
        const playlist = { id:'[API] ALL SONGS', name:"All songs", artists:[{name:"Auto generated"}] };

        const songs = await queryPromise("SELECT `id`,ROW_NUMBER() OVER(PARTITION BY null ORDER BY `songs`.`created_at` DESC) - 1 AS `pos` FROM `songs`");
        if (songs.length<1) playlist.songList = {error:{status:"404", message:"API: Songs not found"}};
        else playlist.songList = { id: playlist.id, songs: songs };

        return response.status(200,playlist,res);
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
        const songs = await queryPromise("SELECT * FROM `view_song` WHERE `id` = ?",[req.params.id]);
        if (songs.length<1) return response.status(404,'API: Song not found',res);

        const song = songs[0];
        if (!song.name) song.name = "Unnamed song";
        song.cover=!!song.cover;
        song.artists = [];

        const getSongArtistsSQL = 'SELECT `login`,`username`,`pseudoname` FROM `view_song_artists` WHERE `songID` = ? ORDER BY `view_song_artists`.`artistSongPosition`';
        const songArtists = await queryPromise(getSongArtistsSQL,[req.params.id]);
        if (songArtists.length<1) { song.artists.push({name:"Unknown artist"}); }
        else
        {
            songArtists.forEach(songArtist=>
            {
                song.artists.push({login:songArtist.login,name:songArtist.pseudoname || songArtist.username || songArtist.login});
            });
        }

        const songTags = await queryPromise('SELECT `tag` FROM `song_tags` WHERE `songID` = ?',[req.params.id]);
        song.tags = songTags;

        if (req.user)
        {
            const songLikeExists = await queryPromise('SELECT EXISTS (SELECT 1 FROM `song_likes` WHERE `songID` = ? AND `userLogin` = ?) AS `exists`',[req.params.id,req.user.login]);
            song.liked = !!songLikeExists[0].exists;
        }
        else song.liked = false;

        return response.status(200,song,res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}

exports.getAudio = async (req,res) =>
{
    try
    {
        const songAudios = await queryPromise("SELECT `audiosrc` FROM `songs` WHERE `id` = ?",[req.params.id]);
        if (songAudios.length<1) return response.status(404,'API: Song not found',res);
        const songAudio = songAudios[0];

        res.sendFile("upload/audio/"+songAudio.audiosrc,{root: '.'}, (error)=>
        {
            if (error) return response.status(404,'API: Song audio file not found',res);
        });
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
        const songCovers = await queryPromise("SELECT `cover` FROM `songs` WHERE `id` = ?",[req.params.id]);
        if (songCovers.length<1) return response.status(404,'API: Song not found',res);
        const songCover = songCovers[0];

        res.sendFile("upload/images/covers/"+songCover.cover,{root: '.'}, function (error)
        {
            if (error) return response.status(404,'API: Song cover file not found',res);
        });
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}

exports.getLikes = async (req,res) =>
{
    try
    {
        let songLikes = await queryPromise("SELECT `userLogin` as `login` FROM `song_likes` WHERE `songID` = ? ORDER BY `time` DESC",[req.params.id]);
        if (songLikes.length<1) songLikes = {error:{status:404,message:'API: No one liked this song yet'}};

        return response.status(200,songLikes,res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}

exports.getPlaylists = async (req,res) =>
{
    try
    {
        let songPlaylists = await queryPromise("SELECT DISTINCT `playlistID` as `id` FROM `playlist_songs` WHERE `songID` = ?",[req.params.id]);
        if (songPlaylists.length<1) songPlaylists = {error:{status:404,message:'API: No one added this song to playlist yet'}};

        return response.status(200,songPlaylists,res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}

exports.getRelated = async (req,res) =>
{
    try
    {
        const playlist = { id:'[API] SONG ID'+req.params.id+' RELATED', name:"Songs related to id"+req.params.id, artists:[{name:"Auto generated"}] };

        const getRelatedSongsSQL ="SELECT `songs`.`id`, ROW_NUMBER() OVER(PARTITION BY null ORDER BY count(`songs`.`id`) DESC) - 1 AS `pos` from `songs`\
        INNER JOIN `song_tags` on `song_tags`.`songID` = `songs`.`id` WHERE `song_tags`.`tag` IN\
        (SELECT `tag` FROM `song_tags` WHERE `song_tags`.`songID`=?) AND `songs`.`id`!=? GROUP BY (`songs`.`id`)";
        const songs = await queryPromise(getRelatedSongsSQL,[req.params.id,req.params.id]);
        if (songs.length<1) playlist.songList = {error:{status:"404", message:"API: Related songs not found"}};
        else playlist.songList = { id: playlist.id, songs: songs };

        return response.status(200,playlist,res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}

exports.getTaggedSongs = async (req,res) =>
{
    try
    {
        const orderColumn =  (req.query["popular"] || req.query["popular"]==="")?"likes_count":"created_at";

        const playlist = { id:'[API] TAGGED #'+req.params.tag, name:"Songs tagged #"+req.params.tag, artists:[{name:"Auto generated"}] };

        const getTaggedPopularSongsSQL = "SELECT `view_song`.`id`, ROW_NUMBER() OVER(PARTITION BY null ORDER BY ?? DESC) - 1 AS `pos` FROM `song_tags` INNER JOIN `view_song` ON `song_tags`.`songID` = `view_song`.`id` WHERE `song_tags`.`tag` = ?";
        const songs = await queryPromise(getTaggedPopularSongsSQL,[orderColumn,req.params.tag]);
        if (songs.length<1) playlist.songList = {error:{status:"404", message:'API: Songs tagged #'+req.params.tag+' not found'}};
        else playlist.songList = { id: playlist.id, songs: songs };

        return response.status(200,playlist,res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}