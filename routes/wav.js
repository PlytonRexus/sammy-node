const path = require ('path');

const express = require ('express');
const chalk = require ('chalk');
const multer = require ('multer');

const wav = require ('../controllers/wav');

const fileFilter = function fileFilter (req, file, callback)
{
    if (file.mimetype == 'audio/x-wav' || file.mimetype == 'application/octet-stream') {
    	// file.filename = file.filename + ".wav";
        callback(null, true);
    }
    else {
        callback(null, false);
        console.log(chalk.yellow('Only wav file type is allowed!'));
    }
}

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "..", "uploads", "wav"))
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    let currentFilename = file.fieldname + '-' + uniqueSuffix + ".wav";
    req.currentFilename = currentFilename;
    cb(null, currentFilename);
  }
})

const upload = multer({ 
	limits: {fileSize: 5242880}, 
	fileFilter, 
	storage
});
const router = express.Router();

router.get("/", wav.getPage);

router.post("/", upload.single("audio"), wav.ua, wav.uploadErrors); 
// consider adding a "saving" middleware
// this can be reused in both wav and vid controllers
// also can be considered addition of "file validation/sanitisation" middleware
// the flow would be like this:
// request --> [auth -->] validation --> sanitisation --> saving --> controller

module.exports = router;