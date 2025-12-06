import { HttpException } from "./HttpException";

export class BadRequestException extends HttpException {
  constructor(message = "Bad request", errors:any = null) {
    super(400, message, errors);
  }
}
