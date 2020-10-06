const path = require ('path');
const fs = require ('fs');

// For extracting audio
const fea = require ('ffmpeg-extract-audio');

const atools = require('../utils/atools');

const extractAV = function(addr) {
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

extractAV('/home/mihir/dev/clones/sm/uploads/tmp/video-1601998992335-886067872.mp4')
.then((pathf) => {
	atools.Ds_Wrap(null, null, pathf)
	.then(res => console.log(res))
	.catch(err => console.log(err));
})
.catch(e => console.log(e));