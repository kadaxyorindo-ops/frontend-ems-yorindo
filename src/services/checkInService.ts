import { api, apiPaths } from "./api";

export interface CheckInEventSummary {
  _id: string;
  title: string;
  eventDate: string;
  location: string | null;
  status: string;
}

export interface CheckInDeskStats {
  event: CheckInEventSummary;
  counts: {
    approvedCount: number;
    checkedInCount: number;
    totalReadyCount: number;
    remainingCount: number;
  };
}

export interface CheckInParticipantSummary {
  _id: string;
  fullName: string;
  personalEmail: string | null;
  companyEmail: string | null;
  jobTitle?: { name: string | null };
}

export interface CheckInRegistrationItem {
  _id: string;
  eventId: string;
  participantId: string;
  participantType: string;
  status: string;
  companySnapshot?: { name: string | null };
  industrySnapshot?: { name: string | null };
  jobTitleSnapshot?: { name: string | null };
  citySnapshot?: { name: string | null };
  participant: CheckInParticipantSummary;
  ticket?: {
    qrCode: string;
    qrPayload?: string;
    issuedAt: string;
    reissueCount: number;
    isActive: boolean;
  } | null;
  checkIn: {
    isAttended: boolean;
    checkedInAt: string | null;
    checkedInBy: string | null;
    scanMethod: "qr" | "manual" | string;
    notes: string | null;
  };
}

export interface CheckInRecentItem {
  _id: string;
  status: string;
  participantType: string;
  participant: CheckInParticipantSummary;
  companySnapshot?: { name: string | null };
  jobTitleSnapshot?: { name: string | null };
  checkIn: {
    checkedInAt: string | null;
    scanMethod: "qr" | "manual" | string;
  };
}

export interface CheckInActionResult {
  outcome: "checked_in" | "already_checked_in";
  registration: CheckInRegistrationItem;
  message: string;
}

function getCheckInBasePath(eventId: string) {
  return `${apiPaths.events}/${eventId}/check-ins`;
}

export function getCheckInStats(eventId: string) {
  return api.get<CheckInDeskStats>(`${getCheckInBasePath(eventId)}/stats`);
}

export function getRecentCheckIns(eventId: string, limit = 10) {
  const params = new URLSearchParams({ limit: String(limit) });
  return api.get<{ items: CheckInRecentItem[] }>(
    `${getCheckInBasePath(eventId)}/recent?${params.toString()}`,
  );
}

export function lookupCheckInCandidates(
  eventId: string,
  search: string,
  limit = 8,
) {
  const params = new URLSearchParams({
    search,
    limit: String(limit),
  });

  return api.get<{ items: CheckInRegistrationItem[] }>(
    `${getCheckInBasePath(eventId)}/lookup?${params.toString()}`,
  );
}

export function scanCheckIn(eventId: string, qrPayload: string) {
  return api.post<CheckInActionResult>(`${getCheckInBasePath(eventId)}/scan`, {
    qrPayload,
  });
}

export function manualCheckIn(
  eventId: string,
  registrationId: string,
  notes?: string,
) {
  return api.post<CheckInActionResult>(`${getCheckInBasePath(eventId)}/manual`, {
    registrationId,
    ...(notes?.trim() ? { notes: notes.trim() } : {}),
  });
}
