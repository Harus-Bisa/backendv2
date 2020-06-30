const User = require('../models/User');

class UserService {
  async createUser(email, password) {
    let newUser = await User.createUser(email, password);

    if (newUser) {
      newUser = newUser.toObject();
      newUser.userId = newUser._id;

      delete newUser.password;
      delete newUser._id;
      delete newUser.__v;
    }
    return { newUser };
  }

  async getUserByEmail(email, withPassword = false) {
    let user = await User.findByEmail(email);
    if (user) {
      user = user.toObject();
      user.userId = user._id;

      if (!withPassword) {
        delete user.password;
      }
      delete user._id;
      delete user.__v;
    }
    return { user };
  }

  async getUserById(userId) {
    let user = await User.findById(userId);
    if (user) {
      user = user.toObject();
      user.userId = user._id;

      delete user.password;
      delete user._id;
      delete user.__v;
    }
    return { user };
  }

  async addOutgoingReview(userId, revieweeId, reviewId) {
    const review = {
      revieweeId,
      reviewId,
    };

    await User.addOutgoingReview(userId, review);
    return { outgoingReview: review };
  }

  async addReportedReview(userId, revieweeId, reviewId) {
    const review = {
      revieweeId,
      reviewId,
    };
    const user = await User.findByIdAndUpdate(
      userId,
      { $push: { reportedReviews: review } },
      { new: true }
    );
  }

  async updateHelpfulnessVote(userId, revieweeId, reviewId, vote) {
    let cancelVote = false;
    let switchVote = false;
    let selectedVote = {
      revieweeId,
      reviewId,
      vote,
    };

    let user = await User.findById(userId);
    let existingReviewVote;

    if (user) {
      existingReviewVote = user.helpfulnessVotes.find(
        (curVote) =>
          revieweeId == curVote.revieweeId && reviewId == curVote.reviewId
      );
    } else {
      return { cancelVote, switchVote, selectedVote, user };
    }

    if (!existingReviewVote) {
      // not yet vote previously
      user = await User.findByIdAndUpdate(
        userId,
        { $push: { helpfulnessVotes: selectedVote } },
        { new: true }
      );
    } else if (existingReviewVote && existingReviewVote.vote !== vote) {
      // change vote (up to down or down to up)
      switchVote = true;
      const voteSelector = 'helpfulnessVotes.$[elem].vote';
      user = await User.findByIdAndUpdate(
        userId,
        { $set: { [voteSelector]: vote } },
        {
          arrayFilters: [
            {
              'elem.revieweeId': existingReviewVote.revieweeId,
              'elem.reviewId': existingReviewVote.reviewId,
            },
          ],
          new: true,
        }
      );
    } else {
      // cancel vote
      cancelVote = true;
      user = await User.findByIdAndUpdate(
        userId,
        {
          $pull: {
            helpfulnessVotes: {
              revieweeId: existingReviewVote.revieweeId,
              reviewId: existingReviewVote.reviewId,
            },
          },
        },
        { new: true }
      );
    }
    return { cancelVote, switchVote, selectedVote, user };
  }

  async verifyUser(userId) {
    const user = await User.verifyUser(userId);
    return { user };
  }
}

module.exports = UserService;
