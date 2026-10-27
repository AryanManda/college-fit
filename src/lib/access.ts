export type AccessMode = "sample" | "full";

export type AccessRecord = {
  mode: AccessMode;
  email?: string;
  startedAt?: string;
};

export const ACCESS_KEY = "aether.access.v1";
export const FULL_BACKUP_KEY = "aether.full-backup.v1";

const FULL_ONLY_PREFIXES = ["/profile", "/onboarding", "/upload", "/account", "/settings"];

export function isFullOnlyPath(pathname: string) {
  return FULL_ONLY_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function isDemoStudent(
  student: { firstName: string; lastName: string; email: string },
  accountEmail: string | null,
) {
  return (
    !accountEmail &&
    student.firstName === "Alex" &&
    student.lastName === "Rivera" &&
    student.email === "alex.rivera@email.com"
  );
}

export function readAccess(): AccessRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ACCESS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AccessRecord;
    if (parsed?.mode !== "sample" && parsed?.mode !== "full") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeAccess(record: AccessRecord) {
  localStorage.setItem(ACCESS_KEY, JSON.stringify(record));
}

export function hasFullBackup() {
  return Boolean(localStorage.getItem(FULL_BACKUP_KEY));
}
