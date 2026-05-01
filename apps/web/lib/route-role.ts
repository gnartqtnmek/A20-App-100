import { type RoleSlug } from "./roles";

export function roleToPathSegment(role: RoleSlug): string {
  if (role === "academic_staff") return "academic-staff";
  return role;
}

export function pathSegmentToRole(segment: string): RoleSlug | null {
  if (segment === "student") return "student";
  if (segment === "lecturer") return "lecturer";
  if (segment === "admin") return "admin";
  if (segment === "advisor") return "advisor";
  if (segment === "academic_staff" || segment === "academic-staff") return "academic_staff";
  return null;
}
