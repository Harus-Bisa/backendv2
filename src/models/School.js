const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
	name: { type: String, index: { unique: true } },
	revieweeCount: Number,
	visitedCount: Number,
});

schoolSchema.statics.createSchool = function(schoolName) {
	return this.create({ name: schoolName });
};

schoolSchema.statics.getSchoolsByName = function(schoolName) {
	const schoolQuery = schoolName ? `(?i)(^| )${schoolName}.*` : '.*';

	return this.find({ name: { $regex: schoolQuery } })
		.collation({ locale: 'en' })
		.sort({ name: 1 });
};

schoolSchema.statics.getMostPopularByVisited = function(limit) {
	return this.find()
		.sort({ visitedCount: -1 })
		.limit(limit);
};

schoolSchema.statics.getMostPopularByRevieweeCount = function(limit) {
	return this.find()
		.sort({ revieweeCount: -1 })
		.limit(limit);
};

schoolSchema.statics.addVisitedCountByName = function (schoolName) {
	return this.findOneAndUpdate(
		{ name: schoolName },
		{ name: schoolName, $inc: { visitedCount: 1 } },
		{
			upsert: true,
		}
	);
}

schoolSchema.statics.addRevieweeCountByName = function (schoolName) {
	return this.findOneAndUpdate(
		{ name: schoolName },
		{ name: schoolName, $inc: { revieweeCount: 1 } },
		{
			upsert: true,
		}
	);
}

module.exports = mongoose.model('School', schoolSchema);
