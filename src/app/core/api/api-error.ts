import { HttpErrorResponse } from '@angular/common/http';
import { catchError, type OperatorFunction, throwError } from 'rxjs';

/** HTTP failure the store can read. The services rethrow this; they do not handle it. */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof HttpErrorResponse) {
    const body: unknown = error.error;
    const serverMessage =
      typeof body === 'object' && body !== null && 'message' in body && typeof body.message === 'string'
        ? body.message
        : '';
    return new ApiError(error.status, serverMessage || error.statusText || 'Request failed');
  }

  if (error instanceof Error) {
    return new ApiError(0, error.message);
  }

  return new ApiError(0, 'Unexpected error');
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Request failed';
}

/** Maps a failed HTTP call to `ApiError` and lets it continue to the subscriber. */
export function rethrowAsApiError<T>(): OperatorFunction<T, T> {
  return catchError((error: unknown) => throwError(() => toApiError(error)));
}
