const path = require ('path');

const throng = require('throng');
const Queue = require("bull");

const wtools = require ('./utils/wtools');
const xtools = require ('./utils/xtools');
const vtools = require ('./utils/vtools');

let REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const opts = {
	redis: {
		port: process.env.REDIS_PORT || 6379,
		host: process.env.REDIS_HOST || '127.0.0.1',
		db: 0,
		password: process.env.REDIS_PASS
	}
};

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
				if (q.describer == "densecap") {
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

				for(;progress < prog[7]; progress += 1) job.progress(progress);

				let responseFinal = { "captions": captions, "ocr": ocrs };
				if (process.env.DEBUG_SAM && process.env.DEBUG_VERBOSE)
					console.log("Final response: \n", responseFinal);
				job.log("Final response ready.");

				await xtools.deleteManyFiles(toDelete);
				job.log("Deleting residual files.");
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
			if (q.describer == "densecap") {
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
			for(;progress < prog[6]; progress += 1) job.progress(progress);

			let responseFinal = { "captions": captions, "ocr": ocrs };
			if (process.env.DEBUG_SAM && process.env.DEBUG_VERBOSE)
				console.log("Final response: \n", responseFinal); 
			job.log("Final response ready.");

			await xtools.deleteManyFiles(toDelete);
			job.log("Deleting residual files.");
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