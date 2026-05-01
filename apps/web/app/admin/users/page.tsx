import { redirect } from "next/navigation";

export default function AdminUsersRoute() {
  redirect("/dashboard/admin?module=users");
}
