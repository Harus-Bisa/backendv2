var jwt = require('jsonwebtoken');
var config = require('../config');

function verifyToken(req, res, next) {
  // check for Authorization header and token exist
  if (
    req.headers['authorization'] &&
    req.headers['authorization'].split(' ')[1]
  ) {
    // extract token
    const token = req.headers['authorization'].split(' ')[1];
    try {
      const decodedPayload = jwt.verify(token, config.jwtSecret);
      req.userId = decodedPayload.userId;
      req.authenticated = true;
    } catch {
      // pass to next handler
      // user can still do limited actions if not authenticated
      req.authenticated = false;
    }
  }

  next();
}
module.exports = verifyToken;
