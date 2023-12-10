module.exports = (app) =>
{
    const authController = require('../controller/authController');
    app.route('/api/auth/signup').post(authController.signUp);
    app.route('/api/auth/login').post(authController.logIn);

    const playlistController = require('./../controller/playlistController');
    app.route('/api/playlists').get(playlistController.getAll);
    app.route('/api/playlists/:id/songs').get(playlistController.getSongs);
    app.route('/api/playlists/:id/cover').get(playlistController.getCover);

    const songController = require('./../controller/songController');
    app.route("/api/songs").get(songController.getAll);
    app.route("/api/songs/:id/audio").get(songController.getAudio);
    app.route("/api/songs/:id/cover").get(songController.getCover);



    const userController = require('./../controller/userController');
    app.route("/api/user/:login/username").get(userController.getUsername);
    app.route("/api/user/:login/shortprofile").get(userController.getShortProfile);
    app.route("/api/user/:login/picture").get(userController.getProfilePicture);
    app.route("/api/user/:login/banner").get(userController.getBanner);
    app.route("/api/user/:login/songs").get(userController.getSongs);
    app.route("/api/user/:login/playlists").get(userController.getPlaylists);
    app.route("/api/user/:login/likes/songs").get(userController.getLikedSongs);
    app.route("/api/user/:login/likes/playlists").get(userController.getLikedPlaylists);
    app.route("/api/user/:login/links").get(userController.getLinks);
    app.route("/api/user/:login/followers").get(userController.getFollowers);
    app.route("/api/user/:login/following").get(userController.getFollowing);

    const middleware = require('./../middleware/middleware');
    app.route("/api/user/").get(middleware.authToken, userController.getByVerifiedJWT);

    app.route("/api/user/:login/profile").get(middleware.authToken, userController.getProfile);

    app.route("/api/songs/:id").get(middleware.authToken, songController.getByID);
    app.route('/api/playlists/:id').get(middleware.authToken, playlistController.getByID);

    app.route("/api/songs/:id/action/like/post").post(middleware.authToken, songController.postLike);
    app.route("/api/songs/:id/action/like/delete").post(middleware.authToken, songController.deleteLike);

    app.route("/api/playlists/:id/action/like/post").post(middleware.authToken, playlistController.postLike);
    app.route("/api/playlists/:id/action/like/delete").post(middleware.authToken, playlistController.deleteLike);
}