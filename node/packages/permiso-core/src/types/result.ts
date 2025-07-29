/**
 * Result<T,E> union type for functional error handling.
 * 
 * Instead of throwing exceptions, functions return either a Success<T> or Failure<E>.
 * This makes error handling explicit and type-safe.
 */

export type Result<T, E = Error> = Success<T> | Failure<E>;

export type Success<T> = {
  readonly success: true;
  readonly data: T;
};

export type Failure<E = Error> = {
  readonly success: false;
  readonly error: E;
};

export const success = <T>(data: T): Success<T> => ({
  success: true,
  data,
});

export const failure = <E = Error>(error: E): Failure<E> => ({
  success: false,
  error,
});

/**
 * Type guard to check if a Result is successful
 */
export function isSuccess<T, E>(result: Result<T, E>): result is Success<T> {
  return result.success === true;
}

/**
 * Type guard to check if a Result is a failure
 */
export function isFailure<T, E>(result: Result<T, E>): result is Failure<E> {
  return result.success === false;
}

/**
 * Unwrap a Result, throwing if it's a failure
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (result.success) {
    return result.data;
  }
  throw result.error;
}

/**
 * Map over the success value of a Result
 */
export function map<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> {
  if (result.success) {
    return success(fn(result.data));
  }
  return result;
}

/**
 * Map over the error value of a Result
 */
export function mapError<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F
): Result<T, F> {
  if (!result.success) {
    return failure(fn(result.error));
  }
  return result;
}

/**
 * Chain Results together (flatMap/bind)
 */
export async function chain<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Promise<Result<U, E>>
): Promise<Result<U, E>> {
  if (result.success) {
    return fn(result.data);
  }
  return result;
}