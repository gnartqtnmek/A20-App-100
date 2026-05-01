import { redirect } from "next/navigation";

export default function StudentAssignmentRoute({ params }: { params: { id: string } }) {
  redirect(`/dashboard/student?module=assignments&assignmentId=${encodeURIComponent(params.id)}`);
}
