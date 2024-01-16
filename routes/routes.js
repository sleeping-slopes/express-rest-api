module.exports = (app) =>
{
    const authController = require('../controller/authController');
    app.route('/api/auth/signup').post(authController.signUp);
    app.route('/api/auth/login').post(authController.logIn);

    const playlistController = require('./../controller/playlistController');
    app.route('/api/playlists').get(playlistController.getAll);
    app.route('/api/playlists/:id/cover').get(playlistController.getCover);

    const songController = require('./../controller/songController');
    app.route("/api/songs").get(songController.getAll);
    app.route("/api/songs/:id/audio").get(songController.getAudio);
    app.route("/api/songs/:id/cover").get(songController.getCover);
    app.route("/api/songs/:id/likes").get(songController.getLikes);
    app.route("/api/songs/:id/playlists").get(songController.getPlaylists);
    app.route("/api/songs/:id/related").get(songController.getRelated);

    app.route("/api/tags/:tag/popular").get(songController.getTaggedPopular);
    app.route("/api/tags/:tag/new").get(songController.getTaggedNew);

    const userController = require('./../controller/userController');
    app.route("/api/users/:login/username").get(userController.getUsername);
    app.route("/api/users/:login/picture").get(userController.getProfilePicture);
    app.route("/api/users/:login/banner").get(userController.getBanner);

    app.route("/api/users/:login/songs").get(userController.getAllSongs);
    app.route("/api/users/:login/songs/created").get(userController.getCreatedSongs);
    app.route("/api/users/:login/songs/created/popular").get(userController.getCreatedPopularSongs);
    app.route("/api/users/:login/songs/liked").get(userController.getLikedSongs);

    app.route("/api/users/:login/playlists").get(userController.getAllPlaylists);
    app.route("/api/users/:login/playlists/created").get(userController.getCreatedPlaylists);
    app.route("/api/users/:login/playlists/created/popular").get(userController.getCreatedPopularPlaylists);
    app.route("/api/users/:login/playlists/liked").get(userController.getLikedPlaylists);

    app.route("/api/users/:login/links").get(userController.getLinks);
    app.route("/api/users/:login/followers").get(userController.getFollowers);
    app.route("/api/users/:login/following").get(userController.getFollowing);

    const searchController = require('./../controller/searchController');
    app.route("/api/search/:q/songs").get(searchController.getSongs);
    app.route("/api/search/:q/playlists").get(searchController.getPlaylists);
    app.route("/api/search/:q/users").get(searchController.getUsers);

    const middleware = require('./../middleware/middleware');
    app.route("/api/me/").get(middleware.authToken, userController.getByVerifiedJWT);

    app.route("/api/users/:login/profile").get(middleware.authToken, userController.getProfile);

    app.route("/api/users/:id/action/follow/post").post(middleware.authToken, userController.postFollow);
    app.route("/api/users/:id/action/follow/delete").post(middleware.authToken, userController.deleteFollow);

    app.route("/api/songs/:id").get(middleware.authToken, songController.getByID);
    app.route('/api/playlists/:id').get(middleware.authToken, playlistController.getByID);

    app.route("/api/songs/:id/action/like/post").post(middleware.authToken, songController.postLike);
    app.route("/api/songs/:id/action/like/delete").post(middleware.authToken, songController.deleteLike);

    app.route("/api/playlists/:id/action/like/post").post(middleware.authToken, playlistController.postLike);
    app.route("/api/playlists/:id/action/like/delete").post(middleware.authToken, playlistController.deleteLike);
}