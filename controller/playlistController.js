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
            response.status(404,{error: 'playlist not found'},res);
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

                    response.status(200,row,res);
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
            response.status(404,{error: 'playlist not found'},res);
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