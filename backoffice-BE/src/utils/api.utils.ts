/**
 * Represents a successful API response payload.
 */
interface SuccessResponse<T> {
  data: T;
  message?: string | null;
}

/**
 * Formats a successful API response.
 * In a RESTful pattern, the HTTP status code (e.g., 200, 201) indicates success,
 * so a `success: true` field in the body is redundant.
 *
 * @param data The main data payload of the response.
 * @param message An optional descriptive message.
 * @returns A structured success response object.
 */
export function formatApiResponse<T>({
  data,
  message = null,
}: SuccessResponse<T>): SuccessResponse<T> {
  const response: SuccessResponse<T> = { data };
  if (message) {
    response.message = message;
  }
  return response;
}
