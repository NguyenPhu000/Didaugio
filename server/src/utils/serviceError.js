class ServiceError extends Error {
  constructor(errorCode, message, statusCode = 500) {
    super(message);
    this.name = "ServiceError";
    this.errorCode = errorCode;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ServiceError;
