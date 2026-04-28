import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-4 py-10 sm:px-6">
      <section className="grid w-full gap-8 rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm lg:grid-cols-[1.3fr_1fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-neutral-500">University LMS</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-neutral-900 sm:text-5xl">
            Learn, Teach, and Manage Courses in One Campus Workspace.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-600">
            Nền tảng học tập tích hợp AI Agent — kết nối trực tiếp với FastAPI backend cho
            xác thực, quản lý khóa học, bài tập, sổ điểm và thông báo.
          </p>
          <p className="mt-2 text-sm text-neutral-500">
            Tài khoản được cấp bởi quản trị viên trường. Liên hệ bộ phận hỗ trợ để được cấp quyền truy cập.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              Đăng nhập
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-800 transition hover:bg-neutral-100"
            >
              Dashboard
            </Link>
          </div>
        </div>

        <aside className="rounded-2xl bg-neutral-900 p-6 text-neutral-100">
          <p className="text-sm text-neutral-300">Connected Endpoints</p>
          <ul className="mt-3 space-y-2 font-mono text-xs text-neutral-100">
            <li>POST /auth/login</li>
            <li>GET /auth/me</li>
            <li>GET /courses</li>
            <li>GET /curriculum/courses/:id/modules</li>
            <li>GET /assignments/:id/questions</li>
            <li>GET /grades/me</li>
            <li>GET /knowledge/lessons/:id/chunks</li>
          </ul>
        </aside>
      </section>
    </main>
  );
}
