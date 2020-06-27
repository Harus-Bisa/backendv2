const jwt = require('jsonwebtoken');
const authentication = require('../../middlewares/auth.middleware');
const config = require('../../config');

test('not providing authorization token should fail', async () => {
  const req = {
    headers: {
      authorization: '',
    },
  };
  const res = {};

  const result = await new Promise((resolve) => {
    authentication(req, res, (next) => {
      if (!next) {
        resolve(req);
      }
    });
  });

  expect(result.authenticated).not.toBeDefined();
});

test('Providing invalid authorization token should fail', async () => {
  const tokenPayload = { userId: 'foo' };
  const wrongSecret = 'foobar';
  const invalidToken = jwt.sign(tokenPayload, wrongSecret, {
    expiresIn: 86400,
  });

  const req = {
    headers: {
      authorization: 'Bearer ' + invalidToken,
    },
  };
  const res = {};

  const result = await new Promise((resolve) => {
    authentication(req, res, (next) => {
      if (!next) {
        resolve(req);
      }
    });
  });

  expect(result.authenticated).toBe(false);
  expect(result.userId).not.toBeDefined();
});

test('Providing valid authorization token should be successful', async () => {
  const userId = 'randomId';
  const token = jwt.sign({ userId }, config.jwtSecret, {
    expiresIn: 86400,
  });

  const req = {
    headers: {
      authorization: 'Bearer ' + token,
    },
  };
  const res = {};

  const result = await new Promise((resolve) => {
    authentication(req, res, (next) => {
      if (!next) {
        resolve(req);
      }
    });
  });

  expect(result.authenticated).toBe(true);
  expect(result.userId).toBe(userId);
});
