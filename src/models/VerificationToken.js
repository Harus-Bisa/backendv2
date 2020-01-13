const mongoose = require('mongoose');

const verificationTokenSchema = new mongoose.Schema({
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		required: true,
		ref: 'User',
	},
	token: { type: String, required: true },
	createdAt: { type: Date, required: true, default: Date.now, expires: 43200 }, // auto delete in 12 hours
});

module.exports = mongoose.model('VerificationToken', verificationTokenSchema);
