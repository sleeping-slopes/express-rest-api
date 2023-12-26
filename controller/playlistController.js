const response = require('./../response')
const connection = require('../settings/database')

exports.getAll = (req,res) =>
{
    connection.query("SELECT `id` FROM `playlists` ORDER BY `playlists`.`created_at` DESC",(error,rows,fields)=>
    {
        if (error) return response.status(400,error,res);
        return response.status(200,rows,res);
    })
}

exports.getByID = (req,res) =>
{
    connection.query("SELECT * FROM `view_playlist` WHERE `id` = ?",[req.params.id],(error,rows,fields)=>
    {
        if (error) return response.status(400,error,res);
        if (rows.length<1) return response.status(404,'API Playlist not found',res);

        const row = rows[0];
        connection.query("SELECT `id`, ROW_NUMBER() OVER(PARTITION BY null ORDER BY `pos` ASC) AS `pos` FROM `view_playlist_songs` WHERE `playlistID` = ? ORDER BY `view_playlist_songs`.`pos`",[req.params.id],(error,songs)=>
        {
            if (error) return response.status(400,error,res);
            if (songs.length<1) row.songs = {error:{status:"404", message:"API Empty playlist"}};
            else
            {
                row.songs = {id:req.params.id,songs:[]};
                songs.forEach(song=>
                {
                    row.songs.songs.push({id:song.id,pos:song.pos});
                });
            }
            connection.query('SELECT `login`,`pseudoname`,`username` FROM `view_playlist_artists` WHERE `playlistID` = ? ORDER BY `view_playlist_artists`.`artistPlaylistPosition`',[req.params.id],(error,artists)=>
            {
                if (error) return response.status(400,error,res);
                row.artists = [];
                artists.forEach(artist=>
                {
                    row.artists.push({login:artist.login,name:artist.pseudoname?artist.pseudoname:artist.username});
                });
                if (req.user)
                    connection.query('SELECT `id` FROM `playlist_likes` WHERE `playlistID` = ? AND `userLogin` = ?',[row.id,req.user.login],(error,likes)=>
                    {
                        if (error) return response.status(400,error,res);
                        row.liked = (likes.length>0)
                        return response.status(200,row,res);
                    });
                else
                {
                    row.liked = false;
                    return response.status(200,row,res);
                }
            })
        })
    })
}

exports.getCover = (req,res) =>
{
    connection.query("SELECT `coversrc` FROM `playlists` WHERE `id` = ?",[req.params.id],(error,rows,fields)=>
    {
        if (error) return response.status(400,error,res);
        if (rows.length<1) return response.status(404,'Playlist not found',res);
        const row = rows[0];
        res.sendFile("images/covers/"+row.coversrc,{root: '.'}, function (error)
        {
            if (error) return response.status(error.status,error,res);
        });
    })
}

exports.postLike = (req,res) =>
{
    if (!req.user?.login) return response.status(401,"no auth",res);
    const sql = 'INSERT INTO `playlist_likes`(`userLogin`,`playlistID`,`time`) VALUES (?,?,?)';
    connection.query(sql,[req.user.login,req.params.id,new Date().toISOString().slice(0, 19).replace('T', ' ')],(error,results)=>
    {
        if (error) return response.status(400,error,res);
        return response.status(201,'Playlist liked',res);
    })
}

exports.deleteLike = (req,res) =>
{
    if (!req.user?.login) return response.status(401,"no auth",res);
    const sql = 'DELETE FROM `playlist_likes` WHERE`userLogin`=? AND `playlistID`=?';
    connection.query(sql,[req.user.login,req.params.id],(error,results)=>
    {
        if (error) return response.status(400,error,res);
        return response.status(201,'Playlist disliked',res);
    })
}