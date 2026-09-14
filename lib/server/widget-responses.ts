import "server-only";
import { failure, success } from "@/lib/api-contract";
import { NotionConfigurationError, queryActive } from "@/lib/server/notion-read";
import { deriveExceptions, derivePulse, deriveWorktelli } from "@/lib/widget-data/derive";

export async function executivePulseResponse() {
  try { const [B03,B05,B07,B08,B09,B10]=await Promise.all([queryActive("B03"),queryActive("B05"),queryActive("B07"),queryActive("B08"),queryActive("B09"),queryActive("B10")]); return success({ indicators: derivePulse({B03,B05,B07,B08,B09,B10}) },"notion"); }
  catch(error){return safeFailure(error)}
}
export async function worktelliStateResponse() {
  try { const [B10,B11,B07,B05,B09]=await Promise.all([queryActive("B10"),queryActive("B11"),queryActive("B07"),queryActive("B05"),queryActive("B09")]); return success(deriveWorktelli({B10,B11,B07,B05,B09}),"notion"); }
  catch(error){return safeFailure(error)}
}
export async function exceptionsResponse() {
  try { return success({ exceptions: deriveExceptions(await queryActive("B07")) },"notion"); }
  catch(error){return safeFailure(error)}
}
function safeFailure(error: unknown){return error instanceof NotionConfigurationError ? failure("NOT_CONFIGURED",error.message,"notion") : failure("UPSTREAM_UNAVAILABLE","Canonical Business data is temporarily unavailable.","notion")}
