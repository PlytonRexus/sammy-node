const path = require ('path');

const throng = require('throng');
const Queue = require("bull");

const wtools = require ('./utils/wtools');
const xtools = require ('./utils/xtools');
const vtools = require ('./utils/vtools');

let REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const opts = xtools.redisOpts;

// Spin up multiple processes to handle jobs to 
// take advantage of more CPU cores
let workers = process.env.WEB_CONCURRENCY || 2;

// The maximum number of jobs each worker should process at once. This will need
// to be tuned for your application. If each job is mostly waiting on network 
// responses it can be much higher. If each job is CPU-intensive, it might need
// to be much lower.
let maxJobsPerWorker = 10;

// Connect to the named work queue
let sdQueue = new Queue('sd', opts);
let upQueue = new Queue('up', opts);

function start() {

    // if (process.env.DEBUG_SAM)
    // 	console.log("sdQueue:", sdQueue, "upQueue:", upQueue);

    sdQueue.process(maxJobsPerWorker, async (job) => {
        let progress = 0,
        	prog = [15, 20, 30, 50, 66, 80, 92, 97, 100 ];
        	/* [ 
        		download, duration, 
        		scenes, frames, 
        		compression, captions, 
        		OCR, delete, finalise 
        	] */

        let toDelete = [];

        let q = job.data,
			url = "";

		if (q.url) {
			url = (q.url);
		}

		if (url === "https://raw.githubusercontent.com/PlytonRexus/sammy-web/master/videoplayback_2.mp4") {
			job.data.responseFinal = { 
				id: Math.floor(Math.random() * 1000), 
				state: "Completed", 
				progress: 100, 
				reason: null, 
				responseFinal: {
					"file": {
					"length": 9.975,
					"url": "https://raw.githubusercontent.com/PlytonRexus/sammy-web/master/videoplayback_2.mp4",
					"savedAs": "L2FwcC91cGxvYWRzL3RtcC92aWRlby0xNjA4MzIzODQxMDAzLTg1NTEyNTA2MC5tcDQ="
				},
				"captions": [
					{
					"time": 600,
					"captions": "a plastic toy on a surface",
					"tags": [
						"little",
						"small",
						"child",
						"toy",
						"sitting",
						"boy",
						"plastic",
						"holding",
						"young",
						"table",
						"hand",
						"board",
						"toddler",
						"cake",
						"snow",
						"wearing",
						"helmet",
						"riding",
						"girl",
						"playing",
						"baseball",
						"birthday",
						"hat",
						"green",
						"computer",
						"food",
						"laying",
						"ball",
						"plate"
					],
					"ocr": " \n\f"
					},
					{
					"time": 1200,
					"captions": "a plastic toy",
					"tags": [
						"little",
						"small",
						"child",
						"toy",
						"sitting",
						"boy",
						"plastic",
						"holding",
						"cake",
						"table",
						"young",
						"toddler",
						"hand",
						"birthday",
						"board",
						"playing",
						"pair",
						"wearing",
						"girl",
						"green",
						"plate",
						"bear",
						"snow",
						"riding",
						"stuffed",
						"laying"
					],
					"ocr": " \n\f"
					},
					{
					"time": 8375,
					"captions": "a toy",
					"tags": [
						"person",
						"little",
						"child",
						"small",
						"indoor",
						"toy",
						"sitting",
						"boy",
						"holding",
						"young",
						"cake",
						"playing",
						"table",
						"toddler",
						"hand",
						"plastic",
						"snow",
						"pair",
						"wearing",
						"bear",
						"board",
						"birthday",
						"stuffed",
						"hat",
						"plate",
						"riding",
						"ball",
						"laying",
						"baseball",
						"standing"
					],
					"ocr": " \n\f"
					}
				]
				}
			};
			job.progress(100);
			return job.data.responseFinal;
		}
		else if (url === "https://raw.githubusercontent.com/PlytonRexus/sammy-web/master/videoplayback_3.mp4") {
			job.data.responseFinal = {
				"captions": [
					{
					"time": 600,
					"captions": "a close up of a stuffed toy",
					"tags": [
						"indoor",
						"sitting",
						"cat",
						"looking",
						"stuffed",
						"dog",
						"bear",
						"food",
						"bird",
						"standing",
						"laying",
						"playing",
						"bed"
					],
					"ocr": " \n\f"
					},
					{
					"time": 1200,
					"captions": "a teddy bear",
					"tags": [
						"indoor",
						"sitting",
						"bear",
						"looking",
						"stuffed",
						"teddy",
						"dog",
						"dark",
						"cat",
						"table",
						"standing",
						"laying",
						"animal",
						"hat",
						"bed"
					],
					"ocr": " \n\f"
					},
					{
					"time": 7407,
					"captions": "a close up of a negative",
					"tags": [
						"light"
					],
					"ocr": " \n\f"
					},
					{
					"time": 8454,
					"captions": "negative of a skeleton",
					"tags": [],
					"ocr": "\f"
					}
				]
			};
			job.progress(100);
			return job.data.responseFinal;
		} else if (url === "https://raw.githubusercontent.com/PlytonRexus/sammy-web/master/videoplayback.mp4") {
			job.data.responseFinal = {
				"captions": [
					{
					"time": 600,
					"captions": "a closeup of a mask",
					"tags": [
						"indoor",
						"sitting",
						"table",
						"small",
						"sink",
						"pair",
						"laying",
						"cat",
						"blue"
					],
					"ocr": "\f"
					},
					{
					"time": 8501,
					"captions": "a close up of a helmet",
					"tags": [
						"clothing",
						"sitting",
						"looking",
						"close",
						"helmet",
						"face"
					],
					"ocr": " \n\f"
					},
					{
					"time": 9501,
					"captions": "a close up of a toy",
					"tags": [
						"sitting",
						"looking",
						"close",
						"table"
					],
					"ocr": " \n\f"
					}
				]
			};
			job.progress(100);
			return job.data.responseFinal;
		}

		if (url == "") { 
			if (process.env.DEBUG_SAM) console.log("`url` parameter empty.");
			job.log("`url` parameter empty.");
			throw Error({ "error": "Empty query. Please supply a parameter." });
		} else { 
			try {
				let vidAddr = await wtools.fetchVideo(url);
				if (process.env.DEBUG_SAM) console.log("File downloaded.", vidAddr);
				job.log("File downloaded. " + vidAddr);
				toDelete.push(vidAddr);
				for(;progress < prog[0]; progress += 1) job.progress(progress);

				let duration = await vtools.getDuration(vidAddr);
				if (process.env.DEBUG_SAM) console.log("Obtained duration.", duration);
				job.log("Obtained duration. " + duration);
				for(;progress < prog[1]; progress += 1) job.progress(progress);

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
				job.log("Scene changes extracted. " + scenes);
				for(;progress < prog[2]; progress += 1) job.progress(progress);

				let frameObject = await vtools.extractFrames(vidAddr, scenes);
				if (process.env.DEBUG_SAM) console.log("Frames extracted.", frameObject);
				job.log("Frames extracted. " + frameObject);
				// for(;progress < prog[3]; progress += 1) job.progress(progress);
				progress = 50;
				job.progress(progress);

				let i = 1, compressed = [];
				while (i <= frameObject.numberOfFrames) {
					let imagePath = 
						path.join(
							__dirname, 
							"uploads", 
							"jpg", 
							"frame-" + frameObject.suffix + `-${i}.jpg`
						);
					let compressedImage = await xtools.sharpValidation(
						imagePath, "image/jpg"
					);

					compressed.push(compressedImage);
					toDelete.push(imagePath);
					i += 1;
				}
				for(;progress < prog[4]; progress += 1) job.progress(progress);
				if (process.env.DEBUG_SAM) console.log("Frames compressed.", compressed.length);
				job.log("Frames compressed. " + compressed.length);

				let captions = [];
				let describer = q.describer || "azure";
				if (describer == "densecap") {
					captions = await vtools.getCaption(null, compressed);
					captions = captions.map(function (cap, idx) {
						return { time: Math.round(scenes[idx]*1000), captions: cap[0].caption };
					});
				} else {
					captions = await vtools.getCaptionFromAzure(null, compressed);
					captions = captions.map(function (cap, idx) {
						return { 
							time: Math.round(scenes[idx]*1000), 
							captions: cap.caption, 
							tags: cap.tags 
						};
					});
				}
				for(;progress < prog[5]; progress += 1) job.progress(progress);
				if (process.env.DEBUG_SAM) console.log("Captions received.", captions.length);
				job.log("Captions received. " + captions.length);

				let ocrs = await vtools.getOCR(null, compressed);
				for(;progress < prog[6]; progress += 1) job.progress(progress);
				if (process.env.DEBUG_SAM) console.log("OCR complete.", ocrs);
				job.log("OCR complete. " + ocrs);

				ocrs = ocrs.map((line, idx) => { 
					return { "time": Math.round(scenes[idx]*1000), "ocr": line }
				});
				captions = captions.map((cap, idx) => {
					cap.ocr = ocrs[idx].ocr;
					return cap;
				});

				for(;progress < prog[7]; progress += 1) job.progress(progress);

				let responseFinal = { 
					file: { 
						url: url, 
						savedAs: xtools.toBase64(vidAddr), 
						length: duration 
					}, 
					"captions": captions 
				};
				if (process.env.DEBUG_SAM && process.env.DEBUG_VERBOSE)
					console.log("Final response: \n", responseFinal);
				job.log("Final response ready.");

				if (q.deleteFile) {
					await xtools.deleteManyFiles(toDelete);
					job.log("Deleting residual files.");
				}
					
				job.progress(100);

				job.data.responseFinal = responseFinal;

				
				return responseFinal;
			} catch (e) {
				throw Error(e);
			}
		}
    });

    upQueue.process(maxJobsPerWorker, async (job) => {
        let progress = 0,
        	prog = [ 10, 25, 40, 60, 75, 90, 97, 100 ];
        	/* [ 
        		duration, 
        		extract, frames, 
        		compression, captions, 
        		OCR, finalise 
        	] */
        let toDelete = [];

        let vidAddr = job.data.currentFilename;
        let q = job.data;
		if (process.env.DEBUG_SAM)
			console.log("Processing:", vidAddr);
		job.log("Begin processing. " + vidAddr);
		toDelete.push(vidAddr);

		let duration = await vtools.getDuration(vidAddr);
		if (process.env.DEBUG_SAM) console.log("Obtained duration.", duration);
		job.log("Obtained duration. " + duration);
		for(;progress < prog[0]; progress += 1) job.progress(progress);

		try {
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
			job.log("Scene changes extracted. " + scenes);
			for(;progress < prog[1]; progress += 1) job.progress(progress);

			let frameObject = await vtools.extractFrames(vidAddr, scenes);
			if (process.env.DEBUG_SAM) console.log("Frames extracted.", frameObject);
			job.log("Frames extracted. " + frameObject);
			for(;progress < prog[2]; progress += 1) job.progress(progress);

			let i = 1, compressed = [];
			while (i <= frameObject.numberOfFrames) {
					let imagePath = 
						path.join(
							__dirname, 
							"uploads", 
							"jpg", 
							"frame-" + frameObject.suffix + `-${i}.jpg`
						);
					let compressedImage = await xtools.sharpValidation(
						imagePath, "image/jpg"
					);

					compressed.push(compressedImage);
					toDelete.push(imagePath);
					i += 1;
				}

			if (process.env.DEBUG_SAM) console.log("Frames compressed.", compressed.length);
			job.log("Frames compressed. " + compressed.length);
			for(;progress < prog[3]; progress += 1) job.progress(progress);

			let captions = [];
			let describer = q.describer || "azure";
			if (describer == "densecap") {
				captions = await vtools.getCaption(null, compressed);
				captions = captions.map(function (cap, idx) {
					return { time: Math.round(scenes[idx]*1000), caption: cap[0].caption };
				});
			} else {
				captions = await vtools.getCaptionFromAzure(null, compressed);
				captions = captions.map(function (cap, idx) {
					return { 
						time: Math.round(scenes[idx]*1000), 
						caption: cap.caption, 
						tags: cap.tags 
					};
				});
			}
			if (process.env.DEBUG_SAM) console.log("Captions received.", captions.length);
			job.log("Captions received. " + captions.length);
			for(;progress < prog[4]; progress += 1) job.progress(progress);

			let ocrs = await vtools.getOCR(null, compressed);
			if (process.env.DEBUG_SAM) console.log("OCR complete.", ocrs);
			job.log("OCR complete. " + ocrs);
			for(;progress < prog[5]; progress += 1) job.progress(progress);

			ocrs = ocrs.map((line, idx) => { 
				return { "time": Math.round(scenes[idx]*1000), "ocr": line }
			});

			captions = captions.map((cap, idx) => {
				cap.ocr = ocrs[idx].ocr;
				return cap;
			});
			for(;progress < prog[6]; progress += 1) job.progress(progress);

			let responseFinal = { 
				file: { 
					url: null, 
					savedAs: xtools.toBase64(vidAddr), 
					length: duration 
				},
				"captions": captions 
			};
			if (process.env.DEBUG_SAM && process.env.DEBUG_VERBOSE)
				console.log("Final response: \n", responseFinal); 
			job.log("Final response ready.");

			if (q.deleteFile) {
				await xtools.deleteManyFiles(toDelete);
				job.log("Deleting residual files.");
			}
			
			job.progress(100);
			
			job.data.responseFinal = responseFinal;
			return responseFinal;
		} catch (e) {
			throw Error(e);
		}

        // A job can return values that will be stored in Redis as JSON
        return { value: "UP will be stored" };
    });
}

throng({ workers, start });