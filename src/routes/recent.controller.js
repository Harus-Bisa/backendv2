const express = require('express');

const RecentService = require('../services/recent.service');

const router = express.Router();
const recentService = new RecentService();

router.get('/reviews', async (req, res) => {
  try {
    const { mostRecentReviews } = await recentService.getMostRecentReviews(
      'review'
    );
    res.statusMessage = 'Get most recent reviews is successful.';
    return res.status(200).send(mostRecentReviews);
  } catch (err) {
    console.log(err);
    res.statusMessage = 'There was an error getting the most recent reviews.';
    return res.status(500).end();
  }
});

module.exports = router;
