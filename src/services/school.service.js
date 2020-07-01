const School = require('../models/School');

class SchoolService {
	async createSchool(schoolName) {
		let school = await School.createSchool(schoolName);
		school = school.toObject();

		delete school._id;
		delete school.__v;

		return school;
	}

	async getSchoolsByName(school) {
		let schools = await School.getSchoolsByName(school);

		schools = schools.map((school) => {
			return school.name;
		});

		return { schools };
	}

	async addRevieweeCount(schoolName) {
		// create if not exist (use upsert)
		let newSchool = await School.addRevieweeCountByName(schoolName);
		return { newSchool };
	}

	async addVisitedCount(schoolName) {
		let newSchool = await School.addVisitedCountByName(schoolName);
		return { newSchool };
	}

	async getMostPopularByVisited(limit = 10) {
		limit = parseInt(limit);
		let schools = await School.getMostPopularByVisited(limit);

		schools = schools.map((school) => {
			return school.name;
		});

		return { schools };
	}

	async getMostPopularByRevieweeCount(limit = 10) {
		limit = parseInt(limit);
		let schools = await School.getMostPopularByRevieweeCount(limit);

		schools = schools.map((school) => {
			return school.name;
		});

		return { schools };
	}
}

module.exports = SchoolService;
