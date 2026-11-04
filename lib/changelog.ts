/**
 * Released versions, newest first. Add an entry only for a version that has actually shipped
 * (both editions get the same release); the page says "not released yet" while this is empty.
 */
export type Release = {
  version: string;
  /** ISO date of the release. */
  date: string;
  /** For example "Requires macOS 15 or later". */
  requirements: string;
  groups: { title: "New" | "Improved" | "Fixed"; items: string[] }[];
};

export const releases: Release[] = [];
