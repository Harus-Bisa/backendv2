const School = require('../models/School');

class SchoolService {
	// return Object.freeze({
	// 	getSchoolsByName,
	// 	addRevieweeCount,
	// 	addVisitedCount,
	// 	getMostPopular,
	// });

	async getSchoolsByName(school) {
		const schoolQuery = school ? `(?i)(^| )${school}.*` : '.*';
		let schools = await School.find({ name: { $regex: schoolQuery } });
		schools = schools.map((school) => {
			return school.name;
		});

		return { schools };
	}

	async addRevieweeCount(schoolName) {
		// create if not exist (use upsert)
		let newSchool = await School.findOneAndUpdate(
			{ name: schoolName },
			{ name: schoolName, $inc: { revieweeCount: 1 } },
			{
				upsert: true,
				useFindAndModify: false,
			}
		);
		return { newSchool };
	}

	async addVisitedCount(schoolName) {
		// create if not exist (use upsert)
		let newSchool = await School.findOneAndUpdate(
			{ name: schoolName },
			{ name: schoolName, $inc: { visitedCount: 1 } },
			{
				upsert: true,
				useFindAndModify: false,
			}
		);
		return { newSchool };
	}

	async getMostPopular() {
		// school that is most visited is the most popular
		let schools = await School.find()
			.sort({ visitedCount: -1 })
			.limit(10); // get 10 most popular
		schools = schools.map((school) => {
			return school.name;
		});

		return { schools };
	}
}

module.exports = SchoolService;
