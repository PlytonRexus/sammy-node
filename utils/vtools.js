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
// for duration
const ffmpeg = require('fluent-ffmpeg');
// for azure
const fetch = require('node-fetch');
/**
 * Returns the duration of the supplied video
 * Uses ffmpeg and ffprobe
 * 
 * @param {string} filePath
 * @returns {Promise<number>} Duration
 */
exports.getDuration = function (filePath) {
	return new Promise((resolve, reject) => {
		ffmpeg.ffprobe(filePath, (error, metadata) => {
			if (error) {
				if (process.env.DEBUG_SAM)
					console.log("duration error:", error);
				reject(error);
			}
			if (process.env.DEBUG_SAM && process.env.VERBOSE_SAM) 
				console.log(metadata);
			resolve(metadata.format.duration);
		});
	});
}
/**
 * Returns an array of timestamps corresponding to
 * scene changes in the video
 * Uses ffmpeg
 * **Experimental**
 *
 * @param {string} filePath
 * @param {number} [filterSize=0.1]
 * @returns {Promise<Array<number>>} Array of timestamps
 */
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
/**
 * Returns an object containing the suffix of the extracted
 * frames and the number of frames extracted
 * Uses ffmpeg
 *
 * @param {string} filePath
 * @param {Array<string>} arrOfScenes
 * @returns {Promise<object>} { suffix, numberOfFrames }
 */
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
/**
 * Returns an array of captions for the provided images
 * Uses deepAI
 * Makes calls to DenseCap API, internet required
 * Terribly inaccurate
 *
 * @param {string} filePath
 * @param {Array<string>} filePaths
 * @returns {Promise<Array<object>>|Promise<object>} captions
 */
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
/**
 * Returns OCR strings of provided images
 * Uses Tesseract
 * No internet connection
 *
 * @param {string} filePath
 * @param {Array<string>} filePaths
 * @returns {Promise<Array<string>>|Promise<string>} OCR response
 */
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
/**
 * Returns an array of captions for the provided images
 * Uses fetch
 * Makes calls to Azure CV, internet required
 * Far more accurate than getCaptions()
 * 
 * @param {*} filePath
 * @param {*} filePaths
 * @returns
 */
exports.getCaptionFromAzure = function(filePath, filePaths) {
	return new Promise(async (resolve, reject) => {
		async function getCaptionsForOne(p) {
			const stats = fs.statSync(p);
			const fileSizeInBytes = stats.size;
			const { AZURE_CV_ENDPOINT:endpoint, AZURE_CV_KEY_1:apikey } = process.env;

			// let readStream = await fs.createReadStream(p);
			//var stringContent = fs.readFileSync(p, 'utf8');
			let bufferContent = fs.readFileSync(p);

			let res = await fetch(endpoint, {
			    method: 'POST',
			    headers: {
			        "Content-length": fileSizeInBytes,
			        "Ocp-Apim-Subscription-Key": apikey,
			        "Content-Type": "application/octet-stream"
			    },
			    body: bufferContent
			})
		    return (await res.json());
		}

		if (filePath) {
			try {
				let rs  = await getCaptionsForOne(filePath);
			    resolve({ caption: rs.description.captions[0] ? rs.description.captions[0].text : null, tags: rs.description.tags });
			} catch (err) {
				if (process.env.DEBUG_SAM) console.log("Azure API error:", err);
				reject(err);
			}
		}
		if (filePaths) {
			let responses = [];
			try {
				for (let i = 0; i < filePaths.length; i ++) {
					responses.push(await getCaptionsForOne(filePaths[i]));
				}
				resolve(responses.map(rs => ({ caption: rs.description.captions[0] ? rs.description.captions[0].text : null, tags: rs.description.tags })));
			} catch (err) {
				if (process.env.DEBUG_SAM) console.log("Azure API error:", err);
				reject(err);
			}
		}

	});
}