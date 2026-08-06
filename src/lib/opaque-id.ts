import { createHash } from "crypto";

// Not a secret — just decorrelates the value a <select> ships to the browser from
// the real database primary key. The registration UUIDs for batches/programs/
// classes aren't sensitive on their own (RLS and the server action's own
// existence + registration-open checks are the real boundary, not ID secrecy),
// but there's no reason to hand out the raw internal ID space to every visitor
// who views source on /register either. Server-only: never import this from a
// "use client" file.
const SALT = "smart-ict-lms-public-select-v1";

export function opaqueId(id: string) {
  return createHash("sha256").update(`${SALT}:${id}`).digest("base64url").slice(0, 12);
}

export function resolveOpaqueId<T extends { id: string }>(items: T[], code: string): T | undefined {
  return items.find((item) => opaqueId(item.id) === code);
}
