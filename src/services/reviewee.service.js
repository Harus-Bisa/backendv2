const Reviewee = require('../models/Reviewee');

function RevieweeService() {
    return Object.freeze({
        createRevieweeWithReview,
        getRevieweesByName,
        createReview,
        getReviewee,
        addHelpfullnessVote
    });

    async function createRevieweeWithReview(revieweeData) {
        const formatedData = {
            name: revieweeData.name,
            school: revieweeData.school,
            reviews: [{
                review: revieweeData.review,
                courseName: revieweeData.courseName,
                overallRating: revieweeData.overallRating,
                recommendationRating: revieweeData.recommendationRating,
                difficultyRating: revieweeData.difficultyRating,
                yearTaken: revieweeData.yearTaken,
                tags: revieweeData.tags,
                textbookRequired: revieweeData.textbookRequired,
                teachingStyles: revieweeData.teachingStyles,
                helpfulUpVote: 0,
                helpfulDownVote: 0,
            }]
        }

        const newReviewee = await Reviewee.create(formatedData);

        return {newReviewee: formatRevieweeObject(newReviewee)};
    }

    async function getRevieweesByName(name) {
        const searchQuery = name ? `(?i)(^| )${name}.*` : '.*';
        let reviewees = await Reviewee.find({name: {$regex: searchQuery}});
        reviewees = reviewees.map(reviewee => {
            return {
                revieweeId: reviewee._id,
                name: reviewee.name,
                school: reviewee.school
            }
        });

        return {reviewees};
    }

    async function createReview(revieweeId, reviewData) {
        let newReview = {
            ...reviewData,
            helpfulDownVote: 0,
            helpfulUpVote: 0
        };

        const reviewee = await Reviewee.findByIdAndUpdate(
            revieweeId, 
            {$push: {reviews: newReview}}, 
            {new: true}
        );

        let foundRevieweeId;
        if (reviewee) {
            foundRevieweeId = reviewee._id;
            newReview = formatReviewObject(reviewee.reviews.pop());
        } else {
            foundRevieweeId = null;
            newReview = null;
        }

        return {revieweeId: foundRevieweeId, newReview};
    }

    async function getReviewee(revieweeId) {
        const reviewee = await Reviewee.findById(revieweeId);
        return {reviewee: formatRevieweeObject(reviewee)};
    }

    async function addHelpfullnessVote(revieweeId, reviewId, vote) {
        const voteSelector = (vote === 'upVote') ? 'reviews.$[elem].helpfulUpVote' : 'reviews.$[elem].helpfulDownVote';
        const reviewee = await Reviewee.findByIdAndUpdate(
            revieweeId, 
            {$inc : {[voteSelector]: 1}}, 
            {
                arrayFilters: [{'elem._id': reviewId}], 
                new: true
            }
        )

        let votedReview = null;
        if (reviewee) {
            votedReview = reviewee.reviews.find(review => review._id == reviewId);
            votedReview = formatReviewObject(votedReview);
        }
        return {votedReview};
    }

    function formatRevieweeObject(revieweeObject) {
        if (!revieweeObject) {
            return null;
        }
        let formattedReviewee = revieweeObject;

        // initialization to calculate reviews average
        let sumOverallRating = 0;
        let sumRecommendationRating = 0;
        let sumDifficultyRating = 0;

        // accumulate reviews rating
        for (let i = 0; i<formattedReviewee.reviews.length; i++) {
            sumOverallRating += formattedReviewee.reviews[i].overallRating;
            sumDifficultyRating += formattedReviewee.reviews[i].difficultyRating;
            sumRecommendationRating += formattedReviewee.reviews[i].recommendationRating;

            formattedReviewee.reviews[i] = formatReviewObject(formattedReviewee.reviews[i]);
        }

        formattedReviewee = formattedReviewee.toObject();
        formattedReviewee.revieweeId = formattedReviewee._id;
        formattedReviewee.numberOfReviews = formattedReviewee.reviews.length;
        formattedReviewee.overallRating = sumOverallRating / formattedReviewee.reviews.length;
        formattedReviewee.recommendationRating = sumRecommendationRating / formattedReviewee.reviews.length;
        formattedReviewee.difficultyRating = sumDifficultyRating / formattedReviewee.reviews.length;
        delete formattedReviewee.__v;
        delete formattedReviewee._id;
        return formattedReviewee;
    }

    function formatReviewObject(reviewObject) {
        if (!reviewObject) {
            return null;
        }
        let formattedReview = reviewObject.toObject();
        formattedReview.reviewId = formattedReview._id;
        delete formattedReview._id;
        return formattedReview;
    }
}

module.exports = RevieweeService;
