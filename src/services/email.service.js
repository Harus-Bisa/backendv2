const config = require('../config');

class EmailService {
	async sendEmail(to, subject, message) {
		const from = 'noreply@dosen-ku.com';
		const msg = {
			to: to,
			from: from,
			subject: subject,
			text: message,
		};

		// SENDGRID
		const sgMail = require('@sendgrid/mail');
		sgMail.setApiKey(config.sendgridAPIKey);
		sgMail.send(msg);

		// 	if (to == 'dosenku.official@gmail.com') {
		// 		// MAILGUN
		// 		const nodemailer = require('nodemailer');
		// 		const mg = require('nodemailer-mailgun-transport');
		// 		const auth = {
		// 			auth: {
		// 				api_key: config.mailgunAPIKey,
		// 				domain: config.mailgunDomain,
		// 			},
		// 		};
		// 		const nodemailerMailgun = nodemailer.createTransport(mg(auth));
		// 		nodemailerMailgun.sendMail(msg);

		// 		// PEPIPOST
		// 		const lib = require('pepipost');
		// 		const controller = lib.EmailController;
		// 		let apiKey = config.pepipostAPIKey;
		// 		let body = new lib.EmailBody();

		// 		body.personalizations = [];
		// 		body.personalizations[0] = new lib.Personalizations();
		// 		body.personalizations[0].recipient = to;

		// 		body.from = new lib.From();
		// 		body.from.fromEmail = from;
		// 		body.subject = subject;
		// 		body.content = message;
		// 		BASE_URI = 'dosen-ku.com';

		// 		const promise = controller.createSendEmail(apiKey, body, BASE_URI);

		// 		promise.then(
		// 			(response) => {
		// 				console.log(response);
		// 			},
		// 			(err) => {
		// 				console.log(response);
		// 			}
		// 		);
		// 	}
	}
}

module.exports = EmailService;
