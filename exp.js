const express = require ('express');
const Queue = require('bull');

const vid = require ('./routes/vid');
const errors = require ('./routes/errors');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const sdQueue = new Queue('sd', REDIS_URL);
const upQueue = new Queue('up', REDIS_URL);

const exp = express();

exp.set('x-powered-by', 'false');

exp.use(function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Methods", "*");
	res.header("Access-Control-Allow-Headers", 
		"Authorization, Accept, Content-Type, Origin, X-Requested-With");
	next();
});

exp.use("/", express.static("./public"));
exp.use("/files", express.static("./binaries"));
exp.use("/uploads", express.static("./uploads"));

exp.use(express.json());
exp.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV == undefined || process.env.NODE_ENV == 'development') {
    const morgan = require ('morgan');
    exp.use(morgan('dev'));
}

exp.use("/vid", vid);

// You can listen to global events to get notified when jobs are processed
sdQueue.on('global:completed', (jobId, result) => {
	console.log(`Job ${jobId} completed with result: ${result}`);
});
upQueue.on('global:completed', (jobId, result) => {
	console.log(`Job ${jobId} completed with result: ${result}`);
});

exp.use(errors);

module.exports = exp;