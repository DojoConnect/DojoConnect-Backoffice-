export class HttpException extends Error {
    public status: number;
    public errors: any;

  constructor(status, message, errors = null) {
    super(message);
    this.status = status;
    this.errors = errors; // optional: array of validation errors
  }
}