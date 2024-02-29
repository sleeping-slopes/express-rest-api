const multer  = require('multer');
const multerStorage = require('../settings/multerStorage');
const upload = multer({ storage: multerStorage });

module.exports = (app) =>
{
    const miscController = require('../controller/miscController');
    app.route("/").get(miscController.getError);
    app.route("/api/error").get(miscController.getError);

    const middleware = require('./../middleware/middleware');

    const meController = require('../controller/meController');
    app.route("/api/me").get(middleware.authToken, meController.getMe);
    app.route("/api/me").delete(middleware.authToken, meController.deleteMe);

    app.route("/api/me/profile").put(middleware.authToken, meController.putProfile);
    app.route("/api/me/theme").put(middleware.authToken, meController.putTheme);
    app.route("/api/me/accent-color").put(middleware.authToken, meController.putAccentColor);
    app.route("/api/me/credentials").put(middleware.authToken, meController.putCredentials);

    app.route("/api/me/profile-picture").post(middleware.authToken, upload.single('userProfilePicture'), meController.postProfilePicture);
    app.route("/api/me/profile-picture").delete(middleware.authToken,  meController.deleteProfilePicture);

    app.route("/api/me/banner").post(middleware.authToken, upload.single('userBanner'), meController.postBanner);
    app.route("/api/me/banner").delete(middleware.authToken,  meController.deleteBanner);

    app.route("/api/me/songs/created").post(middleware.authToken, upload.fields([{name: 'songAudio'},{name: 'songCover'}]), meController.postSong);

    app.route("/api/me/songs/likes").post(middleware.authToken, meController.postSongLike);
    app.route("/api/me/songs/likes/:id").delete(middleware.authToken, meController.deleteSongLike);

    app.route("/api/me/playlists/likes").post(middleware.authToken, meController.postPlaylistLike);
    app.route("/api/me/playlists/likes/:id").delete(middleware.authToken, meController.deletePlaylistLike);

    app.route("/api/me/users/following").post(middleware.authToken, meController.postFollowing);
    app.route("/api/me/users/following/:login").delete(middleware.authToken, meController.deleteFollowing);

    app.route("/api/me/recommendations").get(middleware.authToken, meController.getRecommendations);

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

    app.route("/api/tags/:tag").get(songController.getTaggedSongs);

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
    app.route("/api/users/:login/songs/likes").get(userController.getSongLikes);
    app.route("/api/users/:login/playlists").get(userController.getAllPlaylists);
    app.route("/api/users/:login/playlists/created").get(userController.getCreatedPlaylists);
    app.route("/api/users/:login/playlists/likes").get(userController.getPlaylistLikes);
    app.route("/api/users/:login/followers").get(userController.getFollowers);
    app.route("/api/users/:login/following").get(userController.getFollowing);

    const searchController = require('./../controller/searchController');
    app.route("/api/search/:q/songs").get(searchController.getSongs);
    app.route("/api/search/:q/playlists").get(searchController.getPlaylists);
    app.route("/api/search/:q/users").get(searchController.getUsers);
}