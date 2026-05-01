"use client";

import { type ReactNode } from "react";

import { RoleGuard } from "@/components/auth/role-guard";
import { type AuthUser, type RoleSlug } from "@/lib/roles";

type SessionState = {
  user: AuthUser;
  accessToken: string;
};

type Props = {
  role: RoleSlug;
  children: (session: SessionState) => ReactNode;
};

export function ProtectedRoute({ role, children }: Props) {
  return <RoleGuard allow={[role]}>{children}</RoleGuard>;
}
