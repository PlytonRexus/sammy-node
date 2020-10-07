const express = require ('express');
const multer = require ('multer');

// const wav = require ('./routes/wav');
const vid = require ('./routes/vid');
const home = require ('./routes/home');
const errors = require ('./routes/errors');

const exp = express();

exp.set('x-powered-by', 'false');

exp.use(function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Methods", "*");
	res.header("Access-Control-Allow-Headers", "Authorization, Accept, Content-Type, Origin, X-Requested-With");
	next();
});

exp.use("/files", express.static("./binaries"));
exp.use("/uploads", express.static("./uploads"));

exp.use(express.json());
exp.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV == undefined || process.env.NODE_ENV == 'development') {
    const morgan = require ('morgan');
    exp.use(morgan('dev'));
}

exp.use("", home);
// exp.use("/wav", wav);
exp.use("/vid", vid);

exp.use(errors);

module.exports = exp;