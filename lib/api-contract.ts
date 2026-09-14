export type ApiSuccess<T> = {
  ok: true;
  data: T;
  source: "system" | "notion";
  generatedAt: string;
  error: null;
};

export type ApiFailure = {
  ok: false;
  data: null;
  source: "system" | "notion";
  generatedAt: string;
  error: {
    code: string;
    message: string;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export function success<T>(data: T, source: ApiSuccess<T>["source"] = "system"): ApiSuccess<T> {
  return { ok: true, data, source, generatedAt: new Date().toISOString(), error: null };
}

export function failure(code: string, message: string, source: ApiFailure["source"] = "system"): ApiFailure {
  return { ok: false, data: null, source, generatedAt: new Date().toISOString(), error: { code, message } };
}
