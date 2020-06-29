const request = require('supertest');
const app = require('../../app');
const sgMail = require('@sendgrid/mail');
const mongoose = require('mongoose');
const User = require('../../models/User');

jest.mock('@sendgrid/mail');

const userEmail = mongoose.Types.ObjectId() + '@gmail.com';
const userPassword = mongoose.Types.ObjectId();
var userVerificationToken;
var userAuthenticationToken;
var userId;

var revieweeId;
var reviewId;

const userInfo = {
  email: userEmail,
  password: userPassword,
};

const reviewContent = 'random review';
const additionalMessage = 'random message';
const issueType = 'random issue type';

var mailApiCalled = 0;

describe('Review ticket endpoints', () => {
  it('submitting review ticket without authenticated should fail', async (done) => {
    const res = await request(app)
      .post('/tickets/reviews/')
      .send(userInfo);

    expect(res.statusCode).toEqual(401);
    done();
  });

  it('signup should be successful', async (done) => {
    const res = await request(app)
      .post('/signup')
      .send(userInfo);

    expect(res.statusCode).toEqual(201);
    done();
  });

  it('verification email should be sent correctly', async (done) => {
    setTimeout(() => {
      mailApiCalled += 1;
      expect(sgMail.send).toHaveBeenCalledTimes(mailApiCalled);
      expect(sgMail.send.mock.calls[mailApiCalled - 1][0].to).toBe(userEmail);

      userVerificationToken = sgMail.send.mock.calls[mailApiCalled - 1][0].text
        .split('/')
        .slice(-1)[0];
      done();
    }, 500);
  });

  it('verify user should be successful', async (done) => {
    const res = await request(app).get(
      '/verification/' + userVerificationToken
    );

    expect(res.statusCode).toEqual(302);
    done();
  });

  it('login after verified should be successful', async (done) => {
    const res = await request(app)
      .post('/login')
      .send(userInfo);

    expect(res.statusCode).toEqual(200);
    expect(res.body.userId).toBeDefined();
    expect(res.body.token).toBeDefined();

    userAuthenticationToken = res.body.token;
    userId = res.body.userId;

    done();
  });

  it('create new review for new reviewee should be successful', async (done) => {
    const revieweeData = {
      name: 'foo',
      review: reviewContent,
    };

    const res = await request(app)
      .post('/reviewees')
      .set('authorization', 'Bearer ' + userAuthenticationToken)
      .send(revieweeData);

    expect(res.statusCode).toBe(201);

    revieweeId = res.body.revieweeId;
    reviewId = res.body.reviews[0].reviewId;
    done();
  });

  it('Submitting review ticket should be successful', async (done) => {
    const ticketInfo = {
      revieweeId,
      reviewId,
      authorId: userId,
      additionalMessage,
      issueType,
    };

    const res = await request(app)
      .post('/tickets/reviews/')
      .set('authorization', 'Bearer ' + userAuthenticationToken)
      .send(ticketInfo);

    expect(res.statusCode).toBe(201);
    expect(res.body.revieweeId).toBe(revieweeId);
    expect(res.body.reviewId).toBe(reviewId);
    expect(res.body.authorId).toBe(userId);
    expect(res.body.authorEmail).toBe(userEmail);
    expect(res.body.additionalMessage).toEqual(additionalMessage);
    expect(res.body.issueType).toBe(issueType);
    expect(res.body.reviewContent).toBe(reviewContent);
    done();
  });

  it('Sending email notification should be successful', async (done) => {
    mailApiCalled += 1;
    expect(sgMail.send).toHaveBeenCalledTimes(mailApiCalled);

    const message = sgMail.send.mock.calls[mailApiCalled - 1][0].text;
    const splitted_message = message.split('\n');
    expect(splitted_message[1].split(': ')[1]).toBe(revieweeId);
    expect(splitted_message[2].split(': ')[1]).toBe(reviewId);
    expect(splitted_message[3].split(': ')[1]).toBe(userId);
    expect(splitted_message[4].split(': ')[1]).toBe(userEmail);
    expect(splitted_message[5].split(': ')[1]).toBe(issueType);
    expect(splitted_message[6].split(': ')[1]).toBe(additionalMessage);
    expect(splitted_message[7].split(': ')[1]).toBe(reviewContent);
    done();
  });

  it('User database should be updated', async (done) => {
    const user = await User.findOne({email: userEmail});
    const userReportedReviews = user.reportedReviews;
    const userLastReportedReview = userReportedReviews[userReportedReviews.length - 1];
    
    expect(userLastReportedReview.revieweeId.toString()).toEqual(revieweeId);
    expect(userLastReportedReview.reviewId.toString()).toEqual(reviewId);
    done();
  });
});
