class ServiceError extends Error {
  /**
   * @param {string} message - User-facing error message
   * @param {number} statusCode - HTTP status code (default: 500)
   * @param {string} errorCode - Machine-readable error code (default: "INTERNAL_ERROR")
   */
  constructor(message = "Loi he thong", statusCode = 500, errorCode = "INTERNAL_ERROR") {
    super(message);
    this.name = "ServiceError";
    this.errorCode = errorCode;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ServiceError;
