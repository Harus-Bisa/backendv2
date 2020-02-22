const School = require('../models/School');

function SchoolService() {
	return Object.freeze({
		getSchoolsByName,
		addRevieweeCount,
		getMostPopular,
	});

	async function getSchoolsByName(school) {
		const schoolQuery = school ? `(?i)(^| )${school}.*` : '.*';
		let schools = await School.find({ name: { $regex: schoolQuery } });
		schools = schools.map((school) => {
			return school.name;
		});

		return { schools };
	}

	async function addRevieweeCount(schoolName) {
		const schoolData = {
			name: schoolName,
		};
		// create if not exist (use upsert)
		let newSchool = await School.findOneAndUpdate(
			{ name: schoolName },
			{ name: schoolName, $inc: { revieweeCount: 1 } },
			{
				upsert: true,
				useFindAndModify: false
			}
		);
		return { newSchool };
	}

	async function getMostPopular() {
		let schools = await School.find()
			.sort({ revieweeCount: -1 })
			.limit(10); // get 10 most popular
		schools = schools.map((school) => {
			return school.name;
		});

		return { schools };
	}
}

module.exports = SchoolService;
