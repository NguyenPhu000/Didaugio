class ServiceError extends Error {
  constructor(arg1, arg2, arg3) {
    let message = "Loi he thong";
    let statusCode = 500;
    let errorCode = "INTERNAL_ERROR";

    // Support both signatures for backward compatibility:
    // 1) (message, statusCode, errorCode)
    // 2) (errorCode, message, statusCode)
    if (typeof arg1 === "string" && typeof arg2 === "number") {
      message = arg1;
      statusCode = arg2;
      if (typeof arg3 === "string") {
        errorCode = arg3;
      }
    } else {
      if (typeof arg1 === "string") {
        errorCode = arg1;
      }
      if (typeof arg2 === "string") {
        message = arg2;
      }
      if (typeof arg3 === "number") {
        statusCode = arg3;
      }
    }

    super(message);
    this.name = "ServiceError";
    this.errorCode = errorCode;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ServiceError;
