const path = require ('path');
const fs = require ('fs');

// For extracting audio
const fea = require ('ffmpeg-extract-audio');
// For image compression
const sharp = require ('sharp');

exports.extractAV = function(addr) {
	// This should probably be in `vtools.js`
	// ffmpeg-extract-audio
	// return address of extracted audio
	return new Promise(async (resolve, reject) => {
		let uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9),
			currentFilename = 'extract-' + uniqueSuffix + ".wav",
			filePath = path.join(__dirname, "..", "uploads", "tmp", currentFilename);

		if (process.env.DEBUG_SAM) console.log("Extracting audio from: \n" + filePath);

		fea({
			input: addr,
			format: 'wav',
			output: filePath
		})
		.then(() => {
			if (process.env.DEBUG_SAM) console.log("Extracted audio to: \n" + filePath);
			resolve(filePath);
		})
		.catch(() => reject("Something went wrong while extraction."));
	});
}

/**
 * Validates supplied imaged buffer by resizing image to
 * 500px * 500px. This function uses Sharp Module for validation.
 *
 * @param {*} original path to image
 * @param {*} mimetype string: "image/png", "image/jpg", "image/tiff", "image/bmp"
 * @returns validated buffer of supplied image buffer.
 */
exports.sharpValidation = async function (original, mimetype) {
	var opts = { quality: 60 };

	return new Promise(async (resolve, reject) => {
		if (mimetype == "image/png") {
			buffer = sharp(original)
				.resize({
					width: 500,
					height: 500
				})
				.png(opts)
				.toFile(original, (err, info) => { 
					if (err)
						return console.error("error:", err);
					if (process.env.DEBUG_SAM) console.log("info:", info);
				})
				.then(() => resolve(original))
				.catch(() => reject("Compression error"));
		}

		if (mimetype == "image/jpg") {
			if (process.env.DEBUG_SAM && process.env.VERBOSE_SAM) console.log("Compressing:", original);
			buffer = await sharp(original)
			.resize({
				width: 500,
				height: 500
			})
			// .jpg(opts)
			.toBuffer(function(err, buffer) {
			    fs.writeFile(original, buffer, function(e) {
			    	if (e)
			    		reject(e);
			    	resolve(original);
			    });
			});
		}

		if (mimetype == "image/tiff") {
			buffer = sharp(original)
				.resize({
					width: 500,
					height: 500
				})
				.tiff(opts)
				.toFile(original, (err, info) => { 
					if (err)
						return console.error("error:", err);
					console.log("info:", info);
				})
				.then(() => resolve(original))
				.catch(() => reject("Compression error"));
		}

		if (mimetype == "image/bmp") {
			buffer = sharp(original)
				.resize({
					width: 500,
					height: 500
				})
				.bmp(opts)
				.toFile(original,(err, info) => { 
					if (err)
						return console.error("error:", err);
					console.log("info:", info);
				})
				.then(() => resolve(original))
				.catch(() => reject("Compression error"));
		}

	});
}

exports.delay = function (ms) {
	if (process.env.DEBUG_SAM) console.log("Waiting " + ms/1000 + " seconds.");
	return new Promise(resolve => setTimeout(resolve, ms));
}

const deleteFile = function(filePath) {
	return new Promise((resolve, reject) => {
		fs.unlink(filePath, (err) => {
			if (err) {
    			console.error(err);
    			reject(err);
			};
			resolve();
		});
	})
}

exports.deleteManyFiles = function(filePaths) {
	return new Promise(async (resolve, reject) => {
		if (!filePaths)
			reject("No or invalid paths supplied.");
		else {
			for (let i = 0; i < filePaths.length; i++) {
				await deleteFile(filePaths[i]);
			};
			resolve(filePaths);
		}
	})
}