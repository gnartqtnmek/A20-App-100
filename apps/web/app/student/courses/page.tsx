import { redirect } from "next/navigation";

export default function StudentCoursesRoute() {
  redirect("/dashboard/student?module=my_courses");
}
