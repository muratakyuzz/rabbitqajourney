export type Role = "csm" | "devops" | "care" | "manager" | "admin";
export type Ball = "customer" | "csm" | "devops" | "care";
export type StepStatus = "pending" | "in_progress" | "done" | "out_of_scope" | "locked";
export type Dependency = "previous" | "independent";
export type PhaseStatus = "not_started" | "in_progress" | "at_risk" | "late" | "done" | "out_of_scope" | "locked";
export type Health = "green" | "yellow" | "red";
export type ActionStatus = "open" | "in_progress" | "done" | "cancelled";
export type Priority = "low" | "medium" | "high";
export type ActionSource = "meeting" | "rule" | "manual" | "teams" | "email";
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
export type StepCompletion = "manual" | "data" | "meeting";
export type MeetingStatus = "planned" | "held" | "cancelled";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
}

export interface Salesperson {
  id: string;
  name: string;
  active: boolean;
}

export interface DiscoveryQuestion {
  id: string;
  group: string;
  text: string;
  required: boolean;
  type: "text" | "modules";
  order: number;
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
  integrations: ProjectIntegrations;
  goLiveApproval?: GoLiveApproval | null;
  noCommitments: boolean;
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
  dependency: Dependency;
  activatedAt: string | null;
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
  dependency: Dependency;
  durationDays: number;
  activatedAt: string | null;
  completion: StepCompletion;
  meetingType?: MeetingType;
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
  insightId?: string;
  isCustomerVisible: boolean;
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
  isCustomerVisible: boolean;
  status: MeetingStatus;
  teamId?: string | null;
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
  isCustomerVisible: boolean;
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
  type: TicketType;
  resolution: string;
  boardDecision: BoardDecision | null;
  customerNotifiedAt: string | null;
}
export type TicketType = "technical" | "usage" | "feature_request";
export type BoardDecision = "pending" | "accepted" | "rejected" | "planned";

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
  probability: Priority;
  mitigation: string;
  meetingId: string | null;
  decidedAt: string | null;
  isCustomerVisible: boolean;
}

export interface CustomerReport {
  id: string; projectId: string; weekStart: string; createdBy: string; createdAt: string;
  status: "draft" | "sent"; sentAt: string | null; sentBy: string | null;
  summary: string; nextWeek: string; snapshot: Record<string, unknown>;
}
export interface GoLiveApproval { contactId: string; approvedAt: string; recordedBy: string; recordedAt: string }

export interface StepTpl { title: string; ball: Ball; required: boolean; ownerRole?: "manager"; key?: string; dependency: Dependency; durationDays: number; completion?: StepCompletion; meetingType?: MeetingType }
export interface PhaseTpl { code: string; name: string; dependency: Dependency; steps: StepTpl[] }

export interface RqState {
  version: number;
  template: PhaseTpl[];
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
  integrations: IntegrationConfig;
  chatChannels: ChatChannel[];
  insights: AiInsight[];
  unmatchedEmails: UnmatchedEmail[];
  holidays: Holiday[];
  alertThresholds: AlertThresholds;
  alertStates: AlertState[];
  reportsSent: { projectId: string; weekStart: string }[];
  customerReports: CustomerReport[];
}

export interface Holiday { date: string; name: string; halfDay: boolean }
export interface AlertThresholds {
  phaseRiskDays: number; dueSoonDays: number; customerWaitDays: number; customerWaitRedDays: number;
  reqDocDays: number; goLiveCommitDays: number; credentialDays: number; silentDays: number;
}
export type AlertType =
  | "phase_late" | "phase_at_risk" | "item_late" | "action_due_soon" | "waiting_customer" | "reqdoc_not_shared" | "handover_missing"
  | "open_commitment" | "discovery_missing" | "kpi_unmeasurable" | "license_mismatch" | "credential_expiring" | "report_not_sent" | "silent_project"
  | "manual";
export type AlertLevel = "yellow" | "red";
export type AlertStateStatus = "open" | "snoozed" | "closed";
export interface AlertState { key: string; status: AlertStateStatus; snoozedUntil: string | null; reason: string; by: string; at: string }
export interface ComputedAlert {
  key: string; type: AlertType; level: AlertLevel; projectId: string;
  entity: "phase" | "step" | "action" | "project" | "commitment" | "kpi" | "credential";
  entityId: string; ownerId: string | null; title: string; detail: string;
}

export type ChatProvider = "teams" | "slack";
export type ConnStatus = "disconnected" | "connected" | "error";
export type InsightKind = "action_create" | "action_update" | "step_update" | "risk_create" | "decision_create" | "health_change" | "date_change";
export type InsightStatus = "pending" | "approved" | "rejected" | "expired";
export type InsightSource = "teams" | "email";

export interface ProjectIntegrations {
  chat: { provider: ChatProvider; channelId: string | null; active: boolean; since: string | null };
  email: { active: boolean; extraDomains: string[]; since: string | null };
}

export interface TeamsConfig {
  connected: boolean; tenantId: string; clientId: string; clientSecret: string; botName: string;
  pollMinutes: number; lastSyncAt: string | null; status: ConnStatus; statusMessage: string;
}
export interface EmailConfig {
  enabled: boolean; mailbox: string; provider: "m365" | "imap"; tenantId: string; clientId: string; clientSecret: string;
  imapHost: string; imapPort: number | null; username: string; password: string;
  processIncoming: boolean; processOutgoing: boolean; matchByDomain: boolean;
  ignoredAddresses: string[]; ignoredDomains: string[];
  lastSyncAt: string | null; status: ConnStatus; statusMessage: string;
}
export interface IntegrationConfig {
  chat: { teams: TeamsConfig; slack: { connected: false } };
  email: EmailConfig;
  ai: { enabledKinds: InsightKind[]; minConfidence: number; excerptMaxChars: number; autoExpireDays: number };
}

export interface ChatChannel { id: string; provider: ChatProvider; teamName: string; channelName: string; webUrl: string }

export interface AiInsight {
  id: string;
  projectId: string;
  source: InsightSource;
  kind: InsightKind;
  sourceRef: { title: string; from: string; at: string; excerpt: string; link: string; direction?: "in" | "out" };
  targetId: string | null;
  current: Record<string, unknown> | null;
  proposed: Record<string, unknown>;
  rationale: string;
  confidence: number;
  status: InsightStatus;
  createdAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNote: string;
  appliedEntityId: string | null;
}

export interface UnmatchedEmail {
  id: string; from: string; to: string[]; cc: string[]; subject: string; at: string; excerpt: string;
  direction: "in" | "out"; status: "open" | "assigned" | "ignored"; assignedProjectId: string | null;
}
