const response = require('./../response')
const queryPromise = require('../settings/database')

exports.getAll = async (req,res) =>
{
    try
    {
        const songs = await queryPromise("SELECT `id`,ROW_NUMBER() OVER(PARTITION BY null ORDER BY `songs`.`created_at` DESC) - 1 AS `pos` FROM `songs`");
        if (songs.length<1) return response.status(404,'API: Songs not found',res);
        return response.status(200,{id:'API GET ALL',songs:songs},res);
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
            const songYouLiked = await queryPromise('SELECT `id` FROM `song_likes` WHERE `songID` = ? AND `userLogin` = ?',[req.params.id,req.user.login]);
            song.liked = songYouLiked.length>0;
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
        res.sendFile("audio/"+songAudio.audiosrc,{root: '.'}, (error)=>
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
        const songCovers = await queryPromise("SELECT `coversrc` FROM `songs` WHERE `id` = ?",[req.params.id]);
        if (songCovers.length<1) return response.status(404,'API: Song not found',res);
        const songCover = songCovers[0];
        res.sendFile("images/covers/"+songCover.coversrc,{root: '.'}, function (error)
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
        const songUsersLiked = await queryPromise("SELECT `userLogin` as `login` FROM `song_likes` WHERE `songID` = ? ORDER BY `time` DESC",[req.params.id]);
        if (songUsersLiked.length<1) return response.status(404,'API: No one liked this song yet',res);
        return response.status(200,songUsersLiked,res);
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
        const songPlaylists = await queryPromise("SELECT DISTINCT `playlistID` as `id` FROM `playlist_songs` WHERE `songID` = ?",[req.params.id]);
        if (songPlaylists.length<1) return response.status(404,'API: No one added this song to playlist yet',res);
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
        const getRelatedSongsSQL ="SELECT `songs`.`id`, ROW_NUMBER() OVER(PARTITION BY null ORDER BY count(`songs`.`id`) DESC) - 1 AS `pos` from `songs` INNER JOIN `song_tags` on `song_tags`.`songID` = `songs`.`id` WHERE `song_tags`.`tag` in (SELECT `tag` FROM `song_tags` WHERE `song_tags`.`songID`=?) AND `songs`.`id`!=? GROUP BY (`songs`.`id`)";
        const songs = await queryPromise(getRelatedSongsSQL,[req.params.id,req.params.id]);
        if (songs.length<1) return response.status(404,'API: Related songs not found',res);
        return response.status(200,{id:'API GET RELATED '+req.params.id,songs:songs},res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}

exports.getTaggedPopular = async (req,res) =>
{
    try
    {
        const getTaggedPopularSongsSQL = "SELECT `view_song`.`id`, ROW_NUMBER() OVER(PARTITION BY null ORDER BY `view_song`.`likes_count` DESC) - 1 AS `pos` FROM `song_tags` INNER JOIN `view_song` on `song_tags`.`songID` = `view_song`.`id` WHERE `song_tags`.`tag` = ?";
        const songs = await queryPromise(getTaggedPopularSongsSQL,[req.params.tag]);
        if (songs.length<1) return response.status(404,'API: Songs tagged #'+req.params.tag+' not found',res);
        return response.status(200,{id:'API TAGGED '+req.params.tag+' POPULAR',songs:songs},res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}

exports.getTaggedNew = async (req,res) =>
{
    try
    {
        const getTaggedNewSongsSQL = "SELECT `view_song`.`id`, ROW_NUMBER() OVER(PARTITION BY null ORDER BY `view_song`.`created_at` DESC) - 1 AS `pos` FROM `song_tags` INNER JOIN `view_song` on `song_tags`.`songID` = `view_song`.`id` WHERE `song_tags`.`tag` = ?";
        const songs = await queryPromise(getTaggedNewSongsSQL,[req.params.tag]);
        if (songs.length<1) return response.status(404,'API: Songs tagged #'+req.params.tag+' not found',res);
        return response.status(200,{id:'API TAGGED '+req.params.tag+' NEW',songs:songs},res);
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
        const postSongLikeSQL = 'INSERT INTO `song_likes`(`userLogin`,`songID`,`time`) VALUES (?,?,?)';
        await queryPromise(postSongLikeSQL,[req.user.login,req.params.id,new Date().toISOString().slice(0, 19).replace('T', ' ')]);
        return response.status(201,'API: Song like posted',res);
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
        const deleteSongLikeSQL = 'DELETE FROM `song_likes` WHERE`userLogin`=? AND `songID`=?';
        await queryPromise(deleteSongLikeSQL,[req.user.login,req.params.id]);
        return response.status(201,'API: Song like deleted',res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}