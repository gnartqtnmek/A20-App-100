import { redirect } from "next/navigation";

export default function LecturerAssignmentsRoute() {
  redirect("/dashboard/lecturer?module=assignments");
}
