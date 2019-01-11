class BaseError extends Error {
  constructor(params) {
    super(params.message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
    this.data = params.data || {};
  }
}

class NotFoundError extends BaseError {}

class UnauthorizedError extends BaseError {}

class ForbiddenError extends BaseError {}

class WrongParametersError extends BaseError {}

class ServiceError extends BaseError {}

module.exports.BaseError = BaseError;
module.exports.NotFoundError = NotFoundError;
module.exports.UnauthorizedError = UnauthorizedError;
module.exports.ForbiddenError = ForbiddenError;
module.exports.WrongParametersError = WrongParametersError;
module.exports.ServiceError = ServiceError;
