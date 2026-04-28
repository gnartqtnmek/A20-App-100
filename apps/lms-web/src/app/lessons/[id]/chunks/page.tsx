"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { ApiError, apiClient } from "@/lib/api-client";
import { getAccessToken, getUserRole } from "@/lib/auth-storage";
import type { KnowledgeChunkRead, LessonRead } from "@/lib/types";
import { Card, EmptyState, ErrorBanner, PageShell } from "@/components/page-shell";

function formatDate(value: string): string {
  return new Date(value).toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" });
}

export default function LessonChunksPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const lessonId = params.id;
  const role = getUserRole();

  const [lesson, setLesson] = useState<LessonRead | null>(null);
  const [chunks, setChunks] = useState<KnowledgeChunkRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/login");
      return;
    }
    if (!lessonId) return;

    let cancelled = false;
    (async () => {
      try {
        const [chunkData] = await Promise.all([
          apiClient.listLessonChunks(lessonId),
        ]);
        if (cancelled) return;
        setChunks(chunkData);
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError && err.status === 401) {
            router.replace("/login");
            return;
          }
          setError(err instanceof Error ? err.message : "Không tải được danh sách chunks.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lessonId, router]);

  async function handleDelete(chunkId: string) {
    if (!confirm("Xóa chunk này? Hành động không thể hoàn tác.")) return;
    setDeletingId(chunkId);
    setError(null);
    try {
      await apiClient.deleteChunk(chunkId);
      setChunks((prev) => prev.filter((c) => c.id !== chunkId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Xóa thất bại.");
    } finally {
      setDeletingId(null);
    }
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const canDelete = role === "lecturer" || role === "admin";

  if (loading) {
    return (
      <PageShell title="Quản lý Knowledge Chunks">
        <Card>Đang tải...</Card>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Knowledge Chunks"
      subtitle={`Lesson ID: ${lessonId?.slice(0, 8)}… · ${chunks.length} chunks`}
    >
      <ErrorBanner message={error} />

      {chunks.length === 0 ? (
        <EmptyState message="Bài học này chưa có knowledge chunk nào. Chunks được tạo tự động khi pipeline embedding chạy." />
      ) : (
        <div className="space-y-3">
          {chunks.map((chunk) => {
            const isExpanded = expanded[chunk.id] ?? false;
            const preview = chunk.content.length > 200 ? chunk.content.slice(0, 200) + "…" : chunk.content;

            return (
              <Card key={chunk.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-xs font-medium text-white">
                        #{chunk.chunk_index}
                      </span>
                      <span className="rounded-full border border-neutral-200 px-2 py-0.5 font-mono text-xs text-neutral-500">
                        {chunk.model_name}
                      </span>
                      <span className="text-xs text-neutral-400">{formatDate(chunk.created_at)}</span>
                    </div>

                    <p className="whitespace-pre-wrap text-sm leading-6 text-neutral-700">
                      {isExpanded ? chunk.content : preview}
                    </p>

                    {chunk.content.length > 200 && (
                      <button
                        onClick={() => toggleExpand(chunk.id)}
                        className="mt-1 text-xs text-blue-600 hover:underline"
                      >
                        {isExpanded ? "Thu gọn" : "Xem thêm"}
                      </button>
                    )}

                    {chunk.extra && Object.keys(chunk.extra).length > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-neutral-500 hover:text-neutral-700">
                          Metadata
                        </summary>
                        <pre className="mt-1 overflow-x-auto rounded-lg bg-neutral-50 p-2 font-mono text-xs text-neutral-600">
                          {JSON.stringify(chunk.extra, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>

                  {canDelete && (
                    <button
                      onClick={() => handleDelete(chunk.id)}
                      disabled={deletingId === chunk.id}
                      className="shrink-0 rounded-full border border-rose-200 px-3 py-1 text-xs text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                    >
                      {deletingId === chunk.id ? "Đang xóa…" : "Xóa"}
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div className="rounded-xl border border-dashed border-neutral-300 bg-white/40 p-4 text-xs text-neutral-500">
        Chunks được tạo tự động bởi embedding pipeline. Chỉ có thể xóa từ giao diện này.
        Để tạo chunks mới, kích hoạt pipeline qua agent API hoặc admin tools.
      </div>
    </PageShell>
  );
}
