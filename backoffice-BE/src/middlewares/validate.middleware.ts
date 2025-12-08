import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";
import { BadRequestException } from "../core/errors/BadRequestException";

/**
 * Creates a middleware function that validates the request body against a Zod schema.
 * If validation fails, it sends a 400 response with the validation errors.
 * If validation succeeds, it calls the next middleware.
 *
 * @param schema The Zod schema to validate against.
 * @returns An Express middleware function.
 */
export const validateReqBody =
  (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // The `parse` method will throw an error if validation fails.
      // The `parseAsync` method is used to handle schemas with async refinements.
      const parsedBody = await schema.parseAsync(req.body);

      // Replace the original body with the parsed and validated one.
      // This is important for two reasons:
      // 1. Zod can apply transformations (e.g., `z.string().trim()`).
      // 2. It ensures that your route handler receives the correctly typed data.
      req.body = parsedBody;

      return next();
    } catch (error) {
      // Check if the error is a Zod validation error
      if (error instanceof ZodError) {
        // Respond with a 400 Bad Request status and a structured error message.
        // The `flatten()` method provides a simple, readable error structure.

        console.log(error);
        throw new BadRequestException(
          "Validation failed",
          error.flatten().fieldErrors
        );
      }

      // For any other unexpected errors, pass them to the global error handler.
      next(error);
    }
  };
