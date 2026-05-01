import { redirect } from "next/navigation";

export default function StudentCourseDetailRoute({ params }: { params: { id: string } }) {
  redirect(`/dashboard/student?module=my_courses&sectionId=${encodeURIComponent(params.id)}`);
}
