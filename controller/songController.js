const response = require('./../response')
const connection = require('../settings/database')

exports.getAll = (req,res) =>
{
    connection.query("SELECT `id`,ROW_NUMBER() OVER(PARTITION BY null ORDER BY `songs`.`created_at` DESC) AS `pos` FROM `songs`",(error,rows,fields)=>
    {
        if (error)
        {
            response.status(400,error,res);
        }
        else
        {
            response.status(200,rows,res);
        }
    })
}

exports.getByID = (req,res) =>
{
    connection.query("SELECT `id`,`name`,`duration` FROM `songs` WHERE `id` = ?",[req.params.id],(error,rows,fields)=>
    {
        if (error)
        {
            response.status(400,error,res);
        }
        else if (rows.length<1)
        {
            response.status(404,'Song not found',res);
        }
        else
        {
            const row = rows[0];
            row.artists = [];
            connection.query('SELECT `login`,`username`,`pseudoname` FROM `view_song_artists` WHERE `songID` = ? ORDER BY `view_song_artists`.`artistSongPosition`',[row.id],(error,artists)=>
            {
                if (error)
                {
                    response.status(400,error,res);
                }
                else
                {
                    artists.forEach(artist=>
                    {
                        row.artists.push({login:artist.login,name:artist.pseudoname || artist.username || artist.login});
                    });
                    if (req.user)
                        connection.query('SELECT `id` FROM `song_likes` WHERE `songID` = ? AND `userLogin` = ?',[row.id,req.user.login],(error,likes)=>
                        {
                            if (error)
                            {
                                response.status(400,error,res);
                            }
                            else
                            {
                                if (likes.length>0) row.liked = true;
                                response.status(200,row,res);
                            }
                        });
                    else response.status(200,row,res);
                }
            })
        }
    })
}

exports.getAudio = (req,res) =>
{
    connection.query("SELECT `audiosrc` FROM `songs` WHERE `id` = ?",[req.params.id],(error,rows,fields)=>
    {
        if (error)
        {
            response.status(400,error,res);
        }
        else if (rows.length<1)
        {
            response.status(404,'Song not found',res);
        }
        else
        {
            const row = rows[0];
            res.sendFile("audio/"+row.audiosrc,{root: '.'}, (error)=>
            {
                if (error) response.status(error.status,error,res);
            });
        }
    })
}

exports.getCover = (req,res) =>
{
    connection.query("SELECT `coversrc` FROM `songs` WHERE `id` = ?",[req.params.id],(error,rows,fields)=>
    {
        if (error)
        {
            response.status(400,error,res);
        }
        else if (rows.length<1)
        {
            response.status(404,'Song not found',res);
        }
        else
        {
            const row = rows[0];
            res.sendFile("images/covers/"+row.coversrc,{root: '.'}, function (error)
            {
                if (error)
                {
                  response.status(error.status,error,res);
                }
            });
        }
    })
}

exports.postLike = (req,res) =>
{
    const sql = 'INSERT INTO `song_likes`(`userLogin`,`songID`,`time`) VALUES (?,?,?)';
    connection.query(sql,[req.user.login,req.params.id,new Date().toISOString().slice(0, 19).replace('T', ' ')],(error,results)=>
    {
        if (error)
        {
            response.status(400,error,res);
        }
        else
        {
            response.status(200,'Song liked',res);
        }
    })
}

exports.deleteLike = (req,res) =>
{
    const sql = 'DELETE FROM `song_likes` WHERE`userLogin`=? AND `songID`=?';
    connection.query(sql,[req.user.login,req.params.id],(error,results)=>
    {
        if (error)
        {
            response.status(400,error,res);
        }
        else
        {
            response.status(200,'Song disliked',res);
        }
    })
}