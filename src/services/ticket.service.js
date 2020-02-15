const Ticket = require('../models/Ticket');
const nodemailer = require('nodemailer');
const mg = require('nodemailer-mailgun-transport');
const config = require('../config');

function TicketService() {
	return Object.freeze({
		createTicket,
	});

	async function createTicket(ticketInformation) {
		ticketInformation.createAt = Date.now();

		const auth = {
			auth: {
				api_key: config.mailgunAPIKey,
				domain: config.mailgunDomain,
			},
		};
		const nodemailerMailgun = nodemailer.createTransport(mg(auth));
		const message =
			`<p>Target id: ${ticketInformation.targetId}</p>` +
			`<p>Target type: ${ticketInformation.targetType}</p>` +
			`<p>Author id: ${ticketInformation.authorId}</p>` +
			`<p>Author email: ${ticketInformation.authorEmail}</p>` +
			`<p>Message: ${ticketInformation.message}</p>`;

		nodemailerMailgun.sendMail({
			from: 'noreply@dosen-ku.com',
			to: 'dosenku.official@gmail.com',
			subject: ticketInformation.subject,
			html: message,
		});

		let newTicket = await Ticket.create(ticketInformation);
		return { newTicket };
	}
}

module.exports = TicketService;
