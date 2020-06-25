const request = require('supertest');
const app = require('../app');

const EmailService = require('../services/email.service');
jest.mock('../db');
jest.mock('../services/email.service');

const userInfo = {
  email: 'bar@bar.com',
  password: 'foobar',
};

describe('Auth endpoints', () => {
  it('signup should be successful', async (done) => {
    const res = await request(app)
      .post('/signup')
      .send(userInfo);

    expect(res.statusCode).toEqual(201);
    setTimeout(() => {
      // expect(EmailService.mock.instances.length).toEqual(1);
      // console.log(EmailService.mock.instances[1].sendEmail.mock.calls.length)
      const firstInstance = EmailService.mock.instances[0];
      expect(firstInstance.sendEmail.mock.calls[0][0]).toBe(userInfo.email);
      done();
    }, 100);
  });
});
