export type LinkItem = { label: string; href: string };
export type AttentionItem = { kind: string; title: string; detail: string; tone: "neutral"|"attention"|"critical"; href: string };
export type DecisionSummary = { title: string; meta: string; href: string };
export type SignalSummary = { title: string; meta: string; href: string };

export type PersonalCommandData = {
  identity: { name: string; context: string };
  attention: AttentionItem[];
  focus: { title: string; detail: string; progress: number|null; href: string } | null;
  decisions: DecisionSummary[];
  signals: SignalSummary[];
  media: { title: string; detail: string; href: string } | null;
  rhythms: { active: number; attention: number; healthy: number };
  navigation: LinkItem[];
};

export type BusinessCommandData = {
  identity: { name: string; context: string };
  requiresDavid: AttentionItem[];
  pulse: Array<{label:string;value:string;tone:string}>;
  worktelli: { generation:string; certification:string; productState:string; primaryConstraint:string; currentPacket:string; latestQualification:string };
  revenue: { activeCount:number; estimatedValue:number; topOpportunity: { title:string; detail:string; href:string } | null };
  workforce: { healthy:number; attention:number; waiting:number; degraded:number; offline:number; totalActive:number };
  decisions: DecisionSummary[];
  exceptions: AttentionItem[];
  signals: SignalSummary[];
  navigation: LinkItem[];
};
