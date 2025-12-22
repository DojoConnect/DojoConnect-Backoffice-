import { HttpException } from "./HttpException.js";

export class ForbiddenException extends HttpException {
  constructor(message = "Forbidden: Access is denied.") {
    super(403, message);
  }
}
