const { join } = require ('path');

const Queue = require('bull');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const opts = {
	redis: {
		port: 6379,
		host: '127.0.0.1',
		db: 1,
		password: process.env.REDIS_PASS
	}
};
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

	let mode = getMode(req).
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
	let mode = getMode(req).
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