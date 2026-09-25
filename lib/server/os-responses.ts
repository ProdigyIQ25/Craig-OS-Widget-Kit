import "server-only";
import { failure, success } from "@/lib/api-contract";
import { deriveBusinessCommand, derivePersonalCommand } from "@/lib/widget-data/os-shell";
import { NotionConfigurationError, queryActive } from "@/lib/server/notion-read";

function safeFailure(error:unknown,scope:string){return error instanceof NotionConfigurationError?failure("NOT_CONFIGURED",error.message,"notion"):failure("UPSTREAM_UNAVAILABLE",`Canonical ${scope} data is temporarily unavailable.`,"notion")}
export async function personalCommandResponse(){try{const [P02,P03,P04,P09,P10,P11]=await Promise.all([queryActive("P02"),queryActive("P03"),queryActive("P04"),queryActive("P09"),queryActive("P10"),queryActive("P11")]);return success(derivePersonalCommand({P02,P03,P04,P09,P10,P11}),"notion")}catch(error){return safeFailure(error,"Personal")}}
export async function businessCommandResponse(){try{const [B03,B05,B06,B07,B08,B09,B10,B11]=await Promise.all([queryActive("B03"),queryActive("B05"),queryActive("B06"),queryActive("B07"),queryActive("B08"),queryActive("B09"),queryActive("B10"),queryActive("B11")]);return success(deriveBusinessCommand({B03,B05,B06,B07,B08,B09,B10,B11}),"notion")}catch(error){return safeFailure(error,"Business")}}
