import { api, apiPaths } from "./api";

// --- Types ---

export type RegistrationStatus = "pending" | "approved" | "rejected" | "checked_in";

export interface RegistrationParticipant {
  _id: string;
  fullName: string;
  personalEmail: string;
  companyEmail: string;
}

export interface RegistrationItem {
  _id: string;
  status: RegistrationStatus;
  companySnapshot:  { name: string };
  industrySnapshot: { name: string };
  jobTitleSnapshot: { name: string };
  citySnapshot:     { name: string };
  participant: RegistrationParticipant;
}

export interface RegistrationMeta {
  approvedCount:  number;
  pendingCount:   number;
  rejectedCount:  number;
  checkedInCount: number;
  totalCount:     number;
}

export interface PaginatedRegistrations {
  items:      RegistrationItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  meta:       RegistrationMeta;
}

export interface GetRegistrationsParams {
  page?:   number;
  limit?:  number;
  status?: RegistrationStatus;
  search?: string;
}

// --- Service functions ---

export function getRegistrations(eventId: string, params: GetRegistrationsParams = {}) {
  const query = new URLSearchParams();
  if (params.page)   query.set("page",   String(params.page));
  if (params.limit)  query.set("limit",  String(params.limit));
  if (params.status) query.set("status", params.status);
  if (params.search) query.set("search", params.search);

  return api.get<PaginatedRegistrations>(
    `${apiPaths.events}/${eventId}/registrations?${query.toString()}`,
  );
}

export function approveRegistration(eventId: string, registrationId: string) {
  return api.patch<RegistrationItem>(
    `${apiPaths.events}/${eventId}/registrations/${registrationId}/approve`,
  );
}

export function rejectRegistration(eventId: string, registrationId: string) {
  return api.patch<RegistrationItem>(
    `${apiPaths.events}/${eventId}/registrations/${registrationId}/reject`,
  );
}

export function bulkApproveRegistrations(eventId: string, ids: string[]) {
  return api.patch<{ modifiedCount: number }>(
    `${apiPaths.events}/${eventId}/registrations/bulk-approve`,
    { ids },
  );
}

export function bulkRejectRegistrations(eventId: string, ids: string[]) {
  return api.patch<{ modifiedCount: number }>(
    `${apiPaths.events}/${eventId}/registrations/bulk-reject`,
    { ids },
  );
}