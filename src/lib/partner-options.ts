import {
  DEFAULT_PARTNER_TIERS,
  DEFAULT_PARTNER_TYPES,
  getAllPartnerTypeOptions as getAllPartnerTypeOptionsFromStore,
  getAllowedPartnerTierOptions as getAllowedPartnerTierOptionsFromStore,
  getPartnerTypeOptions as getPartnerTypeOptionsFromStore,
  isPartnerTierConfigurationEnabled as isPartnerTierConfigurationEnabledFromStore,
  isPartnerTypeConfigurationEnabled as isPartnerTypeConfigurationEnabledFromStore,
  isPartnerTierAllowedForType as isPartnerTierAllowedForTypeFromStore,
  isPartnerTierEnabledType as isPartnerTierEnabledTypeFromStore,
} from "@/lib/partner-config-store";

export const PARTNER_TYPE_OPTIONS = DEFAULT_PARTNER_TYPES.map((type) => type.name) as string[];
export const PARTNER_TIER_OPTIONS = DEFAULT_PARTNER_TIERS.map((tier) => tier.name) as string[];

export function getPartnerTypeOptions() {
  return getPartnerTypeOptionsFromStore();
}

export function getAllPartnerTypeOptions() {
  return getAllPartnerTypeOptionsFromStore();
}

export function isPartnerTypeConfigurationEnabled() {
  return isPartnerTypeConfigurationEnabledFromStore();
}

export function isPartnerTierConfigurationEnabled() {
  return isPartnerTierConfigurationEnabledFromStore();
}

export function isPartnerTierEnabledType(partnerType: string | null | undefined) {
  return isPartnerTierEnabledTypeFromStore(partnerType);
}

export function getAllowedPartnerTierOptions(partnerType: string | null | undefined) {
  return getAllowedPartnerTierOptionsFromStore(partnerType);
}

export function isPartnerTierAllowedForType(
  partnerType: string | null | undefined,
  partnerTier: string | null | undefined,
) {
  return isPartnerTierAllowedForTypeFromStore(partnerType, partnerTier);
}

// Backward-compatible export used by existing screens.
export function isResellerType(partnerType: string | null | undefined) {
  return isPartnerTierEnabledType(partnerType);
}
