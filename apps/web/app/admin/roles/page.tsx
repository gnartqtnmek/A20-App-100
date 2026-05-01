import { redirect } from "next/navigation";

export default function AdminRolesRoute() {
  redirect("/dashboard/admin?module=roles_rbac");
}
