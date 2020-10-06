const express = require('express');
const exp = express();
const errorRouter = express.Router();

exp.use((req, res, next) => {
	const error = new Error("Not Found!");
	error.status = 404;
	next(error);
});

exp.use((error, req, res, next) => {
	res.status(error.status || 500);
	res.json({
		errors:{
			message: error.message
		}
	});
});

module.exports = exp;