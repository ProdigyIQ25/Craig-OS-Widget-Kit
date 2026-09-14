import type { NotionRow } from "@/lib/notion-values";
import { textValue, value } from "@/lib/notion-values";

export type PulseIndicator = { label: string; value: string; tone: "healthy"|"attention"|"critical"|"neutral" };

export function derivePulse(rows: Record<"B03"|"B05"|"B07"|"B08"|"B09"|"B10", NotionRow[]>): PulseIndicator[] {
  const unresolved = rows.B07.filter(row => !["RESOLVED","CLOSED"].includes(textValue(row,"Status","").toUpperCase()));
  const critical = unresolved.filter(row => ["HIGH","CRITICAL"].includes(textValue(row,"Severity","").toUpperCase())).length;
  const opportunities = rows.B03.filter(row => !["LOST","HOLD"].includes(textValue(row,"Stage","").toUpperCase())).length;
  const decisions = rows.B05.filter(row => !["DECIDED","CLOSED","COMPLETE"].includes(textValue(row,"Status","").toUpperCase())).length;
  const workers = rows.B08.filter(row => textValue(row,"Status","").toUpperCase() !== "INACTIVE").length;
  const metricsAtRisk = rows.B09.filter(row => ["AT RISK","CRITICAL","BELOW TARGET"].includes(textValue(row,"Status","").toUpperCase())).length;
  const production = rows.B10.filter(row => textValue(row,"Maturity","").toUpperCase() === "PRODUCTION").length;
  return [
    { label:"Active opportunities", value:String(opportunities), tone:"healthy" },
    { label:"Open decisions", value:String(decisions), tone:decisions?"attention":"neutral" },
    { label:"High / critical exceptions", value:String(critical), tone:critical?"critical":"healthy" },
    { label:"Active digital workers", value:String(workers), tone:"neutral" },
    { label:"Metrics at risk", value:String(metricsAtRisk), tone:metricsAtRisk?"attention":"healthy" },
    { label:"Production capabilities", value:String(production), tone:"healthy" },
  ];
}

export function deriveWorktelli(rows: { B10: NotionRow[]; B11: NotionRow[]; B07: NotionRow[]; B05: NotionRow[]; B09: NotionRow[] }) {
  const capability = [...rows.B10].sort((a,b)=>(b.last_edited_time??"").localeCompare(a.last_edited_time??""))[0];
  const packets = [...rows.B11].sort((a,b)=>(b.last_edited_time??"").localeCompare(a.last_edited_time??""));
  const qualification = packets.find(row => textValue(row,"Packet Type","") === "QUALIFICATION");
  const constraint = rows.B07.find(row => !["RESOLVED","CLOSED"].includes(textValue(row,"Status","").toUpperCase()));
  return {
    generation: capability ? textValue(capability,"Generation") : "NOT YET POPULATED",
    certification: capability ? textValue(capability,"Certification State") : "NOT YET POPULATED",
    productState: capability ? textValue(capability,"Maturity") : "NOT YET POPULATED",
    primaryConstraint: constraint ? textValue(constraint,"Exception") : "NOT YET POPULATED",
    currentPacket: packets[0] ? textValue(packets[0],"Packet") : "NOT YET POPULATED",
    latestQualification: qualification ? `${textValue(qualification,"Packet")} · ${textValue(qualification,"Result")}` : "NOT YET POPULATED",
    supportingCounts: { decisions: rows.B05.length, metrics: rows.B09.length },
  };
}

export function deriveExceptions(rows: NotionRow[]) {
  return rows.filter(row => {
    const severity = textValue(row,"Severity","").toUpperCase();
    const status = textValue(row,"Status","").toUpperCase();
    return ["HIGH","CRITICAL"].includes(severity) && !["RESOLVED","CLOSED"].includes(status);
  }).map(row => ({
    exception: textValue(row,"Exception"), severity: textValue(row,"Severity"), impact: textValue(row,"Impact"),
    owner: value(row,"Owner") ? String(value(row,"Owner")) : "NOT YET POPULATED", immediateAction: textValue(row,"Immediate Action"),
  }));
}
