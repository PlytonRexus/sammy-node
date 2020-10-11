const path = require ('path');

const wtools = require ('../utils/wtools');
const xtools = require ('../utils/xtools');
const vtools = require ('../utils/vtools');

exports.getByUrl = async function(req, res) {
	res.json({ "Error": "This route has moved to a new address." });
}

/**
 * Saves an uploaded avatar to specified user document.
 * Request body should contain a file of one of these mimetypes:
 * video/mp4, application/octet-stream
 * 
 * It may be noted that `req` object contains field: 
 * `req.currentFilename` to identify current working file.
 *
 * @param {*} req
 * @param {*} res
 * @returns response: 202 || 400
 */
exports.getByUpload = async (req, res, next) => {
	res.json({ "Error": "This route has moved to a new address." });	
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
}

exports.describeByUpload = async (req, res) => {
	let vidAddr = req.currentFilename;
	try {
		let scenes = await vtools.extractScenes(vidAddr);
		scenes.unshift(0.6, 1.2);
		if (process.env.DEBUG_SAM) console.log("Scene changes extracted.", scenes);

		let frameObject = await vtools.extractFrames(vidAddr, scenes);
		if (process.env.DEBUG_SAM) console.log("Frames extracted.", frameObject);

		let i = 1, compressed = [];
		while (i <= frameObject.numberOfFrames) {
			compressed.push(await xtools.sharpValidation(
				path.join(
					__dirname, 
					"..", 
					"uploads", 
					"jpg", 
					"frame-" + frameObject.suffix + `-${i}.jpg`
				), "image/jpg"
			));
			i += 1;
		}

		if (process.env.DEBUG_SAM) console.log("Frames compressed.", compressed.length);

		let captions = await vtools.getCaption(null, compressed);

		if (process.env.DEBUG_SAM) console.log("Captions received.", captions.length);

		let ocrs = await vtools.getOCR(null, compressed);

		if (process.env.DEBUG_SAM) console.log("OCR complete.", ocrs);

		// if (captions.length === scenes.length) {
			captions = captions.map(function (cap, idx) {
				return { time: Math.round(scenes[idx]*1000), captions: cap[0].caption };
			});
			ocrs = ocrs.map((line, idx) => { 
				return { "time": Math.round(scenes[idx]*1000), "ocr": line }
			});
		// }

		let responseFinal = { "captions": captions, "ocr": ocrs };
		if (process.env.DEBUG_SAM)
			console.log("Final response: \n", responseFinal); 
		res.json(responseFinal);

		// - [ ] now delete the files
	} catch (e) {
		res.json({ "error": e });
	}
}

exports.describe = async (req, res) => {
	let q = req.query,
		url = "";

	if (q.url) {
		url = (q.url);
	}

	if (url == "") {
		if (process.env.DEBUG_SAM) console.log("`url` parameter empty.");
		res.json({ "error": "Empty query. Please supply a parameter." });
	} else { 
		try {
			let vidAddr = await wtools.fetchVideo(url);
			if (process.env.DEBUG_SAM) console.log("File downloaded.", vidAddr);

			let scenes = await vtools.extractScenes(vidAddr);
			scenes.push(1.2);
			if (process.env.DEBUG_SAM) console.log("Scene changes extracted.", scenes);

			let frameObject = await vtools.extractFrames(vidAddr, scenes);
			if (process.env.DEBUG_SAM) console.log("Frames extracted.", frameObject);

			let i = 1, compressed = [];
			while (i <= frameObject.numberOfFrames) {
				compressed.push(await xtools.sharpValidation(
					path.join(
						__dirname, 
						"..", 
						"uploads", 
						"jpg", 
						"frame-" + frameObject.suffix + `-${i}.jpg`
					), "image/jpg"
				));
				i += 1;
			}

			if (process.env.DEBUG_SAM) console.log("Frames compressed.", compressed.length);

			let captions = await vtools.getCaption(null, compressed);

			if (process.env.DEBUG_SAM) console.log("Captions received.", captions.length);

			let ocrs = await vtools.getOCR(null, compressed);

			if (process.env.DEBUG_SAM) console.log("OCR complete.", ocrs);

			// if (captions.length === scenes.length) {
				captions = captions.map(function (cap, idx) {
					return { time: Math.round(scenes[idx]*1000), captions: cap[0].caption };
				});
				ocrs = ocrs.map((line, idx) => { 
					return { "time": Math.round(scenes[idx]*1000), "ocr": line }
				});
			// }

			let responseFinal = { "captions": captions, "ocr": ocrs };
			if (process.env.DEBUG_SAM)
				console.log("Final response: \n", responseFinal); 
			res.json(responseFinal);

			// - [ ] now delete the files
		} catch (e) {
			res.json({ "error": e });
		}
	}
}