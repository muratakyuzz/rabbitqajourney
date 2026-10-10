import { z } from "zod";

// API_CONTRACT §6 enums (F0-04a). Values match the mockup one to one; never rename or
// remove a value, only add (AGENTS.md demo rules, ADR-0007 K3).

export const RoleSchema = z.enum(["csm", "devops", "care", "manager", "admin"]);
export type Role = z.infer<typeof RoleSchema>;

export const BallSchema = z.enum(["customer", "csm", "devops", "care"]);
export type Ball = z.infer<typeof BallSchema>;

export const StepStatusSchema = z.enum(["pending", "in_progress", "done", "out_of_scope", "locked"]);
export type StepStatus = z.infer<typeof StepStatusSchema>;

export const DependencySchema = z.enum(["previous", "independent"]);
export type Dependency = z.infer<typeof DependencySchema>;

export const PhaseStatusSchema = z.enum(["not_started", "in_progress", "at_risk", "late", "done", "out_of_scope", "locked"]);
export type PhaseStatus = z.infer<typeof PhaseStatusSchema>;

export const HealthSchema = z.enum(["green", "yellow", "red"]);
export type Health = z.infer<typeof HealthSchema>;

export const ActionStatusSchema = z.enum(["open", "in_progress", "done", "cancelled"]);
export type ActionStatus = z.infer<typeof ActionStatusSchema>;

export const PrioritySchema = z.enum(["low", "medium", "high"]);
export type Priority = z.infer<typeof PrioritySchema>;

export const ActionSourceSchema = z.enum(["meeting", "rule", "manual", "teams", "email"]);
export type ActionSource = z.infer<typeof ActionSourceSchema>;

export const ContactRoleSchema = z.enum(["sponsor", "pm", "tech"]);
export type ContactRole = z.infer<typeof ContactRoleSchema>;

export const CommitmentStatusSchema = z.enum(["open", "met", "unmet"]);
export type CommitmentStatus = z.infer<typeof CommitmentStatusSchema>;

export const MeetingTypeSchema = z.enum([
  "brief",
  "kickoff",
  "discovery",
  "devops_handover",
  "training",
  "adaptation",
  "checkin",
  "go_no_go",
  "other",
]);
export type MeetingType = z.infer<typeof MeetingTypeSchema>;

export const InstallTypeSchema = z.enum(["saas", "onprem"]);
export type InstallType = z.infer<typeof InstallTypeSchema>;

export const LlmChoiceSchema = z.enum(["rabbitqa", "own", "gpu"]);
export type LlmChoice = z.infer<typeof LlmChoiceSchema>;

export const DocTypeSchema = z.enum(["offer", "contract", "req_doc", "presentation", "other"]);
export type DocType = z.infer<typeof DocTypeSchema>;

export const StepCompletionSchema = z.enum(["manual", "data", "meeting"]);
export type StepCompletion = z.infer<typeof StepCompletionSchema>;

export const MeetingStatusSchema = z.enum(["planned", "held", "cancelled"]);
export type MeetingStatus = z.infer<typeof MeetingStatusSchema>;

export const AdaptationItemSchema = z.enum(["projectCreated", "docsIdentified", "docsUploaded", "aiTrained", "firstSamples"]);
export type AdaptationItem = z.infer<typeof AdaptationItemSchema>;

export const AlertSeveritySchema = z.enum(["info", "warning", "critical"]);
export type AlertSeverity = z.infer<typeof AlertSeveritySchema>;

export const AlertStatusSchema = z.enum(["open", "resolved"]);
export type AlertStatus = z.infer<typeof AlertStatusSchema>;

export const TicketStatusSchema = z.enum(["open", "in_progress", "waiting_customer", "resolved", "closed"]);
export type TicketStatus = z.infer<typeof TicketStatusSchema>;

export const TicketTypeSchema = z.enum(["technical", "usage", "feature_request"]);
export type TicketType = z.infer<typeof TicketTypeSchema>;

export const BoardDecisionSchema = z.enum(["pending", "accepted", "rejected", "planned"]);
export type BoardDecision = z.infer<typeof BoardDecisionSchema>;

export const RiskKindSchema = z.enum(["risk", "decision"]);
export type RiskKind = z.infer<typeof RiskKindSchema>;

export const RiskStatusSchema = z.enum(["open", "mitigated", "accepted", "realized"]);
export type RiskStatus = z.infer<typeof RiskStatusSchema>;

export const AlertTypeSchema = z.enum([
  "phase_late",
  "phase_at_risk",
  "item_late",
  "action_due_soon",
  "waiting_customer",
  "reqdoc_not_shared",
  "handover_missing",
  "open_commitment",
  "discovery_missing",
  "kpi_unmeasurable",
  "license_mismatch",
  "credential_expiring",
  "report_not_sent",
  "silent_project",
  "manual",
]);
export type AlertType = z.infer<typeof AlertTypeSchema>;

export const AlertLevelSchema = z.enum(["yellow", "red"]);
export type AlertLevel = z.infer<typeof AlertLevelSchema>;

export const AlertStateStatusSchema = z.enum(["open", "snoozed", "closed"]);
export type AlertStateStatus = z.infer<typeof AlertStateStatusSchema>;

export const ChatProviderSchema = z.enum(["teams", "slack"]);
export type ChatProvider = z.infer<typeof ChatProviderSchema>;

export const ConnStatusSchema = z.enum(["disconnected", "connected", "error"]);
export type ConnStatus = z.infer<typeof ConnStatusSchema>;

export const InsightKindSchema = z.enum([
  "action_create",
  "action_update",
  "step_update",
  "risk_create",
  "decision_create",
  "health_change",
  "date_change",
]);
export type InsightKind = z.infer<typeof InsightKindSchema>;

export const InsightStatusSchema = z.enum(["pending", "approved", "rejected", "expired"]);
export type InsightStatus = z.infer<typeof InsightStatusSchema>;

export const InsightSourceSchema = z.enum(["teams", "email"]);
export type InsightSource = z.infer<typeof InsightSourceSchema>;
