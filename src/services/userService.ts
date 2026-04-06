import { api } from "@/services/api";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  organizationName: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  permissions: string[];
  createdAt: string;
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}

export interface UserFormData {
  name: string;
  email: string;
  role: string;
  organizationName: string | null;
}

export interface UpdateUserData {
  name?: string;
  role?: string;
  organizationName?: string | null;
}

export const SYSTEM_ROLES = [
  "super_admin",
  "admin",
  "event_operator",
  "communication_operator",
  "survey_analyst",
] as const;

export function getUsers(params: GetUsersParams = {}) {
  const query = new URLSearchParams();
  if (params.page)   query.set("page",   String(params.page));
  if (params.limit)  query.set("limit",  String(params.limit));
  if (params.search) query.set("search", params.search);
  if (params.role)   query.set("role",   params.role);
  return api.get<{ items: User[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
    `/api/v1/users?${query.toString()}`,
  );
}

export function createUser(data: UserFormData) {
  return api.post<User>("/api/v1/users", data);
}

export function updateUser(id: string, data: UpdateUserData) {
  return api.patch<User>(`/api/v1/users/${id}`, data);
}

export function toggleUserActive(id: string) {
  return api.patch<User>(`/api/v1/users/${id}/toggle-active`);
}

export function deleteUser(id: string) {
  return api.delete<null>(`/api/v1/users/${id}`);
}
