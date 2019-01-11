const errors = require('../../../lib/errors');

const production = process.env.NODE_ENV === 'production';

// todo add logging (elastic, kibana)
// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  let tmpError = err;

  if (!(err instanceof errors.BaseError)) {
    tmpError = new errors.BaseError({ message: err.message });
    tmpError.stack = err.stack;
  }

  const result = {
    status: 'error',
    message: (production && 'Some failure happened on the server. Please try again later.') || tmpError.message,
    data: (production && tmpError.name) || tmpError.data,
  };

  switch (tmpError.name) {
    case 'NotFoundError':
      result.code = 404;
      break;
    case 'UnauthorizedError':
      result.code = 401;
      break;
    case 'ForbiddenError':
      result.code = 403;
      break;
    case 'WrongParametersError':
    case 'ServiceError':
      result.code = 400;
      break;
    default:
      result.code = 500;
  }

  res.status(result.code).json(result);
};
