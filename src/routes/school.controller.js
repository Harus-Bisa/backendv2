const express = require('express');

const SchoolService = require('../services/school.service');

const router = express.Router();
const schoolService = new SchoolService();

router.get('/', async (req, res) => {
	try {
		const schoolName = req.query.school;
		const { schools } = await schoolService.getSchoolsByName(schoolName);
		res.statusMessage = 'Get list of schools matching the query is successful.';
		return res.status(200).send(schools);
	} catch (err) {
		console.log(err);
		res.statusMessage =
			'There was an error getting the schools matching the query.';
		return res.status(500).end();
	}
});

router.get('/popular', async (req, res) => {
	try {
		const limit = req.query.limit;
		const { schools } = await schoolService.getMostPopularByVisited(limit);
		res.statusMessage = 'Get most popular schools is successful.';
		return res.status(200).send(schools);
	} catch (err) {
		console.log(err);
		res.statusMessage = 'There was an error getting the most popular schools.';
		return res.status(500).end();
	}
});

module.exports = router;
