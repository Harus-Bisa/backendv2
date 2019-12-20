const app = require('./app');
const config = require('./config');

const port = config.port;
const server = app.listen(port, function() {
  console.log('Express server listening on port ' + port);
});

module.exports = server;