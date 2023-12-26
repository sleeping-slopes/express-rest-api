const response = require('./../response')
const connection = require('../settings/database')

exports.getAll = (req,res) =>
{
    connection.query("SELECT `id`,ROW_NUMBER() OVER(PARTITION BY null ORDER BY `songs`.`created_at` DESC) AS `pos` FROM `songs`",(error,rows,fields)=>
    {
        if (error) return response.status(400,error,res);
        if (rows.length<1) return response.status(404,'API Songs not found',res);
        return response.status(200,{id:'API GET ALL',songs:rows},res);
    })
}

exports.getByID = (req,res) =>
{
    connection.query("SELECT * FROM `view_song` WHERE `id` = ?",[req.params.id],(error,rows,fields)=>
    {
        if (error) return response.status(400,error,res);
        if (rows.length<1) return response.status(404,'Song not found',res);
        const row = rows[0];
        row.artists = [];
        connection.query('SELECT `login`,`username`,`pseudoname` FROM `view_song_artists` WHERE `songID` = ? ORDER BY `view_song_artists`.`artistSongPosition`',[row.id],(error,artists)=>
        {
            if (error) return response.status(400,error,res);
            artists.forEach(artist=>
            {
                row.artists.push({login:artist.login,name:artist.pseudoname || artist.username || artist.login});
            });
            if (req.user)
                connection.query('SELECT `id` FROM `song_likes` WHERE `songID` = ? AND `userLogin` = ?',[row.id,req.user.login],(error,likes)=>
                {
                    if (error) return response.status(400,error,res);
                    row.liked = (likes.length>0);
                    return response.status(200,row,res);
                });
            else
            {
                row.liked = false;
                return response.status(200,row,res);
            }
        })
    })
}

exports.getAudio = (req,res) =>
{
    connection.query("SELECT `audiosrc` FROM `songs` WHERE `id` = ?",[req.params.id],(error,rows,fields)=>
    {
        if (error) return response.status(400,error,res);
        if (rows.length<1) return response.status(404,'Song not found',res);
        const row = rows[0];
        res.sendFile("audio/"+row.audiosrc,{root: '.'}, (error)=>
        {
            if (error) return response.status(error.status,error,res);
        });
    })
}

exports.getCover = (req,res) =>
{
    connection.query("SELECT `coversrc` FROM `songs` WHERE `id` = ?",[req.params.id],(error,rows,fields)=>
    {
        if (error) return response.status(400,error,res);
        if (rows.length<1) return response.status(404,'Song not found',res);
        const row = rows[0];
        res.sendFile("images/covers/"+row.coversrc,{root: '.'}, function (error)
        {
            if (error) return response.status(error.status,error,res);
        });
    })
}

exports.getLikes = (req,res) =>
{
    connection.query("SELECT `userLogin` as `login` FROM `song_likes` WHERE `songID` = ? ORDER BY `time` DESC",[req.params.id],(error,rows,fields)=>
    {
        if (error) return response.status(400,error,res);
        return response.status(200,rows,res);
    })
}

exports.getPlaylists = (req,res) =>
{
    connection.query("SELECT DISTINCT `playlistID` as `id` FROM `playlist_songs` WHERE `songID` = ?",[req.params.id],(error,rows,fields)=>
    {
        if (error) return response.status(400,error,res);
        return response.status(200,rows,res);
    })
}

exports.postLike = (req,res) =>
{
    if (!req.user?.login) return response.status(401,"no auth",res);
    const sql = 'INSERT INTO `song_likes`(`userLogin`,`songID`,`time`) VALUES (?,?,?)';
    connection.query(sql,[req.user.login,req.params.id,new Date().toISOString().slice(0, 19).replace('T', ' ')],(error,results)=>
    {
        if (error) return response.status(400,error,res);
        return response.status(201,'Song liked',res);
    })
}

exports.deleteLike = (req,res) =>
{
    if (!req.user?.login) return response.status(401,"no auth",res);
    const sql = 'DELETE FROM `song_likes` WHERE`userLogin`=? AND `songID`=?';
    connection.query(sql,[req.user.login,req.params.id],(error,results)=>
    {
        if (error) return response.status(400,error,res);
        return response.status(201,'Song disliked',res);
    })
}