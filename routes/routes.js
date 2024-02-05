module.exports = (app) =>
{
    const middleware = require('./../middleware/middleware');

    const meController = require('../controller/meController');
    app.route("/api/me").get(middleware.authToken, meController.getMe);
    app.route("/api/me").delete(middleware.authToken, meController.deleteMe);
    app.route("/api/me/credentials").get(middleware.authToken, meController.getCredentials);
    app.route("/api/me/credentials").put(middleware.authToken, meController.putCredentials);
    app.route("/api/me/profile").put(middleware.authToken, meController.putProfile);
    app.route("/api/me/songs/likes").patch(middleware.authToken, meController.patchSongLikes);
    app.route("/api/me/playlists/likes").patch(middleware.authToken, meController.patchPlaylistLikes);
    app.route("/api/me/users/following").patch(middleware.authToken, meController.patchFollowing);

    const authController = require('../controller/authController');
    app.route('/api/auth/login').post(authController.logIn);

    const songController = require('./../controller/songController');
    app.route("/api/songs").get(songController.getAll);
    app.route("/api/songs/:id").get(middleware.authToken, songController.getByID);
    app.route("/api/songs/:id/audio").get(songController.getAudio);
    app.route("/api/songs/:id/cover").get(songController.getCover);
    app.route("/api/songs/:id/playlists").get(songController.getPlaylists);
    app.route("/api/songs/:id/related").get(songController.getRelated);
    app.route("/api/songs/:id/likes").get(songController.getLikes);

    app.route("/api/tags/:tag/popular").get(songController.getTaggedPopular);
    app.route("/api/tags/:tag/new").get(songController.getTaggedNew);

    const playlistController = require('./../controller/playlistController');
    app.route('/api/playlists').get(playlistController.getAll);
    app.route('/api/playlists/:id').get(middleware.authToken, playlistController.getByID);
    app.route('/api/playlists/:id/cover').get(playlistController.getCover);

    const userController = require('./../controller/userController');
    app.route("/api/users").post(userController.postUser);
    app.route("/api/users/:login/profile").get(middleware.authToken, userController.getProfile);
    app.route("/api/users/:login/username").get(userController.getUsername);
    app.route("/api/users/:login/picture").get(userController.getProfilePicture);
    app.route("/api/users/:login/banner").get(userController.getBanner);
    app.route("/api/users/:login/songs").get(userController.getAllSongs);
    app.route("/api/users/:login/songs/created").get(userController.getCreatedSongs);
    app.route("/api/users/:login/songs/created/popular").get(userController.getCreatedPopularSongs);
    app.route("/api/users/:login/songs/likes").get(userController.getSongLikes);
    app.route("/api/users/:login/playlists").get(userController.getAllPlaylists);
    app.route("/api/users/:login/playlists/created").get(userController.getCreatedPlaylists);
    app.route("/api/users/:login/playlists/created/popular").get(userController.getCreatedPopularPlaylists);
    app.route("/api/users/:login/playlists/likes").get(userController.getPlaylistLikes);
    app.route("/api/users/:login/followers").get(userController.getFollowers);
    app.route("/api/users/:login/following").get(userController.getFollowing);

    const searchController = require('./../controller/searchController');
    app.route("/api/search/:q/songs").get(searchController.getSongs);
    app.route("/api/search/:q/playlists").get(searchController.getPlaylists);
    app.route("/api/search/:q/users").get(searchController.getUsers);

    app.route("/api/error").get(searchController.getError);
}