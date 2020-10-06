const chalk = require ('chalk');

const atools = require ('../utils/atools');

exports.getPage = function(req, res) {
	console.log(chalk.green("Uh, hm!"));
	res.send("<code>Yeah, this is the wav zone.</code>");
}

/**
 * Saves an uploaded avatar to specified user document.
 * Request body should contain a file of one of these mimetypes:
 * audio/x-wav, application/octet-stream
 * 
 * It may be noted that `req` object contains field: 
 * `req.currentFilename` to identify current working file.
 *
 * @param {*} req
 * @param {*} res
 * @returns response: 202 || 400
 */
exports.ua = async (req, res, next) => {
	if (!req.file) {
		if (process.env.DEBUG_SAM) 
			console.log("File missing.");
		return res.status(400).json({ "message": "No file selected!" });
	}

	// - [x] save file here
	// - [x] then call deepspeech
	// - [x] respond with the returned json array

	try {
		let words = await atools.Ds_Wrap(req.currentFilename);
		if (words.error) {
			if (process.env.DEBUG_SAM) 
				console.log("DeepSpeech error: \n", words.error);
			throw Error(words.error);
		}
		if (process.env.DEBUG_SAM && process.env.VERBOSE_SAM)
			console.log("Final response of ua route: \n", words); 
		return res.status(202).json(words);
	}
	catch (err) {
		next(err);
	}
}


/**
 * Responds with errors occured during uploading file.
 *
 * @param {*} err
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns response: 500
 */
exports.uploadErrors = (err, req, res, next) => {
	if (process.env.DEBUG_SAM) 
		console.log("Uploading error on ua route: \n", err);
	return res.status(500).json({ "message": err });
}
