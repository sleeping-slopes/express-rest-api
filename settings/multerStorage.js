const multer  = require('multer');
var path = require('path')

const storage = multer.diskStorage
({
    destination: function (req, file, cb)
    {
        let destinationPath;
        switch(file.fieldname)
        {
            case "songAudio": destinationPath = "upload/audio/"; break;
            case "songCover":
            case "playlistCover":
            destinationPath = "upload/images/covers/"; break;
            case "userProfilePicture": destinationPath = "upload/images/user images/profile pictures/"; break;
            case "userBanner": destinationPath = "upload/images/user images/banners/"; break;
            default: destinationPath = "upload/misc/"; break;
        }
        cb(null, destinationPath);
    },
    filename: function (req, file, cb)
    {
        cb(null, Date.now() + path.extname(file.originalname));
    }
})

module.exports = storage