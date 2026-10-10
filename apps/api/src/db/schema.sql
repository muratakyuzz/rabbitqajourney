-- Faz 1 schema (docs/PLAN.md): pg-mem, built on every boot, no migrations.
-- Ids are text because the shared seed uses readable ids (u_deniz, p_isyatirim, ph_isyatirim_01).
-- A double-braced enum name (e.g. Role) expands to the values of RoleSchema in @rabbitqa/shared (single enum source, INV-19).
-- Contacts stay in the web store, so contact ids (action owner, meeting participant) have no FK.
-- last_reason: the reason given on the latest reason-required change (audit history is Faz 2).

CREATE TABLE users (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  role text NOT NULL CHECK (role IN ({{Role}})),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE template_versions (
  version integer PRIMARY KEY,
  phases jsonb NOT NULL, -- PhaseTpl[]
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text REFERENCES users(id)
);

CREATE TABLE projects (
  id text PRIMARY KEY,
  customer_name text NOT NULL,
  name text NOT NULL,
  csm_id text REFERENCES users(id),
  start_date date NOT NULL,
  go_live_date date,
  install_type text CHECK (install_type IS NULL OR install_type IN ({{InstallType}})),
  llm_choice text CHECK (llm_choice IS NULL OR llm_choice IN ({{LlmChoice}})),
  teams jsonb NOT NULL DEFAULT '[]',
  template_version integer REFERENCES template_versions(version),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text REFERENCES users(id)
);

CREATE TABLE phases (
  id text PRIMARY KEY,
  project_id text NOT NULL REFERENCES projects(id),
  code text NOT NULL,
  name text NOT NULL,
  sort_order integer NOT NULL,
  status text NOT NULL CHECK (status IN ({{PhaseStatus}})),
  dependency text NOT NULL CHECK (dependency IN ({{Dependency}})),
  plan_start date,
  plan_end date,
  baseline_end date,
  actual_start date,
  actual_end date,
  approved_by text REFERENCES users(id),
  approved_at timestamptz,
  activated_at timestamptz,
  last_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, code)
);

CREATE TABLE steps (
  id text PRIMARY KEY,
  project_id text NOT NULL REFERENCES projects(id),
  phase_id text NOT NULL REFERENCES phases(id),
  title text NOT NULL,
  required boolean NOT NULL,
  owner_id text REFERENCES users(id),
  ball text NOT NULL CHECK (ball IN ({{Ball}})),
  ball_since timestamptz NOT NULL,
  due date,
  status text NOT NULL CHECK (status IN ({{StepStatus}})),
  sort_order integer NOT NULL,
  key text,
  dependency text NOT NULL CHECK (dependency IN ({{Dependency}})),
  duration_days integer NOT NULL,
  activated_at timestamptz,
  completion text NOT NULL CHECK (completion IN ({{StepCompletion}})),
  meeting_type text CHECK (meeting_type IS NULL OR meeting_type IN ({{MeetingType}})),
  last_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE meetings (
  id text PRIMARY KEY,
  project_id text NOT NULL REFERENCES projects(id),
  type text NOT NULL CHECK (type IN ({{MeetingType}})),
  date date NOT NULL,
  notes text NOT NULL DEFAULT '',
  decisions text NOT NULL DEFAULT '',
  is_customer_visible boolean NOT NULL DEFAULT false,
  status text NOT NULL CHECK (status IN ({{MeetingStatus}})),
  team_id text,
  training jsonb, -- MeetingTraining
  last_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE meeting_participants (
  meeting_id text NOT NULL REFERENCES meetings(id),
  kind text NOT NULL CHECK (kind IN ('user', 'contact')),
  participant_id text NOT NULL,
  PRIMARY KEY (meeting_id, kind, participant_id)
);

CREATE TABLE actions (
  id text PRIMARY KEY,
  project_id text NOT NULL REFERENCES projects(id),
  title text NOT NULL,
  owner_id text, -- user or contact id
  ball text NOT NULL CHECK (ball IN ({{Ball}})),
  due date,
  priority text NOT NULL CHECK (priority IN ({{Priority}})),
  status text NOT NULL CHECK (status IN ({{ActionStatus}})),
  source text NOT NULL CHECK (source IN ({{ActionSource}})),
  meeting_id text REFERENCES meetings(id),
  rule_key text,
  insight_id text,
  is_customer_visible boolean NOT NULL DEFAULT false,
  last_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_phases_project_id ON phases (project_id);
CREATE INDEX idx_steps_project_id ON steps (project_id);
CREATE INDEX idx_steps_phase_id ON steps (phase_id);
CREATE INDEX idx_actions_project_id ON actions (project_id);
CREATE INDEX idx_meetings_project_id ON meetings (project_id);
