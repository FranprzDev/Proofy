/** HTTP status codes used by the API routes. */
export enum HttpStatus {
  Ok = 200,
  BadRequest = 400,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  Conflict = 409,
  UnprocessableEntity = 422,
  BadGateway = 502,
  ServiceUnavailable = 503,
}

export const jsonError = (error: string, status: HttpStatus, extra?: Record<string, unknown>) =>
  Response.json({ error, ...extra }, { status });
