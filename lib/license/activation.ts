/**
 * Pure activation decisions. The numbers come from the owner-approved license
 * policy (docs/license-api-v1.md, "Pending owner decisions"); nothing here
 * chooses them.
 */

export type LicensePolicy = {
  /** Macs that may hold an active activation of one license at once. */
  maxActiveDevices: number;
  /** How long a signed activation token works offline. */
  tokenLifetimeSeconds: number;
  /**
   * When the app should refresh quietly while online (`refresh_after`).
   * Optional and shorter than the token lifetime.
   */
  refreshAfterSeconds?: number;
};

export type LicenseState = { status: "active" | "revoked" };
export type ActiveActivation = { id: string; deviceHash: string };

export type ActivationDecision =
  /** This Mac already holds an activation: reissue its token, use no new seat. */
  | { kind: "reuse"; activationId: string }
  | { kind: "create" }
  | { kind: "refused"; code: "license_revoked" | "device_limit_reached" };

export function decideActivation(input: {
  license: LicenseState;
  /** Activations of this license that are not deactivated. */
  active: readonly ActiveActivation[];
  deviceHash: string;
  policy: LicensePolicy;
}): ActivationDecision {
  if (input.license.status !== "active") return { kind: "refused", code: "license_revoked" };
  const existing = input.active.find((activation) => activation.deviceHash === input.deviceHash);
  if (existing) return { kind: "reuse", activationId: existing.id };
  if (input.active.length >= input.policy.maxActiveDevices) return { kind: "refused", code: "device_limit_reached" };
  return { kind: "create" };
}

export function assertValidPolicy(policy: LicensePolicy) {
  if (!Number.isSafeInteger(policy.maxActiveDevices) || policy.maxActiveDevices < 1) {
    throw new Error("maxActiveDevices must be a positive integer");
  }
  if (!Number.isSafeInteger(policy.tokenLifetimeSeconds) || policy.tokenLifetimeSeconds < 60) {
    throw new Error("tokenLifetimeSeconds must be an integer of at least 60");
  }
  const refresh = policy.refreshAfterSeconds;
  if (refresh !== undefined && (!Number.isSafeInteger(refresh) || refresh < 60 || refresh >= policy.tokenLifetimeSeconds)) {
    throw new Error("refreshAfterSeconds must be an integer of at least 60 and shorter than tokenLifetimeSeconds");
  }
}

/** The token expiry for a token issued at `now` under `policy`. */
export function tokenExpiry(now: Date, policy: LicensePolicy) {
  return Math.floor(now.getTime() / 1000) + policy.tokenLifetimeSeconds;
}
