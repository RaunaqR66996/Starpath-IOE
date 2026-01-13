export type FeatureFlags = {
  phase3AdvancedWorkflows: boolean
  phase4MultiTenancyBilling: boolean
  phase5AutomationCompliance: boolean
}

function toBool(value: string | undefined, fallback: boolean = false): boolean {
  if (value === undefined) return fallback
  return ['1', 'true', 'on', 'yes'].includes(value.toLowerCase())
}

export const featureFlags: FeatureFlags = {
  phase3AdvancedWorkflows: toBool(process.env.NEXT_PUBLIC_PHASE3, true),
  phase4MultiTenancyBilling: toBool(process.env.NEXT_PUBLIC_PHASE4, false),
  phase5AutomationCompliance: toBool(process.env.NEXT_PUBLIC_PHASE5, false),
}


