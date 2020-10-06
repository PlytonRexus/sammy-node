const path = require ('path');
const fs = require('fs');

// for scene detection
const ds_f = require("@samuelcalegari/ds_ffmpeg");
// for frame extraction
const fefq = require ('ffmpeg-extract-frames-quality');
// for image captioning
const deepai = require('deepai');
// for OCR
const tesseract = require("node-tesseract-ocr");

exports.extractScenes = function (filePath, filterSize = 0.1) {
	return new Promise((resolve, reject) => {
		ds_f(filePath, filterSize)
		.then(function(r) {
		    resolve(r);
		})
		.catch(function(error) {
		    if (process.env.DEBUG_SAM) console.error(error);
		    reject(error);
		});
	})
}

exports.extractFrames = function(filePath, arrOfScenes) {
	return new Promise((resolve, reject) => {
		let uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
		fefq({
			input: filePath,
			output: path.join(
				__dirname, "..", 
				"uploads", "jpg", 
				'frame-' + uniqueSuffix + '-%i.jpg'),
			offsets: arrOfScenes.map(v => v * 1000)
		})
		.then(() => {
			resolve({ 
				suffix: uniqueSuffix, 
				numberOfFrames: arrOfScenes.length 
			});
		})
		.catch((e) => {
			if (process.env.DEBUG_SAM) 
				console.log("Something went wrong in extraction of frames! " + e);
			reject("Something went wrong in extraction of frames! " + e);
		});
	});
}

exports.getCaption = function(filePath, filePaths) {
	return new Promise(async (resolve, reject) => {

		deepai.setApiKey(process.env.DENSECAP_KEY);

		if (filePath) {
			try {
				let response = await deepai.callStandardApi("densecap", {
		            image: fs.createReadStream(filePath)
			    });
			    resolve(response.captions.slice(0, 3));
			} catch (err) {
				if (process.env.DEBUG_SAM) 
					console.log("Caption generator error:", err);
				reject(err);
			}
		}
		if (filePaths) {
			let responses = [];
			try {
				for (let i = 0; i < filePaths.length; i ++) {
					responses.push(await deepai.callStandardApi("densecap", {
			            image: fs.createReadStream(filePaths[i])
				    }));
				}
				resolve(responses.map(resp => resp.output.captions.slice(0, 3)));
			} catch (err) {
				if (process.env.DEBUG_SAM) console.log("Caption generator error:", err);
				reject(err);
			}
		}
	});
};

exports.getOCR = function(filePath, filePaths) {
	return new Promise(async (resolve, reject) => {
		const config = {
		    lang: "eng",  
		    oem: 1,
		    psm: 3,
		};

		if (filePath) {
			try {
				let text  = await tesseract.recognize(filePath, config);
			    resolve(text);
			} catch (err) {
				if (process.env.DEBUG_SAM) console.log("Tesseract error:", err);
				reject(err);
			}
		}
		if (filePaths) {
			let responses = [];
			try {
				for (let i = 0; i < filePaths.length; i ++) {
					responses.push(await tesseract.recognize(filePaths[i], config));
				}
				resolve(responses);
			} catch (err) {
				if (process.env.DEBUG_SAM) console.log("Tesseract error:", err);
				reject(err);
			}
		}
	});
}
