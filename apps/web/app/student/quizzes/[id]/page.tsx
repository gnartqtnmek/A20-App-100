import { redirect } from "next/navigation";

export default function StudentQuizRoute({ params }: { params: { id: string } }) {
  redirect(`/dashboard/student?module=quiz_exams&quizId=${encodeURIComponent(params.id)}`);
}
