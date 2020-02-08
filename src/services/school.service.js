const School = require('../models/School');

function SchoolService() {
	return Object.freeze({
		getSchoolsByName,
		addToSchoolList,
	});

	async function getSchoolsByName(school) {
		const schoolQuery = school ? `(?i)(^| )${school}.*` : '.*';
		let schools = await School.find({ school: { $regex: schoolQuery } });
		schools = schools.map((school) => {
			return school.school;
		});

		return { schools };
	}

	async function addToSchoolList(school) {
		const schoolData = {
			school,
		};
		// add if not exist (use upsert)
		let newSchool = await School.update(schoolData, schoolData, {
			upsert: true,
		});
		return { newSchool };
	}
}

module.exports = SchoolService;
