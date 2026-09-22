import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const SESSION_COOKIE = "craig_os_capture_session";
const SESSION_SECONDS = 60 * 60 * 8;
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 12;
const rates = new Map<string, number[]>();

function secret() {
  const value = process.env.ACTION_SIGNING_SECRET;
  if (!value || value.length < 32) throw new Error("Capture security is not configured.");
  return value;
}

const sign = (value: string) => createHmac("sha256", secret()).update(value).digest("base64url");
const equal = (a: string, b: string) => {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
};

export function createCaptureSession() {
  const token = randomBytes(24).toString("base64url");
  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const unsigned = `${token}.${expires}`;
  return {
    token,
    expiresAt: new Date(expires * 1000).toISOString(),
    cookieName: SESSION_COOKIE,
    cookieValue: `${unsigned}.${sign(unsigned)}`,
    maxAge: SESSION_SECONDS,
  };
}

export function validateCaptureRequest(request: Request) {
  const origin = request.headers.get("origin");
  const ownOrigin = new URL(request.url).origin;
  const configured = (process.env.ACTION_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const allowed = new Set([ownOrigin, ...configured]);
  if (!origin || !allowed.has(origin)) return false;
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin") return false;
  const cookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);
  const csrf = request.headers.get("x-craig-os-csrf");
  if (!cookie || !csrf) return false;
  const [token, expires, signature] = cookie.split(".");
  if (!token || !expires || !signature || token !== csrf || Number(expires) <= Math.floor(Date.now() / 1000)) {
    return false;
  }
  return equal(signature, sign(`${token}.${expires}`));
}

export function captureRateLimit(request: Request, destinationKey: string) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const key = createHash("sha256").update(`${forwarded}:capture:${destinationKey}`).digest("hex");
  const now = Date.now();
  const recent = (rates.get(key) ?? []).filter((time) => now - time < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) return false;
  recent.push(now);
  rates.set(key, recent);
  return true;
}

export function captureCookieName() {
  return SESSION_COOKIE;
}
