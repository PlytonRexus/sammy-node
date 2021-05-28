const path = require('path');

const Queue = require('bull');

const { postAudioReq, fetchVideo } = require('../utils/wtools');
const xtools = require('../utils/xtools');
const vtools = require('../utils/vtools');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const opts = xtools.redisOpts;
const sdQueue = new Queue('sd', opts);
const upQueue = new Queue('up', opts);

exports.getByUrl = async function(req, res) {
	res.json({ "Error": "This route has moved to a new address." });
}

/**
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
exports.uploadErrors = (error, req, res, next) => {
	res.json({ error });
}

exports.describeByUpload = async (req, res) => {
	let job = await upQueue.add({ 
		currentFilename: req.currentFilename, 
		describer: req.query.describer,
		deleteFile: req.query.deleteFile == 'true'
	});
	let requestAudio = false;
	if (req.query.audio === "true")
		requestAudio = true;
	let id2;
	if (requestAudio)
		id2 = await postAudioReq(null, req.currentFilename);
	res.json({ id1: parseInt(job.id), id2 });
}

exports.describe = async (req, res) => {
	let job = await sdQueue.add({ 
		url: req.query.url, 
		describer: req.query.describer,
		deleteFile: req.query.deleteFile == 'true'
	});
	let requestAudio = false;
	if (req.query.audio === "true")
		requestAudio = true;
	let id2;
	if (requestAudio)
		id2 = await postAudioReq(req.query.url);
	res.json({ id1: parseInt(job.id), id2 });
}

exports.status = async (req, res) => {
    let id = req.params.id;
    let job;
    if (req.query.mode === "sd") {
        job = await sdQueue.getJob(id);
    } else if (req.query.mode === "up") {
        job = await upQueue.getJob(id);
    }

    if (job === null || job === undefined) {
        res.status(404).end();
    } else {
        let state = await job.getState();
        let progress = job._progress;
        let reason = job.failedReason;
        let responseFinal = job.returnvalue;
        res.json({ id, state, progress, reason, responseFinal });
    }
};

exports.describeSingleFrame = async (req, res) => {
	let q = req.query;
	if (!q.url || !q.url.length) {
		return res.json({ "Error": "No URL provided" });
	}
	if (!q.timestamp || !q.timestamp.length) {
		return res.json({ "Error": "No timestamp provided" });
	}

	// res.json({ captions: "This is something... qwertyuiop" });
	// let vidAddr = xtools.toBinary(q.video);
	let time = parseInt(q.timestamp),
		scenes = [time],
		urlv,
		vidAddr;
	try {
		urlv = new URL(q.url);
	} catch(e) {
		res.json({ "Error": "Illegal URL used" });
	}

	if (urlv) {
		vidAddr = await fetchVideo(urlv.href);
	}

	console.log("Now attempting:", vidAddr);
	try	{
		let frameObject = await vtools.extractFrames(vidAddr, [time]);
		let compressedImage = await xtools.sharpValidation(
			path.join(
				__dirname, 
				"..", 
				"uploads", 
				"jpg", 
				"frame-" + frameObject.suffix + `-1.jpg`
			), "image/jpg"
		);
		let captions = await vtools.getCaptionFromAzure(null, [compressedImage]);
		captions = captions.map(function (cap, idx) {
			return { 
				time: Math.round(scenes[idx]*1000), 
				captions: cap.caption, 
				tags: cap.tags 
			};
		});

		let ocrs = await vtools.getOCR(null, [compressedImage]);
		ocrs = ocrs.map((line, idx) => { 
			return { "time": Math.round(scenes[idx]*1000), "ocr": line }
		});
		captions = captions.map((cap, idx) => {
			cap.ocr = ocrs[idx].ocr;
			return cap;
		});

		if (q.onlyString == "true" || q.stringOnly == "true") {
			let tg = captions[0].tags;
			res.json({ caption: `${captions[0].captions ? captions[0].captions : `${tg[0]} or ${tg[1]} or ${tg[2]}` }...; ${captions[0].ocr}` });
		} else {
			res.json(captions[0]);
		}
	} catch (e) {
		console.log("Error in singleFrame route", e);
		res.status(500).json({ "Error": e });
	}
}

/*up
	let vidAddr = req.currentFilename;
	if (process.env.DEBUG_SAM)
		console.log("Processing:", vidAddr);
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
		// res.json(responseFinal);
		return responseFinal;
		// - [ ] now delete the files
	} catch (e) {
		// res.json({ "error": e });
		return { error: e };
	}
*/

/*sd
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

			let duration = await vtools.getDuration(vidAddr);
			if (process.env.DEBUG_SAM) console.log("Obtained duration.", duration);

			let scenes = [];
			try {
				scenes = await vtools.extractScenes(vidAddr);
				scenes.unshift(0.6, 1.2);
				if (duration) scenes.push(duration - 1.6, duration - 0.6);

			} catch(e){
				scenes  = [];
				scenes.unshift(0.6, 1.2);
				if (duration) scenes.push(duration - 1.6, duration - 0.6);
			}

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
*/