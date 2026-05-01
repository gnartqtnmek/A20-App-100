import { redirect } from "next/navigation";

export default function AdvisorStudentProfileRoute({ params }: { params: { id: string } }) {
  redirect(`/dashboard/advisor?module=student_profile&studentId=${encodeURIComponent(params.id)}`);
}
