import { redirect } from "next/navigation";

export default function LecturerSubmissionsRoute() {
  redirect("/dashboard/lecturer?module=assignments");
}
