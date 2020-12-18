const { join } = require ('path');

const Queue = require('bull');

const xtools = require('../utils/xtools');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const opts = xtools.redisOpts;
const sdQueue = new Queue('sd', opts);
const upQueue = new Queue('up', opts);

function getMode(req) {
	let q = req.query,
		mode = "sd";
	if (q.mode == "up")
		mode = "up";

	return mode;
}

async function doAsyncTree(cbsd, cbup, mode) {
	let logs;
	if (mode == "sd") {
		logs = await cbsd;
	} else if (mode == "up") {
		logs = await cbup;
	}

	return logs;
}

exports.getLogs = async function(req, res) {
	let mode = getMode(req),
		id = parseInt(req.params.id),
		logs = { "Error": "Invalid request" };

	try {
		if (mode == "sd") {
			logs = await sdQueue.getJobLogs(id, 0);
		} else if (mode == "up") {
			logs = await upQueue.getJobLogs(id, 0);
		}

		res.json({ id, logs });
	} catch(e) {
		res.status(500).json({ "Error": e });
	}
		
}

exports.retryJob = async function(req, res) {
	// Only for failed jobs

	let mode = getMode(req),
		id = req.params.id;
	try {
		if (mode == "sd") {
			let x = await sdQueue.getJob(id);
			await x.retry();
		} else if (mode == "up") {
			let x = await upQueue.getJob(id);
			await x.retry();
		}

		res.json({ id, status:"back in queue" });
	} catch(e) {
		res.status(500).json({ "Error": e });
	}
}

exports.removeJob = async function(req, res) {
	let mode = getMode(req),
		id = req.params.id;
	try {
		if (mode == "sd") {
			let x = await sdQueue.getJob(id);
			await x.remove();
		} else if (mode == "up") {
			let x = await upQueue.getJob(id);
			await x.remove();
		}

		res.json({ id, status:"removed from queue" });
	} catch(e) {
		res.status(500).json({ "Error": e });
	}
}

exports.restartQueue = async function(req, res) {
	let mode = getMode(req);
	try {
		if (mode == "sd") {
			await sdQueue.pause();
			await sdQueue.resume();
		} else if (mode == "up") {
			await upQueue.pause();
			await upQueue.resume();
		}

		res.json({ "status": "Queue paused and resumed" });
	} catch(e) {
		res.status(500).json({ "Error": e });
	}
}

exports.activateJob = async function(req, res) {
	let mode = getMode(req),
		id = req.params.id;
	try {
		if (mode == "sd") {
			await sdQueue.moveToActive(id);
		} else if (mode == "up") {
			await upQueue.moveToActive(id);
		}

		res.json({ "status": "Moved" });
	} catch(e) {
		res.status(500).json({ "Error": e });
	}
}

exports.status = async (req, res) => {
	let url = req.query.url;
	if (url === "https://raw.githubusercontent.com/PlytonRexus/sammy-web/master/videoplayback_2.mp4") {
		return res.json({ 
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
		});
	}
	else if (url === "https://raw.githubusercontent.com/PlytonRexus/sammy-web/master/videoplayback_3.mp4") {
		return res.json({
			"id": "345",
			"state": "completed",
			"progress": 100,
			"responseFinal": {
			  "file": {
				"url": "https://raw.githubusercontent.com/PlytonRexus/sammy-web/master/videoplayback_3.mp4",
				"savedAs": "L2FwcC91cGxvYWRzL3RtcC92aWRlby0xNjA4MzI0MTA1Mzc3LTY2ODUxNjk5MC5tcDQ=",
				"length": 10.054
			  },
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
			}
		  });
	} else if (url === "https://raw.githubusercontent.com/PlytonRexus/sammy-web/master/videoplayback.mp4") {
		return res.json({
			"id": "347",
			"state": "completed",
			"progress": 100,
			"responseFinal": {
			  "file": {
				"url": "https://raw.githubusercontent.com/PlytonRexus/sammy-web/master/videoplayback.mp4",
				"savedAs": "L2FwcC91cGxvYWRzL3RtcC92aWRlby0xNjA4MzI0NDE5NzExLTUzMjQwNDY2Ny5tcDQ=",
				"length": 10.101
			  },
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
			}
		  });
	}

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