"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError, apiClient } from "@/lib/api-client";
import { Card, ErrorBanner, PageShell } from "@/components/page-shell";

export default function NewCoursePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: "",
    name: "",
    description: "",
    semester: "",
    invite_code: "",
    is_published: false,
  });

  function set(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const course = await apiClient.createCourse({
        code: form.code.trim(),
        name: form.name.trim(),
        description: form.description.trim() || null,
        semester: form.semester.trim() || null,
        invite_code: form.invite_code.trim() || null,
        is_published: form.is_published,
      });
      router.push(`/courses/${course.id}/manage`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không thể tạo khóa học.");
      setSaving(false);
    }
  }

  return (
    <PageShell
      title="Tạo khóa học mới"
      subtitle="Điền thông tin khóa học rồi thêm module và bài giảng."
      actions={
        <button
          onClick={() => router.back()}
          className="rounded-full border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
        >
          ← Quay lại
        </button>
      }
    >
      <ErrorBanner message={error} />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-neutral-700">Mã khóa học *</span>
              <input
                required
                value={form.code}
                onChange={(e) => set("code", e.target.value)}
                placeholder="VD: CSE301"
                className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-neutral-700">Học kỳ</span>
              <input
                value={form.semester}
                onChange={(e) => set("semester", e.target.value)}
                placeholder="VD: HK1-2025"
                className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-neutral-700">Tên khóa học *</span>
            <input
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="VD: Cấu trúc dữ liệu và Giải thuật"
              className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-neutral-700">Mô tả</span>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              placeholder="Giới thiệu ngắn về khóa học..."
              className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-neutral-700">Mã mời sinh viên</span>
            <input
              value={form.invite_code}
              onChange={(e) => set("invite_code", e.target.value)}
              placeholder="VD: CSE301-K65 (để trống để tạo tự động)"
              className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => set("is_published", e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 accent-blue-600"
            />
            <span className="font-medium text-neutral-700">Xuất bản ngay (sinh viên có thể xem)</span>
          </label>

          <div className="flex justify-end gap-3 border-t border-neutral-100 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-full border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Đang tạo..." : "Tạo khóa học →"}
            </button>
          </div>
        </form>
      </Card>
    </PageShell>
  );
}
