const response = require('./../response')
const queryPromise = require('../settings/database')

exports.getSongs = async (req,res) =>
{
    try
    {
        const sql ="SELECT `id`,ROW_NUMBER() OVER(PARTITION BY null ORDER BY `likes_count` DESC) - 1 AS `pos` FROM `view_song` WHERE `name` LIKE ?";
        const rows = await queryPromise(sql,['%'+req.params.q+'%']);
        if (rows.length<1) return response.status(404,'Sorry, we didn\'t find any results for “'+req.params.q+'”.',res);
        return response.status(200,{id:'API SEARCH "'+req.params.q+'"',songs:rows},res);
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
        const sql ="SELECT `id` FROM `view_playlist` WHERE `name` LIKE ? OR `id` LIKE ? ORDER BY `likes_count` DESC";
        const rows = await queryPromise(sql,['%'+req.params.q+'%','%'+req.params.q+'%']);
        if (rows.length<1) return response.status(404,'Sorry, we didn\'t find any results for “'+req.params.q+'”.',res);
        return response.status(200,rows,res);
    }
    catch(error)
    {
        return response.status(400,error.message,res);
    }
}

exports.getUsers = async (req,res) =>
{
    try
    {

        const sql = "SELECT  DISTINCT `login` FROM `view_user_profile` LEFT JOIN `playlist_artists` ON `playlist_artists`.`artistLogin`=`view_user_profile`.`login` LEFT JOIN `song_artists` ON `song_artists`.`artistLogin`=`view_user_profile`.`login` WHERE `view_user_profile`.`login` LIKE ? OR `view_user_profile`.`username` LIKE ? OR `playlist_artists`.`artistName` LIKE ? OR `song_artists`.`artistName` LIKE ? ORDER BY `view_user_profile`.`followers_count` DESC";
        const rows = await queryPromise(sql,Array(4).fill('%'+req.params.q+'%'));
        if (rows.length<1) return response.status(404,'Sorry, we didn\'t find any results for “'+req.params.q+'”.',res);
        return response.status(200,rows,res);
    }
    catch(error)
    {
        console.log(error.message);
        return response.status(400,error.message,res);
    }
}