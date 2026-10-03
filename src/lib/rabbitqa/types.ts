export type Role = "csm" | "devops" | "care" | "manager" | "admin";
export type Ball = "customer" | "csm" | "devops" | "care";
export type StepStatus = "pending" | "in_progress" | "done" | "out_of_scope";
export type PhaseStatus = "not_started" | "in_progress" | "at_risk" | "late" | "done" | "out_of_scope";
export type Health = "green" | "yellow" | "red";
export type ActionStatus = "open" | "in_progress" | "done" | "cancelled";
export type Priority = "low" | "medium" | "high";
export type ActionSource = "meeting" | "rule" | "manual";
export type ContactRole = "sponsor" | "pm" | "tech";
export type CommitmentStatus = "open" | "met" | "unmet";
export type MeetingType =
  | "brief"
  | "kickoff"
  | "discovery"
  | "devops_handover"
  | "training"
  | "adaptation"
  | "checkin"
  | "go_no_go"
  | "other";

export type InstallType = "saas" | "onprem";
export type LlmChoice = "rabbitqa" | "own" | "gpu";
export type DocType = "offer" | "contract" | "req_doc" | "presentation" | "other";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Salesperson {
  id: string;
  name: string;
}

export interface DiscoveryQuestion {
  id: string;
  group: string;
  text: string;
  required: boolean;
}

export interface Project {
  id: string;
  customerName: string;
  name: string;
  csmId: string | null;
  salespersonId: string | null;
  licenseModel: string;
  purchasedModules: string[];
  desiredModules: string[];
  startDate: string;
  goLiveDate: string;
  health: Health;
  healthReason: string;
  teams: string[];
  discoveryAnswers: Record<string, string>;
  teamInfo: Record<string, { contact: string; users: number | null }>;
  installType: InstallType | null;
  llmChoice: LlmChoice | null;
  presentationShared: boolean;
  reqDocShared: boolean;
  reqDocSharedAt: string | null;
  createdAt: string;
}

export interface Phase {
  id: string;
  projectId: string;
  code: string;
  name: string;
  order: number;
  status: PhaseStatus;
  planStart: string | null;
  planEnd: string | null;
  baselineEnd: string | null;
  actualStart: string | null;
  actualEnd: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
}

export interface Step {
  id: string;
  projectId: string;
  phaseId: string;
  title: string;
  required: boolean;
  ownerId: string | null;
  ball: Ball;
  ballSince: string;
  due: string | null;
  status: StepStatus;
  order: number;
  key?: string;
}

export interface Action {
  id: string;
  projectId: string;
  title: string;
  ownerId: string | null; // user id or contact id
  ball: Ball;
  due: string | null;
  priority: Priority;
  status: ActionStatus;
  source: ActionSource;
  meetingId: string | null;
  createdAt: string;
  ruleKey?: string;
}

export interface Meeting {
  id: string;
  projectId: string;
  type: MeetingType;
  date: string;
  internalIds: string[];
  contactIds: string[];
  notes: string;
  decisions: string;
}

export interface Contact {
  id: string;
  projectId: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  role: ContactRole;
}

export interface Commitment {
  id: string;
  projectId: string;
  text: string;
  targetPhaseCode: string;
  status: CommitmentStatus;
  note: string;
}

export interface AuditEntry {
  id: string;
  projectId: string;
  at: string;
  userId: string;
  kind: "create" | "update" | "delete" | "view";
  entity: string;
  entityId: string;
  label: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
}

export interface Kpi {
  id: string;
  projectId: string;
  name: string;
  unit: string;
  baseline: number | null;
  target: number | null;
  targetDate: string | null;
  measurements: { date: string; value: number }[];
}

export interface TrainingSession {
  id: string;
  projectId: string;
  date: string;
  trainerId: string | null;
  attendees: string;
  modules: string[];
  recordingUrl: string;
  notes: string;
  status: "planned" | "done";
}

export interface AdaptationSession {
  id: string;
  projectId: string;
  team: string;
  date: string | null;
  participants: string;
  notes: string;
}

export interface Credential {
  id: string;
  projectId: string;
  type: string;
  provider: string;
  username: string;
  password: string;
  validUntil: string | null;
  note: string;
}

export interface DocumentRec {
  id: string;
  projectId: string;
  type: DocType;
  name: string;
  linkType: "project" | "meeting" | "step";
  linkId: string | null;
  addedAt: string;
}

export type AlertSeverity = "info" | "warning" | "critical";
export type AlertStatus = "open" | "resolved";

export interface Alert {
  id: string;
  projectId: string;
  title: string;
  detail: string;
  severity: AlertSeverity;
  status: AlertStatus;
  source: "rule" | "manual";
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
}

export type TicketStatus = "open" | "in_progress" | "waiting_customer" | "resolved" | "closed";

export interface SupportTicket {
  id: string;
  projectId: string;
  title: string;
  description: string;
  module: string;
  priority: Priority;
  status: TicketStatus;
  ownerId: string | null;
  openedAt: string;
  resolvedAt: string | null;
}

export type RiskKind = "risk" | "decision";
export type RiskStatus = "open" | "mitigated" | "accepted" | "realized";

export interface RiskDecision {
  id: string;
  projectId: string;
  kind: RiskKind;
  title: string;
  description: string;
  impact: Priority;
  status: RiskStatus;
  ownerId: string | null;
  due: string | null;
  createdAt: string;
}

export interface RqState {
  version: number;
  users: User[];
  salespeople: Salesperson[];
  modules: string[];
  questions: DiscoveryQuestion[];
  projects: Project[];
  phases: Phase[];
  steps: Step[];
  actions: Action[];
  meetings: Meeting[];
  contacts: Contact[];
  commitments: Commitment[];
  kpis: Kpi[];
  trainings: TrainingSession[];
  adaptations: AdaptationSession[];
  credentials: Credential[];
  documents: DocumentRec[];
  alerts: Alert[];
  tickets: SupportTicket[];
  risks: RiskDecision[];
  audit: AuditEntry[];
}
