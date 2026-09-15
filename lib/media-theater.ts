import { notion } from "@/lib/os-data/modes";
import type { ActionId } from "@/lib/actions/registry";

export const MEDIA_THEATER_MODES=["focus","spiritual","growth","brand","product-demo","client-training","walkthrough","loom"] as const;
export type MediaTheaterMode=typeof MEDIA_THEATER_MODES[number];

export type TheaterCapture={label:string;href:string;actionId?:ActionId};
export type TheaterDefinition={
  mode:MediaTheaterMode;
  label:string;
  eyebrow:string;
  heading:string;
  description:string;
  apiMode:string;
  emptyState:string;
  captures:TheaterCapture[];
};

const knowledgeCapture=(label:string):TheaterCapture=>({label,href:notion.knowledge});

export const mediaTheaterRegistry:Record<MediaTheaterMode,TheaterDefinition>={
  focus:{mode:"focus",label:"FOCUS",eyebrow:"SUPPORTING MEDIA",heading:"Focus Theater",description:"One objective remains primary. Media supports the work without taking over the room.",apiMode:"focus",emptyState:"No focus media is configured yet.",captures:[knowledgeCapture("+ Note"),{...knowledgeCapture("+ Insight"),actionId:"A-P04"}]},
  spiritual:{mode:"spiritual",label:"SPIRITUAL",eyebrow:"WORSHIP / TEACHING",heading:"Spiritual Theater",description:"A calm place for worship, teaching, reflection, and prayer.",apiMode:"spiritual",emptyState:"No worship or teaching media is configured yet.",captures:[{label:"+ Reflection",href:notion.journal},{label:"+ Scripture Note",href:notion.spiritual},{label:"+ Prayer",href:notion.prayer}]},
  growth:{mode:"growth",label:"GROWTH",eyebrow:"CURRENT STUDY",heading:"Learning Theater",description:"Watch, listen, question, and turn the lesson into practice.",apiMode:"learning",emptyState:"No learning media is configured yet.",captures:[{...knowledgeCapture("+ Insight"),actionId:"A-P04"},knowledgeCapture("+ Question"),knowledgeCapture("+ Framework"),knowledgeCapture("+ Apply")]},
  brand:{mode:"brand",label:"BRAND",eyebrow:"REFERENCE MEDIA",heading:"Creative Theater",description:"Study the reference, keep the creative context, and capture what is worth using.",apiMode:"writing",emptyState:"No brand reference media is configured yet.",captures:[{label:"+ Hook",href:notion.brandIdea},{label:"+ Idea",href:notion.brandIdea,actionId:"A-P05"},{...knowledgeCapture("+ Insight"),actionId:"A-P04"},{label:"+ Reference",href:notion.brand}]},
  "product-demo":{mode:"product-demo",label:"PRODUCT DEMO",eyebrow:"PRODUCT CONTEXT",heading:"Product Demo Theater",description:"Review an approved product demonstration inside a governed operating context.",apiMode:"general",emptyState:"No product demo is configured yet.",captures:[{label:"+ Signal",href:notion.businessSignal},{label:"+ Decision",href:notion.businessDecision}]},
  "client-training":{mode:"client-training",label:"CLIENT TRAINING",eyebrow:"TRAINING CONTEXT",heading:"Client Training Theater",description:"Use approved training media without creating a second business media library.",apiMode:"general",emptyState:"No client training media is configured yet.",captures:[{label:"+ Signal",href:notion.businessSignal},{label:"+ Exception",href:notion.exception}]},
  walkthrough:{mode:"walkthrough",label:"WALKTHROUGH",eyebrow:"OPERATING WALKTHROUGH",heading:"Walkthrough Theater",description:"Review an approved walkthrough and keep the next action connected.",apiMode:"general",emptyState:"No walkthrough is configured yet.",captures:[{label:"+ Decision",href:notion.businessDecision},{label:"+ Signal",href:notion.businessSignal}]},
  loom:{mode:"loom",label:"LOOM",eyebrow:"SHARED WALKTHROUGH",heading:"Loom Theater",description:"Play an approved public Loom recording when the provider permits.",apiMode:"general",emptyState:"No Loom recording is configured yet.",captures:[{label:"+ Signal",href:notion.businessSignal}]},
};

export function parseMediaTheaterMode(value:string|null):MediaTheaterMode{
  return value&&value in mediaTheaterRegistry?value as MediaTheaterMode:"focus";
}
