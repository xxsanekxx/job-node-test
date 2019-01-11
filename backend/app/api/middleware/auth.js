const { UnauthorizedError } = require('../../../lib/errors');

module.exports = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
    return;
  }

  next(new UnauthorizedError({ message: 'You are unauthorized!' }));
};
