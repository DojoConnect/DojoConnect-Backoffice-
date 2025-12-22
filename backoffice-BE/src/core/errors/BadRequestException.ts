import { HttpException } from "./HttpException.js";

export class BadRequestException extends HttpException {
  constructor(message = "Bad request", errors: any = null) {
    super(400, message, errors);
  }
}
