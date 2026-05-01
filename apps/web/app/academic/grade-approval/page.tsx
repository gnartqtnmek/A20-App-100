import { redirect } from "next/navigation";

export default function AcademicGradeApprovalRoute() {
  redirect("/dashboard/academic-staff?module=grade_approval");
}
