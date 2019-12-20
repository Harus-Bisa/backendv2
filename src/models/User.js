const mongoose = require('mongoose');  
const userSchema = new mongoose.Schema({  
	name: String,
	school:String,
	reviews: [{
		review: String,
		courseName: String,
		overallRating: Number,
		recommendationRating: Number,
		difficultyRating: Number,
		yearTaken: Number,
		helpfulUpVote: Number,
		helpfulDownVote: Number
	}]
});

module.exports = mongoose.model('User', userSchema);