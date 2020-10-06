const express = require ('express');
const router = express.Router();

router.get("/", function(req, res) {
	console.log("It's the home. Yesss! No, not a home run.");
	res.json({ "1": " 1" });
});

module.exports = router;