const response = require('./../response')
const connection = require('../settings/database')

exports.getAll = (req,res) =>
{
    connection.query("SELECT `id`,`id` as `pos` FROM `songs`",(error,rows,fields)=>
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
    connection.query("SELECT `id`,`name` FROM `songs` WHERE `id` = ?",[req.params.id],(error,rows,fields)=>
    {
        if (error)
        {
            response.status(400,error,res);
        }
        else if (rows.length<1)
        {
            response.status(404,{error: 'song not found'},res);
        }
        else
        {
            const row = rows[0];
            row.artists = [];
            row.duration = 666;
            connection.query('SELECT * FROM `view_song_artists` WHERE `songID` = ?',[row.id],(error,artists)=>
            {
                if (error)
                {
                    response.status(400,error,res);
                }
                else
                {
                    artists.forEach(artist=>
                    {
                        row.artists.push({id:artist.artistID,name:artist.artistPseudoName?artist.artistPseudoName:artist.artistName});
                    });
                    response.status(200,row,res);
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
            response.status(404,{error: 'song not found'},res);
        }
        else
        {
            const row = rows[0];
            const fs = require('fs');
            res.sendFile("audio/"+row.audiosrc,{root: '.'}, (error)=>
            {
                if (error) console.log(error);
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
            response.status(404,{error: 'song not found'},res);
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