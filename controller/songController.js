const response = require('./../response')
const queryPromise = require('../settings/database')

exports.getAll = async (req,res) =>
{
    try
    {
        const rows = await queryPromise("SELECT `id`,ROW_NUMBER() OVER(PARTITION BY null ORDER BY `songs`.`created_at` DESC) - 1 AS `pos` FROM `songs`");
        if (rows.length<1) return response.status(404,'API Songs not found',res);
        return response.status(200,{id:'API GET ALL',songs:rows},res);
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
        const rows = await queryPromise("SELECT * FROM `view_song` WHERE `id` = ?",[req.params.id]);
        if (rows.length<1) return response.status(404,'API: Song not found',res);
        const row = rows[0];
        row.artists = [];
        const artists = await queryPromise('SELECT `login`,`username`,`pseudoname` FROM `view_song_artists` WHERE `songID` = ? ORDER BY `view_song_artists`.`artistSongPosition`',[req.params.id]);
        artists.forEach(artist=>
        {
            row.artists.push({login:artist.login,name:artist.pseudoname || artist.username || artist.login});
        });
        if (req.user)
        {
            const likes = await queryPromise('SELECT `id` FROM `song_likes` WHERE `songID` = ? AND `userLogin` = ?',[req.params.id,req.user.login]);
            row.liked = (likes.length>0);
        }
        else row.liked = false;
        return response.status(200,row,res);
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
        const rows = await queryPromise("SELECT `audiosrc` FROM `songs` WHERE `id` = ?",[req.params.id]);
        if (rows.length<1) return response.status(404,'API: Song not found',res);
        const row = rows[0];
        res.sendFile("audio/"+row.audiosrc,{root: '.'}, (error)=>
        {
            if (error) return response.status(error.status,error,res);
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
        const rows = await queryPromise("SELECT `coversrc` FROM `songs` WHERE `id` = ?",[req.params.id]);
        if (rows.length<1) return response.status(404,'API: Song not found',res);
        const row = rows[0];
        res.sendFile("images/covers/"+row.coversrc,{root: '.'}, function (error)
        {
            if (error) return response.status(error.status,error,res);
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
        const rows = await queryPromise("SELECT `userLogin` as `login` FROM `song_likes` WHERE `songID` = ? ORDER BY `time` DESC",[req.params.id]);
        return response.status(200,rows,res);
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
        const rows = await queryPromise("SELECT DISTINCT `playlistID` as `id` FROM `playlist_songs` WHERE `songID` = ?",[req.params.id]);
        return response.status(200,rows,res);
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
        if (!req.user?.login) return response.status(401,"API: No auth",res);
        const sql = 'INSERT INTO `song_likes`(`userLogin`,`songID`,`time`) VALUES (?,?,?)';
        await queryPromise(sql,[req.user.login,req.params.id,new Date().toISOString().slice(0, 19).replace('T', ' ')]);
        return response.status(201,'API: Song liked',res);
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
        if (!req.user?.login) return response.status(401,"API: No auth",res);
        const sql = 'DELETE FROM `song_likes` WHERE`userLogin`=? AND `songID`=?';
        await queryPromise(sql,[req.user.login,req.params.id]);
        return response.status(201,'API: Song disliked',res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}