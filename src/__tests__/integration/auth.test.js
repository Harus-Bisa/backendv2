const request = require('supertest');
const app = require('../../app');
const sgMail = require('@sendgrid/mail');
const mongoose = require('mongoose');

// jest.mock('../../db');
jest.mock('@sendgrid/mail');

const userEmail = mongoose.Types.ObjectId() + '@gmail.com';
const userPassword = mongoose.Types.ObjectId();
var userVerificationToken;

const userInfo = {
  email: userEmail,
  password: userPassword,
};

var mailApiCalled = 0;

describe('Auth endpoints', () => {
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
    }, 300);
  });

  it('signup with duplicate email should fail', async (done) => {
    const res = await request(app)
      .post('/signup')
      .send(userInfo);

    expect(res.statusCode).toEqual(409);
    done();
  });

  it('login with wrong email should fail', async (done) => {
    const wrongUserCredential = {
      email: 'wrong',
      password: 'wrong',
    };
    const res = await request(app)
      .post('/login')
      .send(wrongUserCredential);

    expect(res.statusCode).toEqual(401);
    done();
  });

  it('login with wrong password should fail', async (done) => {
    const wrongUserCredential = {
      email: userEmail,
      password: 'wrong',
    };
    const res = await request(app)
      .post('/login')
      .send(wrongUserCredential);

    expect(res.statusCode).toEqual(401);
    done();
  });

  it('login before verified should fail', async (done) => {
    const res = await request(app)
      .post('/login')
      .send(userInfo);

    expect(res.statusCode).toEqual(401);
    done();
  });

  it('verify non-existent user should fail', async (done) => {
    const randomVerificationToken = mongoose.Types.ObjectId();
    const res = await request(app).get(
      '/verification/' + randomVerificationToken
    );

    expect(res.statusCode).toEqual(404);
    done();
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
    done();
  });

  it('resend verification token for non-existent user should fail', async (done) => {
    const randomEmail = 'random@bar.com';
    const res = await request(app)
      .post('/resend')
      .send(randomEmail);
    expect(res.statusCode).toEqual(404);
    done();
  });

  it('resend verification token for should be successful', async (done) => {
    const res = await request(app)
      .post('/resend')
      .send(userInfo);
    setTimeout(() => {
      mailApiCalled += 1;
      expect(sgMail.send).toHaveBeenCalledTimes(mailApiCalled);
      expect(sgMail.send.mock.calls[mailApiCalled - 1][0].to).toBe(userEmail);
      done();
    }, 100);

    expect(res.statusCode).toEqual(200);
    
  });
});
