import { assertValidPolicy, type LicensePolicy } from "./activation";

const DAY = 24 * 60 * 60;

/**
 * The direct edition's license policy, "Balanced" (owner decision Q3,
 * 2026-11-04):
 * - up to 3 Macs at once, with self-service deactivation in the app;
 * - activation tokens work offline for 30 days;
 * - the app refreshes quietly about every 7 days when online;
 * - a refund or dispute revokes the license at its next refresh;
 * - all 1.x updates are included (license terms, not this protocol).
 *
 * Changing a number here changes what customers bought: owner decision only.
 */
export const BALANCED_POLICY: LicensePolicy = Object.freeze({
  maxActiveDevices: 3,
  tokenLifetimeSeconds: 30 * DAY,
  refreshAfterSeconds: 7 * DAY,
});

assertValidPolicy(BALANCED_POLICY);
