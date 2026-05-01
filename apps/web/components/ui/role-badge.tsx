import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS, type RoleSlug } from "@/lib/roles";

type Props = {
  role: RoleSlug;
};

const toneByRole: Record<RoleSlug, string> = {
  student: "bg-blue-100 text-blue-700 border-blue-200",
  lecturer: "bg-emerald-100 text-emerald-700 border-emerald-200",
  admin: "bg-rose-100 text-rose-700 border-rose-200",
  academic_staff: "bg-amber-100 text-amber-700 border-amber-200",
  advisor: "bg-violet-100 text-violet-700 border-violet-200"
};

export function RoleBadge({ role }: Props) {
  return <Badge className={toneByRole[role]}>{ROLE_LABELS[role]}</Badge>;
}
