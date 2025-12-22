import { HttpException } from "./HttpException.js";

export class TooManyRequestsException extends HttpException {
  constructor(message = "Too Many Requests") {
    super(429, message);
  }
}
