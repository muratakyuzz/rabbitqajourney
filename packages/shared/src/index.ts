// @rabbitqa/shared — one source of schemas and enums for web (mock and http adapters), API and worker (INV-19).
// No DOM or Node globals (REV-04, ADR-0007 K3); TS source is consumed through `exports`, no build step (ADR-0006 K6).
// F0-04a: enums (API_CONTRACT §6) and AI proposal schemas (ActionCreate, RiskDecisionCreate, InsightProposal, #44).
// F0-04b: entity schemas. F6-01: business-days (INV-13).
export * from "./enums";
export * from "./schemas";
