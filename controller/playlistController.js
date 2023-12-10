const response = require('./../response')
const connection = require('../settings/database')

exports.getAll = (req,res) =>
{
    connection.query("SELECT `id` FROM `playlists` ORDER BY `playlists`.`created_at` DESC",(error,rows,fields)=>
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
    connection.query("SELECT `id`,`name` FROM `playlists` WHERE `id` = ?",[req.params.id],(error,rows,fields)=>
    {
        if (error)
        {
            response.status(400,error,res);
        }
        else if (rows.length<1)
        {
            response.status(404,{message: 'Playlist not found'},res);
        }
        else
        {
            const row = rows[0];
            row.artists = [];
            connection.query('SELECT `login`,`pseudoname`,`username` FROM `view_playlist_artists` WHERE `playlistID` = ? ORDER BY `view_playlist_artists`.`artistPlaylistPosition`',[row.id],(error,artists)=>
            {
                if (error)
                {
                    response.status(400,error,res);
                }
                else
                {
                    artists.forEach(artist=>
                    {
                        row.artists.push({login:artist.login,name:artist.pseudoname?artist.pseudoname:artist.username});
                    });
                    if (req.user)
                        connection.query('SELECT `id` FROM `playlist_likes` WHERE `playlistID` = ? AND `userLogin` = ?',[row.id,req.user.login],(error,likes)=>
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

exports.getSongs = (req,res) =>
{
    connection.query("SELECT `id`,`pos` FROM `view_playlist_songs` WHERE `playlistID` = ? ORDER BY `view_playlist_songs`.`pos`",[req.params.id],(error,rows,fields)=>
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

exports.getCover = (req,res) =>
{
    connection.query("SELECT `coversrc` FROM `playlists` WHERE `id` = ?",[req.params.id],(error,rows,fields)=>
    {
        if (error)
        {
            response.status(400,error,res);
        }
        else if (rows.length<1)
        {
            response.status(404,{message: 'Playlist not found'},res);
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
    const sql = 'INSERT INTO `playlist_likes`(`userLogin`,`playlistID`,`time`) VALUES (?,?,?)';
    connection.query(sql,[req.user.login,req.params.id,new Date().toISOString().slice(0, 19).replace('T', ' ')],(error,results)=>
    {
        if (error)
        {
            response.status(400,error,res);
        }
        else
        {
            response.status(200,{message: 'Playlist liked'},res);
        }
    })
}

exports.deleteLike = (req,res) =>
{
    const sql = 'DELETE FROM `playlist_likes` WHERE`userLogin`=? AND `playlistID`=?';
    connection.query(sql,[req.user.login,req.params.id],(error,results)=>
    {
        if (error)
        {
            response.status(400,error,res);
        }
        else
        {
            response.status(200,{message: 'Playlist disliked'},res);
        }
    })
}