import { api, apiPaths, API_V1_PREFIX } from "./api";

export interface EventItem {
  _id: string;
  title: string;
  description?: string | null;
  eventDate: string;
  location: string | null;
  status: string;
  industry: { refId: string | null; name: string | null };
  approvedCount: number;
  pendingCount: number;
  totalCount: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedEvents {
  items: EventItem[];
  pagination: PaginationMeta;
}

export interface NearestEvent {
  _id: string;
  title: string;
  eventDate: string;
  status: string;
}

export interface EventStats {
  totalApprovedAcrossAllEvents: number;
  nearestUpcomingEvent: NearestEvent | null;
}

export function getEventStats() {
  return api.get<EventStats>(`${apiPaths.events}/stats`);
}

export function getEvents(page: number, limit = 5, search = "") {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(search ? { search } : {}),
    _t: String(Date.now()),
  });
  return api.get<PaginatedEvents>(`${apiPaths.events}?${params.toString()}`);
}

// Industry types
export interface Industry {
  _id: string;
  name: string;
}

// Create/Update body shapes
export interface CreateEventBody {
  title: string;
  description: string | null;
  category: string | null;
  industry: { refId: string | null; name: string | null };
  eventDate: string;
  location: string | null;
  registrationForm: { fields: [] };
}

export interface UpdateEventBody {
  title?: string;
  description?: string | null;
  category?: string | null;
  status?: string;           
  industry?: { refId: string | null; name: string | null };
  eventDate?: string;
  location?: string | null;
}

// Service functions
export function getIndustries() {
  return api.get<Industry[]>(`${API_V1_PREFIX}/industries`);
}

export function createEvent(body: CreateEventBody) {
  return api.post<EventItem>(apiPaths.events, body);
}

export function updateEvent(id: string, body: UpdateEventBody) {
  return api.patch<EventItem>(`${apiPaths.events}/${id}`, body);
}

export function deleteEvent(id: string) {
  return api.delete<EventItem>(`${apiPaths.events}/${id}`);
}

export function hardDeleteEvent(id: string) {
  return api.delete<EventItem>(`${apiPaths.events}/${id}/hard`);
}