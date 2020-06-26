const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../app');
const config = require('../../config');
const mongoose = require('mongoose');
const sgMail = require('@sendgrid/mail');
const User = require('../../models/User');

jest.mock('@sendgrid/mail');

const userEmail = mongoose.Types.ObjectId() + '@gmail.com';
const userPassword = mongoose.Types.ObjectId();
var userVerificationToken;
var userAuthenticationToken;
var userId;

var mailApiCalled = 0;

const userInfo = {
  email: userEmail,
  password: userPassword,
};

const secondUserEmail = mongoose.Types.ObjectId();
const secondUserInfo = {
  email: secondUserEmail,
  password: 'foo'
}
var secondUserAuthenticationToken;

describe('User endpoints', () => {
  it('get user without authenticated should fail', async (done) => {
    const res = await request(app).get('/users/' + userId);

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

  it('get non existent user should fail', async (done) => {
    const randomId = mongoose.Types.ObjectId();
    const res = await request(app)
      .get('/users/' + randomId)
      .set('authorization', 'Bearer ' + userAuthenticationToken);

    expect(res.statusCode).toBe(404);
    done();
  });

  it('get user should be successful', async (done) => {
    const res = await request(app)
      .get('/users/' + userId)
      .set('authorization', 'Bearer ' + userAuthenticationToken);

    expect(res.statusCode).toBe(200);
    expect(res.body.userId).toBe(userId);
    expect(res.body.password).not.toBeDefined();
    done();
  });

  it('signup second user should be successful', async (done) => {
    const res = await request(app)
      .post('/signup')
      .send(secondUserInfo);

    expect(res.statusCode).toEqual(201);

    const secondUser = await User.findByEmail(secondUserEmail);
    const tokenPayload = {
      userId: secondUser.userId,
    };
    secondUserAuthenticationToken = jwt.sign(tokenPayload, config.jwtSecret, {
      expiresIn: 86400,
    });

    done();
  });

  it('get user with wrong token should fail', async (done) => {
    const res = await request(app)
      .get('/users/' + userId)
      .set('authorization', 'Bearer ' + secondUserAuthenticationToken);

    expect(res.statusCode).toBe(401);
    done();
  });
});
