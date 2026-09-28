export type RebatePeriod = "monthly" | "quarterly" | "yearly";

export const REBATE_PERIOD_OPTIONS: { value: RebatePeriod; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

export interface RebateConfig {
  enabled: boolean;
  period: RebatePeriod;
  percent: number;
}

export interface PartnerTypeConfig {
  id: string;
  name: string;
  description: string;
  tierEnabled: boolean;
  allowedTierIds: string[];
  rebate?: RebateConfig;
}

export interface PartnerTierConfig {
  id: string;
  name: string;
  minRevenue: string;
  benefits: string;
  rebate?: RebateConfig;
}

export interface PartnerConfigState {
  partnerTypeEnabled: boolean;
  partnerTierEnabled: boolean;
  types: PartnerTypeConfig[];
  tiers: PartnerTierConfig[];
}

const STORAGE_KEY = "partner-config-v1";
const BASELINE_STORAGE_KEY = "partner-config-default-v1";
export const PARTNER_CONFIG_UPDATED_EVENT = "partner-config:updated";

export const DEFAULT_PARTNER_TIERS: PartnerTierConfig[] = [
  { id: "tr1", name: "Silver", minRevenue: "$0", benefits: "Basic portal access, standard commission", rebate: { enabled: false, period: "monthly", percent: 0 } },
  { id: "tr2", name: "Gold", minRevenue: "$50,000", benefits: "Priority support, higher commission rates", rebate: { enabled: false, period: "monthly", percent: 0 } },
  { id: "tr3", name: "Platinum", minRevenue: "$200,000", benefits: "Dedicated manager, top-tier commission, co-marketing", rebate: { enabled: false, period: "monthly", percent: 0 } },
];

export const DEFAULT_PARTNER_TYPES: PartnerTypeConfig[] = [
  { id: "pt1", name: "Referral", description: "Refers leads and earns commission", tierEnabled: false, allowedTierIds: [], rebate: { enabled: false, period: "monthly", percent: 0 } },
  { id: "pt2", name: "Reseller", description: "Sells products directly to end customers", tierEnabled: true, allowedTierIds: ["tr1", "tr2", "tr3"], rebate: { enabled: false, period: "monthly", percent: 0 } },
  { id: "pt3", name: "Technology", description: "Integrates technology solutions", tierEnabled: true, allowedTierIds: ["tr2", "tr3"], rebate: { enabled: false, period: "monthly", percent: 0 } },
];

function cloneDefaultState(): PartnerConfigState {
  return {
    partnerTypeEnabled: true,
    partnerTierEnabled: true,
    types: DEFAULT_PARTNER_TYPES.map((type) => ({ ...type, allowedTierIds: [...type.allowedTierIds], rebate: { ...(type.rebate ?? { enabled: false, period: "monthly", percent: 0 }) } })),
    tiers: DEFAULT_PARTNER_TIERS.map((tier) => ({ ...tier, rebate: { ...(tier.rebate ?? { enabled: false, period: "monthly", percent: 0 }) } })),
  };
}

function normalizeRebate(value: unknown): RebateConfig {
  const v = (value ?? {}) as Partial<RebateConfig>;
  const period: RebatePeriod = v.period === "quarterly" || v.period === "yearly" ? v.period : "monthly";
  const percent = typeof v.percent === "number" && Number.isFinite(v.percent) ? Math.max(0, Math.min(100, v.percent)) : 0;
  return { enabled: Boolean(v.enabled), period, percent };
}

function normalizePartnerConfigState(parsed: PartnerConfigState): PartnerConfigState {
  if (!Array.isArray(parsed.types) || !Array.isArray(parsed.tiers)) {
    return cloneDefaultState();
  }

  const partnerTypeEnabled = parsed.partnerTypeEnabled !== false;
  const partnerTierEnabled = partnerTypeEnabled && parsed.partnerTierEnabled !== false;

  return {
    partnerTypeEnabled,
    partnerTierEnabled,
    types: parsed.types.map((type) => ({
      id: String(type.id),
      name: String(type.name),
      description: String(type.description ?? ""),
      tierEnabled: Boolean(type.tierEnabled),
      allowedTierIds: Array.isArray(type.allowedTierIds) ? type.allowedTierIds.map(String) : [],
      rebate: normalizeRebate((type as PartnerTypeConfig).rebate),
    })),
    tiers: parsed.tiers.map((tier) => ({
      id: String(tier.id),
      name: String(tier.name),
      minRevenue: String(tier.minRevenue ?? ""),
      benefits: String(tier.benefits ?? ""),
      rebate: normalizeRebate((tier as PartnerTierConfig).rebate),
    })),
  };
}

export function readPartnerConfigState(): PartnerConfigState {
  if (typeof window === "undefined") {
    return cloneDefaultState();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(BASELINE_STORAGE_KEY);
  if (!raw) {
    return cloneDefaultState();
  }

  try {
    const normalized = normalizePartnerConfigState(JSON.parse(raw) as PartnerConfigState);
    if (!window.localStorage.getItem(BASELINE_STORAGE_KEY)) {
      window.localStorage.setItem(BASELINE_STORAGE_KEY, JSON.stringify(normalized));
    }
    return normalized;
  } catch {
    return cloneDefaultState();
  }
}

export function writePartnerConfigState(next: PartnerConfigState) {
  if (typeof window === "undefined") {
    return;
  }

  const normalized: PartnerConfigState = {
    ...next,
    partnerTierEnabled: next.partnerTypeEnabled ? next.partnerTierEnabled : false,
  };

  const payload = JSON.stringify(normalized);
  window.localStorage.setItem(STORAGE_KEY, payload);
  window.localStorage.setItem(BASELINE_STORAGE_KEY, payload);
  window.dispatchEvent(new CustomEvent(PARTNER_CONFIG_UPDATED_EVENT));
}

export function getPartnerTypeOptions() {
  const state = readPartnerConfigState();
  if (!state.partnerTypeEnabled) {
    return [] as string[];
  }
  return state.types.map((type) => type.name);
}

export function getAllPartnerTypeOptions() {
  return readPartnerConfigState().types.map((type) => type.name);
}

export function isPartnerTypeConfigurationEnabled() {
  return readPartnerConfigState().partnerTypeEnabled;
}

export function isPartnerTierConfigurationEnabled() {
  return readPartnerConfigState().partnerTierEnabled;
}

export function isPartnerTierEnabledType(partnerType: string | null | undefined) {
  if (!partnerType) {
    return false;
  }

  const state = readPartnerConfigState();
  if (!state.partnerTypeEnabled || !state.partnerTierEnabled) {
    return false;
  }

  const type = state.types.find((item) => item.name === partnerType);
  return Boolean(type?.tierEnabled);
}

export function getAllowedPartnerTierOptions(partnerType: string | null | undefined) {
  if (!partnerType) {
    return [] as string[];
  }

  const state = readPartnerConfigState();
  if (!state.partnerTypeEnabled || !state.partnerTierEnabled) {
    return [] as string[];
  }

  const type = state.types.find((item) => item.name === partnerType);
  if (!type || !type.tierEnabled) {
    return [] as string[];
  }

  const tierNameById = new Map(state.tiers.map((tier) => [tier.id, tier.name]));
  return type.allowedTierIds.map((tierId) => tierNameById.get(tierId)).filter((name): name is string => Boolean(name));
}

export function isPartnerTierAllowedForType(
  partnerType: string | null | undefined,
  partnerTier: string | null | undefined,
) {
  if (!partnerTier) {
    return false;
  }

  return getAllowedPartnerTierOptions(partnerType).includes(partnerTier);
}

export interface EffectiveRebate extends RebateConfig {
  source: "tier" | "type" | "none";
}

export function getEffectiveRebate(
  partnerType: string | null | undefined,
  partnerTier: string | null | undefined,
): EffectiveRebate {
  const state = readPartnerConfigState();
  const type = partnerType ? state.types.find((t) => t.name === partnerType) : undefined;
  const tier = partnerTier ? state.tiers.find((t) => t.name === partnerTier) : undefined;
  const typeRebate = type?.rebate;
  const tierRebate = tier?.rebate;

  // Tier takes precedence if both enabled
  if (typeRebate?.enabled && tierRebate?.enabled) {
    return { ...tierRebate, source: "tier" };
  }
  if (tierRebate?.enabled) {
    return { ...tierRebate, source: "tier" };
  }
  if (typeRebate?.enabled) {
    return { ...typeRebate, source: "type" };
  }
  return { enabled: false, period: "monthly", percent: 0, source: "none" };
}

export function getDefaultPartnerConfigState() {
  return cloneDefaultState();
}
