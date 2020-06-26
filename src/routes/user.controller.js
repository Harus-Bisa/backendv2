const express = require('express');
const UserService = require('../services/user.service');
const authentication = require('../middlewares/auth.middleware');

const router = express.Router();
const userService = new UserService();

router.get('/:userId', authentication, async (req, res) => {
  if (!req.authenticated) {
		res.statusMessage = 'Authentication is required to get user data.';
		return res.status(401).end();
	}
	try {
		const requestedUserId = req.params.userId;
		const { user } = await userService.getUserById(requestedUserId);
		if (user) {
      if (req.params.userId == req.userId) {
        res.statusMessage = 'Get user is successful.';
			  return res.status(200).send(user);
      } else {
        res.statusMessage = 'Please authenticate with the correct credential.';
        return res.status(401).end();
      }
			
		} else {
			res.statusMessage = 'User not found.';
			return res.status(404).end();
		}
	} catch (err) {
		console.log(err);
		res.statusMessage = 'There was an error getting the user.';
		return res.status(500).end();
	}
});

module.exports = router;
