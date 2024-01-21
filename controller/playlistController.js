const response = require('./../response')
const queryPromise = require('../settings/database')

exports.getAll = async (req,res) =>
{
    try
    {
        const rows = await queryPromise("SELECT `id` FROM `playlists` ORDER BY `playlists`.`created_at` DESC");
        if (rows.length<1) return response.status(404,'API Playlists not found',res);
        return response.status(200,rows,res);
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
        const rows = await queryPromise("SELECT * FROM `view_playlist` WHERE `id` = ?",[req.params.id]);
        if (rows.length<1) return response.status(404,'API Playlist not found',res);
        const row = rows[0];
        if (!row.name) row.name = "Unnamed playlist";
        const songs = await queryPromise("SELECT `id`, ROW_NUMBER() OVER(PARTITION BY null ORDER BY `pos` ASC) - 1 AS `pos` FROM `view_playlist_songs` WHERE `playlistID` = ? ORDER BY `view_playlist_songs`.`pos`",[req.params.id]);
        if (songs.length<1) row.songList = {error:{status:"404", message:"API Empty playlist"}};
        else
        {
            row.songList = {id:req.params.id,songs:[]};
            songs.forEach(song=>
            {
                row.songList.songs.push({id:song.id,pos:song.pos});
            });
        }
        const artists = await queryPromise('SELECT `login`,`pseudoname`,`username` FROM `view_playlist_artists` WHERE `playlistID` = ? ORDER BY `view_playlist_artists`.`artistPlaylistPosition`',[req.params.id]);
        row.artists = [];
        if (artists.length<1) { row.artists.push({name:"Unknown artist"}); }
        else
        {
            artists.forEach(artist=>
            {
                row.artists.push({login:artist.login,name:artist.pseudoname || artist.username || artist.login});
            });
        }
        if (req.user)
        {
            const likes = await queryPromise('SELECT `id` FROM `playlist_likes` WHERE `playlistID` = ? AND `userLogin` = ?',[row.id,req.user.login]);
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

exports.getCover = async (req,res) =>
{
    try
    {
        const rows = await queryPromise("SELECT `coversrc` FROM `playlists` WHERE `id` = ?",[req.params.id]);
        if (rows.length<1) return response.status(404,'API: Playlist not found',res);
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

exports.postLike = async (req,res) =>
{
    try
    {
        if (!req.user?.login) return response.status(401,"API: No auth",res);
        const sql = 'INSERT INTO `playlist_likes`(`userLogin`,`playlistID`,`time`) VALUES (?,?,?)';
        await queryPromise(sql,[req.user.login,req.params.id,new Date().toISOString().slice(0, 19).replace('T', ' ')]);
        return response.status(201,'API: Playlist liked',res);
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
        if (!req.user?.login) return response.status(401,"no auth",res);
        const sql = 'DELETE FROM `playlist_likes` WHERE`userLogin`=? AND `playlistID`=?';
        await queryPromise(sql,[req.user.login,req.params.id]);
        return response.status(201,'API: Playlist disliked',res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}