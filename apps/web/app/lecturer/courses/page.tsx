import { redirect } from "next/navigation";

export default function LecturerCoursesRoute() {
  redirect("/dashboard/lecturer?module=course_studio");
}
