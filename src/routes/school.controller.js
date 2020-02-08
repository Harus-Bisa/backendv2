const express = require('express');

const SchoolService = require('../services/school.service');

const router = express.Router();
const schoolService = SchoolService();

router.get('/', async (req, res) => {
	try {
		const { schools } = await schoolService.getSchoolsByName(req.query.school);
		res.statusMessage = 'Get list of schools matching the query is successful.';
		return res.status(200).send(schools);
	} catch (err) {
		console.log(err);
		res.statusMessage =
			'There was an error getting the schools matching the query.';
		return res.status(500).end();
	}
});

module.exports = router;
