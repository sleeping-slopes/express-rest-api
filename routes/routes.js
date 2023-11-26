module.exports = (app) =>
{
    const authController = require('../controller/authController');
    app.route('/api/auth/signup').post(authController.signUp);
    app.route('/api/auth/login').post(authController.logIn);

    const playlistController = require('./../controller/playlistController');
    app.route('/api/playlists').get(playlistController.getAll);
    app.route('/api/playlists/:id').get(playlistController.getByID);
    app.route('/api/playlists/:id/songs').get(playlistController.getSongs);
    app.route('/api/playlists/:id/cover').get(playlistController.getCover);

    const songController = require('./../controller/songController');
    app.route("/api/songs").get(songController.getAll);
    app.route("/api/songs/:id").get(songController.getByID);
    app.route("/api/songs/:id/audio").get(songController.getAudio);
    app.route("/api/songs/:id/cover").get(songController.getCover);

    const middleware = require('./../middleware/middleware');

    const userController = require('./../controller/userController');
    app.route("/api/user/").get(middleware.authToken, userController.getByID);
    app.route("/api/user/playlists").get(middleware.authToken, userController.getPlaylists);
    app.route("/api/user/songs").get(middleware.authToken, userController.getSongs);
}