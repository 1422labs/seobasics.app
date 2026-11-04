import { prisma } from "@/lib/prisma";
import { BALANCED_POLICY } from "./policy";
import { createLicenseService } from "./service";
import { currentSigningConfig } from "./signing";

/** The service the route handlers use: this environment's DB, key and policy. */
export function licenseService() {
  return createLicenseService({ db: prisma(), signing: currentSigningConfig(), policy: BALANCED_POLICY });
}
