// Enums come from @rabbitqa/shared (F0-04a, INV-19); entities move there in F0-04b.
export type {
  Role,
  Ball,
  StepStatus,
  Dependency,
  PhaseStatus,
  Health,
  ActionStatus,
  Priority,
  ActionSource,
  ContactRole,
  CommitmentStatus,
  MeetingType,
  InstallType,
  LlmChoice,
  DocType,
  StepCompletion,
  MeetingStatus,
  AdaptationItem,
  AlertSeverity,
  AlertStatus,
  TicketStatus,
  TicketType,
  BoardDecision,
  RiskKind,
  RiskStatus,
  AlertType,
  AlertLevel,
  AlertStateStatus,
  ChatProvider,
  ConnStatus,
  InsightKind,
  InsightStatus,
  InsightSource,
  InsightProposedAny,
} from "../index";
import type {
  Role,
  Ball,
  StepStatus,
  Dependency,
  PhaseStatus,
  Health,
  ActionStatus,
  Priority,
  ActionSource,
  ContactRole,
  CommitmentStatus,
  MeetingType,
  InstallType,
  LlmChoice,
  DocType,
  StepCompletion,
  MeetingStatus,
  AdaptationItem,
  AlertSeverity,
  AlertStatus,
  TicketStatus,
  TicketType,
  BoardDecision,
  RiskKind,
  RiskStatus,
  AlertType,
  AlertLevel,
  AlertStateStatus,
  ChatProvider,
  ConnStatus,
  InsightKind,
  InsightStatus,
  InsightSource,
} from "../index";

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
  createdAt: string;
  integrations: ProjectIntegrations;
  goLiveApproval?: GoLiveApproval | null;
  noCommitments: boolean;
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

export interface Adaptation {
  id: string;
  projectId: string;
  teamId: string | null;
  checklist: Record<AdaptationItem, boolean>;
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

import type { PhaseTpl } from "../schemas/template";
export type { PhaseTpl, StepTpl } from "../schemas/template";
import type { Action, Phase, Step } from "../schemas/project";
export type { Action, Phase, Step } from "../schemas/project";
import type { Meeting } from "../schemas/meeting";
export type { Meeting, MeetingTraining } from "../schemas/meeting";

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
  adaptations: Adaptation[];
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
export interface AlertState { key: string; status: AlertStateStatus; snoozedUntil: string | null; reason: string; by: string; at: string }
export interface ComputedAlert {
  key: string; type: AlertType; level: AlertLevel; projectId: string;
  entity: "phase" | "step" | "action" | "project" | "commitment" | "kpi" | "credential";
  entityId: string; ownerId: string | null; title: string; detail: string;
}

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
