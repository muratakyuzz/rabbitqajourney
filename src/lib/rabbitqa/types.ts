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
  kind: "create" | "update" | "delete";
  entity: string;
  entityId: string;
  label: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
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
  audit: AuditEntry[];
}
