  
const express = require('express');
const bodyParser = require('body-parser');

const router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

const User = require('../models/User.js');

router.post('/reviews', async (req, res, next) => {
    const userData = {
        name: req.body.name,
        school: req.body.school,
        reviews: [{
            review: req.body.review,
            courseName: req.body.courseName,
            overallRating: req.body.overallRating,
            recommendationRating: req.body.recommendationRating,
            difficultyRating: req.body.difficultyRating,
            yearTaken: req.body.yearTaken,
            helpfulUpVote: 0,
            helpfulDownVote: 0
        }]
    }
    User.create(userData, (err, user) => {
        console.log(user);
    });
    res.statusMessage = "Success";
    return res.status(201).send();
});

router.post('/users/:userId/reviews', async (req, res, next) => {
    const newReview = {
        review: req.body.review,
            courseName: req.body.courseName,
            overallRating: req.body.overallRating,
            recommendationRating: req.body.recommendationRating,
            difficultyRating: req.body.difficultyRating,
            yearTaken: req.body.yearTaken,
            helpfulUpVote: 0,
            helpfulDownVote: 0
    };
    User.findByIdAndUpdate(req.params.userId, {$push: {reviews: newReview}}, {new: true}, (err, user) => {
        console.log(user);
    });
    res.statusMessage = "Success";
    return res.status(201).send();
});

router.get('/users', async (req, res, next) => {
    let searchQuery = req.query.name ? '(?i)'+req.query.name+'.*' : '.*';
    let users = await User.find({name: {$regex: searchQuery}});
    users = users.map(user => {
        return {
            userId: user._id,
            name: user.name,
            school: user.school
        }
    });

    res.statusMessage = "Success";
    return res.status(200).send(users);
});

router.get('/users/:userId/reviews', async (req, res, next) => {
    let user = await User.findById(req.params.userId);
    let sumOverallRating = 0;
    let sumRecommendationRating = 0;
    let sumDifficultyRating = 0;

    for (let i = 0; i<user.reviews.length; i++) {
        sumOverallRating += user.reviews[i].overallRating;
        sumDifficultyRating += user.reviews[i].difficultyRating;
        sumRecommendationRating += user.reviews[i].recommendationRating;

        let review = user.reviews[i].toObject();
        review.reviewId = review._id;
        delete review._id;
        user.reviews[i] = review;
    }

    user = user.toObject();
    user.userId = user._id;
    user.numberOfReviews = user.reviews.length;
    user.overallRating = sumOverallRating / user.reviews.length;
    user.recommendationRating = sumRecommendationRating / user.reviews.length;
    user.difficultyRating = sumDifficultyRating / user.reviews.length;
    delete user.__v;
    delete user._id;

    res.statusMessage = "Success";
    return res.status(200).send(user);
});

// router.post('/users/:userId/reviews/:reviewId/:upOrDownVote', async (req, res, next) => {
//     User.findByIdAndUpdate(req.params.userId, )

//     res.statusMessage = "Success";
//     return res.status(201).send();
// });

module.exports = router;