interface SuccessResponse<T> {
  status: "success";
  message: string;
  additional?: { string: any };
  data: T;
}

interface ErrorResponse {
  status: "error";
  message: string;
  error: {
    code: string;
    type: string;
    details: string;
  };
}

function createSuccessResponse<T>(
  message: string,
  data: T,
  additional?: { string: any }
): SuccessResponse<T> {
  return {
    status: "success",
    message,
    additional: additional ? { ...additional } : undefined,
    data,
  };
}

function createErrorResponse(
  message: string,
  code: string,
  type: string,
  details: string
): ErrorResponse {
  return {
    status: "error",
    message,
    error: {
      code,
      type,
      details: details || message,
    },
  };
}

export { createSuccessResponse, createErrorResponse };
