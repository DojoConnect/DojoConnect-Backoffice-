import { HttpException } from "./HttpException";

export class BadRequestException extends HttpException {
  constructor(message = "Bad request", errors = null) {
    super(400, message, errors);
  }
}
