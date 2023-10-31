const response = require('./../response')
const connection = require('../settings/database')

exports.getAll = (req,res) =>
{
    connection.query("SELECT `id` FROM `songs`",(error,rows,fields)=>
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
    connection.query("SELECT * FROM `songs` WHERE `id` = ?",[req.params.id],(error,rows,fields)=>
    {
        if (error)
        {
            response.status(400,error,res);
        }
        else
        {
            const row = rows[0];
            row.artists = [];
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