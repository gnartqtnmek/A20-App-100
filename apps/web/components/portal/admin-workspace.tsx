"use client";

import { FormEvent, useEffect, useState } from "react";

import {
  adminCourses,
  adminCreateCourse,
  adminCreateDepartment,
  adminCreateProgram,
  adminCreateSection,
  adminCreateSemester,
  adminCreateUser,
  adminDepartments,
  adminPermissions,
  adminPrograms,
  adminRoles,
  adminSections,
  adminSemesters,
  adminSystemReport,
  adminUsers
} from "@/lib/api";
import type {
  AdminUserItem,
  CourseItem,
  DepartmentItem,
  PermissionItem,
  ProgramItem,
  RoleItem,
  SectionItem,
  SemesterItem
} from "@/lib/lms";
import type { RoleSlug } from "@/lib/roles";

type Props = {
  accessToken: string;
};

const roleOptions: RoleSlug[] = ["student", "lecturer", "admin", "academic_staff", "advisor"];

export function AdminWorkspace({ accessToken }: Props) {
  const [reportItems, setReportItems] = useState<{ key: string; value: string }[]>([]);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [programs, setPrograms] = useState<ProgramItem[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [semesters, setSemesters] = useState<SemesterItem[]>([]);
  const [error, setError] = useState("");

  const [newUser, setNewUser] = useState({
    email: "",
    full_name: "",
    password: "Brainio@123",
    role: "student" as RoleSlug
  });
  const [newDepartment, setNewDepartment] = useState({ code: "", name: "", description: "" });
  const [newProgram, setNewProgram] = useState({ code: "", name: "", total_credits: 120 });
  const [newCourse, setNewCourse] = useState({ code: "", name: "", credits: 3, description: "" });
  const [newSemester, setNewSemester] = useState({ code: "", name: "", status: "planned" });
  const [newSection, setNewSection] = useState({ course_id: "", code: "", semester: "2026A", max_students: 60, status: "draft" });

  async function loadData() {
    const [system, userData, roleData, permissionData, depData, proData, courseData, sectionData, semesterData] = await Promise.all([
      adminSystemReport(accessToken),
      adminUsers(accessToken, 1, 50),
      adminRoles(accessToken),
      adminPermissions(accessToken),
      adminDepartments(accessToken, 1, 50),
      adminPrograms(accessToken, 1, 50),
      adminCourses(accessToken, 1, 50),
      adminSections(accessToken, 1, 50),
      adminSemesters(accessToken, 1, 50)
    ]);
    setReportItems(system.items);
    setUsers(userData.items);
    setRoles(roleData.items);
    setPermissions(permissionData.items);
    setDepartments(depData.items);
    setPrograms(proData.items);
    setCourses(courseData.items);
    setSections(sectionData.items);
    setSemesters(semesterData.items);
    if (courseData.items.length > 0 && !newSection.course_id) {
      setNewSection((prev) => ({ ...prev, course_id: courseData.items[0].id }));
    }
  }

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  async function handleCreateUser(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!newUser.email || !newUser.full_name || !newUser.password) {
      setError("User form requires email, full name and password.");
      return;
    }
    await adminCreateUser({ ...newUser, is_active: true }, accessToken);
    setNewUser({ email: "", full_name: "", password: "Brainio@123", role: "student" });
    await loadData();
  }

  async function handleCreateDepartment(event?: FormEvent) {
    event?.preventDefault();
    if (!newDepartment.code || !newDepartment.name) return;
    await adminCreateDepartment(newDepartment, accessToken);
    setNewDepartment({ code: "", name: "", description: "" });
    await loadData();
  }

  async function handleCreateProgram(event?: FormEvent) {
    event?.preventDefault();
    if (!newProgram.code || !newProgram.name || departments.length === 0) return;
    await adminCreateProgram(
      {
        code: newProgram.code,
        name: newProgram.name,
        total_credits: newProgram.total_credits,
        department_id: departments[0].id
      },
      accessToken
    );
    setNewProgram({ code: "", name: "", total_credits: 120 });
    await loadData();
  }

  async function handleCreateCourse(event?: FormEvent) {
    event?.preventDefault();
    if (!newCourse.code || !newCourse.name) return;
    await adminCreateCourse(
      {
        code: newCourse.code,
        name: newCourse.name,
        credits: newCourse.credits,
        description: newCourse.description,
        department_id: departments[0]?.id
      },
      accessToken
    );
    setNewCourse({ code: "", name: "", credits: 3, description: "" });
    await loadData();
  }

  async function handleCreateSemester(event?: FormEvent) {
    event?.preventDefault();
    if (!newSemester.code || !newSemester.name) return;
    const start = new Date();
    const end = new Date();
    end.setMonth(end.getMonth() + 4);
    await adminCreateSemester(
      {
        code: newSemester.code,
        name: newSemester.name,
        start_date: start.toISOString(),
        end_date: end.toISOString(),
        status: newSemester.status
      },
      accessToken
    );
    setNewSemester({ code: "", name: "", status: "planned" });
    await loadData();
  }

  async function handleCreateSection(event?: FormEvent) {
    event?.preventDefault();
    if (!newSection.course_id || !newSection.code) return;
    await adminCreateSection(newSection, accessToken);
    setNewSection((prev) => ({ ...prev, code: "" }));
    await loadData();
  }

  return (
    <section className="mt-8 space-y-5">
      <div className="rounded-2xl border border-white/50 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-900/45">
        <h3 className="text-xl font-semibold text-brand.night dark:text-white">Admin Portal</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {reportItems.map((item) => (
            <div key={item.key} className="rounded-lg border border-slate-200 bg-white/85 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/70">
              <p className="text-xs uppercase text-slate-500">{item.key}</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {error ? <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p> : null}

      <div className="grid gap-5 xl:grid-cols-2">
        <form onSubmit={handleCreateUser} className="rounded-2xl border border-white/50 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-900/45">
          <h4 className="font-semibold text-brand.night dark:text-white">Users Table</h4>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <input value={newUser.email} onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))} placeholder="Email" className="rounded-lg border px-2 py-1.5 text-sm dark:bg-slate-900" />
            <input value={newUser.full_name} onChange={(e) => setNewUser((p) => ({ ...p, full_name: e.target.value }))} placeholder="Full name" className="rounded-lg border px-2 py-1.5 text-sm dark:bg-slate-900" />
            <input value={newUser.password} onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))} placeholder="Password" className="rounded-lg border px-2 py-1.5 text-sm dark:bg-slate-900" />
            <select value={newUser.role} onChange={(e) => setNewUser((p) => ({ ...p, role: e.target.value as RoleSlug }))} className="rounded-lg border px-2 py-1.5 text-sm dark:bg-slate-900">
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="mt-2 rounded bg-brand.night px-3 py-1.5 text-xs font-semibold text-white">
            Create User
          </button>
          <div className="mt-3 max-h-56 space-y-2 overflow-auto">
            {users.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 bg-white/85 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800/70">
                {item.email} - {item.role}
              </div>
            ))}
          </div>
        </form>

        <div className="rounded-2xl border border-white/50 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-900/45">
          <h4 className="font-semibold text-brand.night dark:text-white">Roles & Permissions</h4>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white/85 p-2 text-sm dark:border-slate-700 dark:bg-slate-800/70">
              <p className="mb-1 font-semibold">Roles</p>
              {roles.map((item) => (
                <p key={item.id}>{item.code}</p>
              ))}
            </div>
            <div className="rounded-lg border border-slate-200 bg-white/85 p-2 text-sm dark:border-slate-700 dark:bg-slate-800/70">
              <p className="mb-1 font-semibold">Permissions</p>
              {permissions.slice(0, 10).map((item) => (
                <p key={item.id}>{item.code}</p>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-white/50 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-900/45">
          <h4 className="font-semibold text-brand.night dark:text-white">Departments / Programs</h4>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <input value={newDepartment.code} onChange={(e) => setNewDepartment((p) => ({ ...p, code: e.target.value }))} placeholder="Department code" className="rounded-lg border px-2 py-1.5 text-sm dark:bg-slate-900" />
            <input value={newDepartment.name} onChange={(e) => setNewDepartment((p) => ({ ...p, name: e.target.value }))} placeholder="Department name" className="rounded-lg border px-2 py-1.5 text-sm dark:bg-slate-900" />
          </div>
          <button type="button" onClick={() => void handleCreateDepartment()} className="mt-2 rounded bg-brand.night px-3 py-1.5 text-xs font-semibold text-white">Create Department</button>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <input value={newProgram.code} onChange={(e) => setNewProgram((p) => ({ ...p, code: e.target.value }))} placeholder="Program code" className="rounded-lg border px-2 py-1.5 text-sm dark:bg-slate-900" />
            <input value={newProgram.name} onChange={(e) => setNewProgram((p) => ({ ...p, name: e.target.value }))} placeholder="Program name" className="rounded-lg border px-2 py-1.5 text-sm dark:bg-slate-900" />
            <button type="button" onClick={() => void handleCreateProgram()} className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">Create Program</button>
          </div>
          <div className="mt-3 max-h-44 space-y-1 overflow-auto text-sm">
            {departments.map((item) => (
              <p key={item.id}>{item.code} - {item.name}</p>
            ))}
            {programs.map((item) => (
              <p key={item.id}>{item.code} - {item.name}</p>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/50 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-900/45">
          <h4 className="font-semibold text-brand.night dark:text-white">Courses / Sections / Semesters</h4>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <input value={newCourse.code} onChange={(e) => setNewCourse((p) => ({ ...p, code: e.target.value }))} placeholder="Course code" className="rounded-lg border px-2 py-1.5 text-sm dark:bg-slate-900" />
            <input value={newCourse.name} onChange={(e) => setNewCourse((p) => ({ ...p, name: e.target.value }))} placeholder="Course name" className="rounded-lg border px-2 py-1.5 text-sm dark:bg-slate-900" />
          </div>
          <button type="button" onClick={() => void handleCreateCourse()} className="mt-2 rounded bg-brand.night px-3 py-1.5 text-xs font-semibold text-white">Create Course</button>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <input value={newSemester.code} onChange={(e) => setNewSemester((p) => ({ ...p, code: e.target.value }))} placeholder="Semester code" className="rounded-lg border px-2 py-1.5 text-sm dark:bg-slate-900" />
            <input value={newSemester.name} onChange={(e) => setNewSemester((p) => ({ ...p, name: e.target.value }))} placeholder="Semester name" className="rounded-lg border px-2 py-1.5 text-sm dark:bg-slate-900" />
            <button type="button" onClick={() => void handleCreateSemester()} className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">Create Semester</button>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <select value={newSection.course_id} onChange={(e) => setNewSection((p) => ({ ...p, course_id: e.target.value }))} className="rounded-lg border px-2 py-1.5 text-sm dark:bg-slate-900">
              {courses.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code}
                </option>
              ))}
            </select>
            <input value={newSection.code} onChange={(e) => setNewSection((p) => ({ ...p, code: e.target.value }))} placeholder="Section code" className="rounded-lg border px-2 py-1.5 text-sm dark:bg-slate-900" />
            <button type="button" onClick={() => void handleCreateSection()} className="rounded bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white">Create Section</button>
          </div>
          <div className="mt-3 max-h-44 space-y-1 overflow-auto text-sm">
            {semesters.map((item) => (
              <p key={item.id}>{item.code} - {item.status}</p>
            ))}
            {sections.map((item) => (
              <p key={item.id}>{item.code} - {item.status}</p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
