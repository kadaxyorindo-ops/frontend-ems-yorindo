// Participants.tsx
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, QrCode, Search, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  getRegistrations,
  approveRegistration,
  rejectRegistration,
  bulkApproveRegistrations,
  bulkRejectRegistrations,
  type BulkApproveRegistrationsResult,
  type RegistrationItem,
  type RegistrationMeta,
  type RegistrationStatus,
  type RegistrationTicketDeliveryStatus,
} from "@/services/registrationService";

const STATUS_OPTIONS: { label: string; value: RegistrationStatus }[] = [
  { label: "Approved", value: "approved" },
  { label: "Pending",  value: "pending"  },
  { label: "Rejected", value: "rejected" },
];

const getStatusStyles = (status: string) => {
  switch (status) {
    case "approved":   return "bg-emerald-50 text-emerald-600 border-emerald-200";
    case "pending":    return "bg-yellow-50 text-yellow-600 border-yellow-200";
    case "rejected":   return "bg-red-50 text-red-600 border-red-200";
    case "checked_in": return "bg-blue-50 text-blue-600 border-blue-200";
    default:           return "bg-slate-50 text-slate-700 border-slate-200";
  }
};

const formatStatus = (status: string) =>
  status === "checked_in" ? "Checked In" : status.charAt(0).toUpperCase() + status.slice(1);

const getTicketDeliveryStyles = (status: RegistrationTicketDeliveryStatus | undefined) => {
  switch (status) {
    case "sent":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "queued":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "processing":
      return "bg-sky-100 text-sky-700 border-sky-200";
    case "failed":
      return "bg-rose-100 text-rose-700 border-rose-200";
    case "idle":
      return "bg-slate-100 text-slate-500 border-slate-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
};

const formatTicketDeliveryStatus = (
  status: RegistrationTicketDeliveryStatus | undefined,
) => {
  switch (status) {
    case "idle":
      return "Idle";
    case "queued":
      return "Queued";
    case "processing":
      return "Sending";
    case "sent":
      return "Sent";
    case "failed":
      return "Failed";
    default:
      return "Not queued";
  }
};

const resolveSnapshotName = (
  snapshotName?: string | null,
  fallbackName?: string | null,
) => snapshotName ?? fallbackName ?? "—";

type ActionFeedback = {
  tone: "success" | "error";
  message: string;
};

export function Participants() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const eventId = searchParams.get("eventId") ?? "";
  const eventTitle = searchParams.get("eventTitle") ?? "Participant Approvals";
  const selectedRegistrationId = searchParams.get("selectedRegistrationId") ?? "";


  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<RegistrationItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [items, setItems] = useState<RegistrationItem[]>([]);
  const [meta, setMeta] = useState<RegistrationMeta>({
    approvedCount: 0, pendingCount: 0, rejectedCount: 0, checkedInCount: 0, totalCount: 0,
  });
  const [totalPages, setTotalPages]   = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [isLoading, setIsLoading]     = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<ActionFeedback | null>(null);
  const [refreshKey, setRefreshKey]   = useState(0);

  const [searchQuery, setSearchQuery]       = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter]     = useState<RegistrationStatus | "">("");
  const [currentPage, setCurrentPage]       = useState(1);
  const [rowsPerPage, setRowsPerPage]       = useState(5);

  const updateSearchParams = (updates: Record<string, string | null>) => {
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams);

      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          nextParams.set(key, value);
        } else {
          nextParams.delete(key);
        }
      }

      return nextParams;
    }, { replace: true });
  };

  // Debounce: wait 400ms after the user stops typing before sending the request
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Single effect handles all fetching. refreshKey is incremented by action
  // handlers to trigger a re-fetch after approve/reject without needing
  // a separate useCallback.
  useEffect(() => {
    if (!eventId) return;
    let active = true;

    (async () => {
      setIsLoading(true);
      setActionError(null);
      const result = await getRegistrations(eventId, {
        page:  currentPage,
        limit: rowsPerPage,
        ...(statusFilter    ? { status: statusFilter }    : {}),
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      });
      if (!active) return;
      if (result.data) {
        setItems(result.data.items);
        setMeta(result.data.meta);
        setTotalPages(result.data.pagination.totalPages);
        setTotalResults(result.data.pagination.total);

        if (selectedRegistrationId) {
          const selectedFromPage = result.data.items.find(
            (item) => item._id === selectedRegistrationId,
          );

          if (selectedFromPage) {
            setSelectedParticipant(selectedFromPage);
          }
        }
      }
      setIsLoading(false);
    })();

    return () => { active = false; };
  }, [eventId, currentPage, rowsPerPage, statusFilter, debouncedSearch, refreshKey]);

  useEffect(() => {
    if (!selectedRegistrationId) {
      setSelectedParticipant(null);
      return;
    }

    const nextSelectedParticipant = items.find(
      (item) => item._id === selectedRegistrationId,
    );

    if (nextSelectedParticipant) {
      setSelectedParticipant(nextSelectedParticipant);
      return;
    }

    if (selectedParticipant?._id !== selectedRegistrationId) {
      setSelectedParticipant(null);
    }
  }, [items, selectedParticipant, selectedRegistrationId]);

  // --- Selection ---

  const toggleSelectAll = () => {
    if (selectedIds.length === items.length && items.length > 0) {
      setSelectedIds([]);
      setSelectedParticipant(null);
      updateSearchParams({ selectedRegistrationId: null });
    } else {
      setSelectedIds(items.map((p) => p._id));
    }
  };

  const toggleSelectOne = (item: RegistrationItem) => {
    const isSelected = selectedIds.includes(item._id);
    if (isSelected) {
      setSelectedIds((prev) => prev.filter((id) => id !== item._id));
      if (selectedParticipant?._id === item._id) {
        setSelectedParticipant(null);
        updateSearchParams({ selectedRegistrationId: null });
      }
    } else {
      setSelectedIds((prev) => [...prev, item._id]);
      setSelectedParticipant(item);
      updateSearchParams({ selectedRegistrationId: item._id });
    }
  };

  const closeSelectedParticipant = () => {
    setSelectedParticipant(null);
    setSelectedIds((prev) =>
      selectedRegistrationId ? prev.filter((id) => id !== selectedRegistrationId) : prev,
    );
    updateSearchParams({ selectedRegistrationId: null });
  };

  // --- Actions ---

  const handleApprove = async (registrationId: string) => {
    setActionFeedback(null);
    const result = await approveRegistration(eventId, registrationId);
    if (result.error) { setActionError(result.error); return; }
    setActionError(null);
    const registrationFromResponse = result.data?.registration;
    const fallbackParticipant =
      registrationFromResponse?.participant ??
      selectedParticipant?.participant ??
      items.find((item) => item._id === registrationId)?.participant;

    setActionFeedback({
      tone: "success",
      message:
        result.data?.message ?? result.message ?? "Registration approved and QR ticket delivery updated.",
    });
    setSelectedIds([]);
    setSelectedParticipant(
      registrationFromResponse
        ? {
            ...registrationFromResponse,
            participant:
              fallbackParticipant ?? {
                _id: registrationFromResponse.participant?._id ?? "",
                fullName: "Participant",
                personalEmail: null,
                companyEmail: null,
              },
          }
        : selectedParticipant,
    );
    updateSearchParams({
      selectedRegistrationId: registrationFromResponse?._id ?? registrationId,
    });
    setRefreshKey((k) => k + 1);
  };

  const handleReject = async (registrationId: string) => {
    setActionFeedback(null);
    const result = await rejectRegistration(eventId, registrationId);
    if (result.error) { setActionError(result.error); return; }
    setActionError(null);
    setActionFeedback({
      tone: "success",
      message: result.message || "Registration rejected successfully.",
    });
    setSelectedIds([]);
    closeSelectedParticipant();
    setRefreshKey((k) => k + 1);
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    setActionFeedback(null);
    const result = await bulkApproveRegistrations(eventId, selectedIds);
    if (result.error) { setActionError(result.error); return; }
    const data: BulkApproveRegistrationsResult | null = result.data;
    setActionError(null);
    setActionFeedback({
      tone: data?.failedQueueCount ? "error" : "success",
      message:
        data?.message ??
        result.message ??
        "Selected registrations approved and QR ticket queue updated.",
    });
    setSelectedIds([]);
    setRefreshKey((k) => k + 1);
  };

  const handleBulkReject = async () => {
    if (selectedIds.length === 0) return;
    setActionFeedback(null);
    const result = await bulkRejectRegistrations(eventId, selectedIds);
    if (result.error) { setActionError(result.error); return; }
    setActionError(null);
    setActionFeedback({
      tone: "success",
      message: result.message || "Selected registrations rejected successfully.",
    });
    setSelectedIds([]);
    closeSelectedParticipant();
    setRefreshKey((k) => k + 1);
  };

  const indexOfFirstItem = totalResults === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const indexOfLastItem  = Math.min(currentPage * rowsPerPage, totalResults);
  const selectedParticipantVisible = selectedParticipant
    ? items.some((item) => item._id === selectedParticipant._id)
    : false;
  const selectedParticipantName =
    selectedParticipant?.participant?.fullName ?? "Participant";
  const selectedParticipantEmail =
    selectedParticipant?.participant?.companyEmail ||
    selectedParticipant?.participant?.personalEmail ||
    "Email not available";

  if (!eventId) {
    return (
      <div className="min-h-screen flex bg-background relative overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        <main className="flex-1 flex flex-col min-w-0 w-full">
          <Topbar onToggleSidebar={() => setIsSidebarOpen(true)} />

          <div className="px-10 py-8">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-6 text-amber-900">
              <h1 className="text-2xl font-bold text-[#001a4e]">Event belum dipilih</h1>
              <p className="mt-2 text-sm leading-6">
                Halaman manajemen participant butuh konteks event. Buka halaman event dulu,
                lalu pilih <span className="font-semibold">Manage Participants</span> dari event yang ingin dikelola.
              </p>
              <div className="mt-5">
                <Button
                  type="button"
                  onClick={() => navigate("/events")}
                  className="h-10 rounded-xl bg-[#0f2f78] px-5 text-white hover:bg-[#11265c]"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                  Back to Events
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-[screen] flex bg-background relative overflow-visible">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 w-full ">
        <Topbar onToggleSidebar={() => setIsSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <header className="flex flex-col p-4 md:px-8 md:pt-8 md:flex-row md:items-end justify-between">
            <div className="flex flex-col justify-between items-start mb-6 pb-2 ml-10 mr-10 gap-3">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[#001a4e]">
                {/* Event name can be added here once fetched */}
                {eventTitle}
              </h1>
            </div>

          <div className="flex items-center gap-3 mb-6 pb-2 ml-10 mr-10">
            <Button
              asChild
              variant="outline"
              className="h-11 rounded-xl border-slate-200 px-4"
            >
              <Link to="/events">
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                Back to Events
              </Link>
            </Button>
            <Button
              asChild
              className="h-11 rounded-xl bg-[#0f2f78] px-5 text-white hover:bg-[#11265c]"
            >
              <Link to={`/events/${eventId}/check-in`}>
                <QrCode className="mr-2 h-4 w-4" aria-hidden="true" />
                Open Check-In Desk
              </Link>
            </Button>
            <div className="text-right mr-4">
              <div className="text-2xl font-bold text-primary">
                {meta.approvedCount}
                <span className="text-sm font-normal text-slate-400">/ {meta.totalCount}</span>
              </div>
              <div className="text-xs font-medium text-[#72a688] bg-[#9cd3b2]/20 px-2 py-0.5 rounded">
                Approved Participants
              </div>
            </div>
            <button
              type="button"
              onClick={handleBulkReject}
              disabled={selectedIds.length === 0 || isLoading}
              className="bg-[#e8e7ef]/50 text-primary px-6 py-3 rounded-lg font-bold text-sm shadow-md hover:shadow-xl transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Reject Selected
            </button>
            <button
              type="button"
              onClick={handleBulkApprove}
              disabled={selectedIds.length === 0 || isLoading}
              className="bg-[linear-gradient(135deg,#002d7a_0%,#15439f_100%)] text-white px-6 py-3 rounded-lg font-bold text-sm shadow-md hover:shadow-xl transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Approve Selected
            </button>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-6 px-10">
          <div className={`transition-all duration-300 ${selectedParticipant ? "col-span-12 lg:col-span-9" : "col-span-12"}`}>
            <div className="bg-white p-6 rounded-2xl">
              {(actionError || actionFeedback) ? (
                <div
                  aria-live="polite"
                  className={`mb-5 rounded-2xl border px-4 py-3 text-sm leading-6 ${
                    actionError || actionFeedback?.tone === "error"
                      ? "border-rose-200 bg-rose-50 text-rose-700"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {actionError ?? actionFeedback?.message}
                </div>
              ) : null}

              {/* Search & Filter */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 z-10">
                    <Search className="h-4 w-4" />
                  </span>
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search participants or companies..."
                    className="pl-10 bg-background border-slate-200 rounded-xl focus-visible:ring-1 focus-visible:ring-indigo-400 transition-all"
                  />
                </div>

                  <Select
                    value={statusFilter}
                    onValueChange={(value) => {
                      setStatusFilter(value === "all" ? "" : value as RegistrationStatus);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[180px] rounded-xl border-slate-200 bg-background focus:ring-1 focus:ring-indigo-400 transition-all">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                      <SelectItem value="all">All Status</SelectItem>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px] text-center">
                        <input
                          type="checkbox"
                          checked={items.length > 0 && selectedIds.length === items.length}
                          onChange={toggleSelectAll}
                          className="translate-y-[2px] h-4 w-4 rounded border-gray-300 focus:ring-primary cursor-pointer"
                        />
                      </TableHead>
                      <TableHead className="pl-10">Name</TableHead>
                      <TableHead className="text-center">Company</TableHead>
                      <TableHead className="text-center">Industry</TableHead>
                      <TableHead className="text-center">Role</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">QR Delivery</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-10 text-slate-400">
                            Loading...
                          </TableCell>
                        </TableRow>
                      ) : items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-10 text-slate-400">
                            No participants found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        items.map((item) => (
                          <TableRow
                            key={item._id}
                            className={selectedIds.includes(item._id) ? "bg-blue-50/50" : ""}
                          >
                            <TableCell className="w-[50px] text-center">
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(item._id)}
                                onChange={() => toggleSelectOne(item)}
                                className="translate-y-[2px] h-4 w-4 rounded border-gray-300 focus:ring-primary cursor-pointer"
                              />
                            </TableCell>
                            <TableCell className="font-medium pl-10">{item.participant.fullName}</TableCell>
                            <TableCell className="text-center">
                              {resolveSnapshotName(
                                item.companySnapshot?.name,
                                item.participant.company?.name,
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {resolveSnapshotName(
                                item.industrySnapshot?.name,
                                item.participant.industry?.name,
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {resolveSnapshotName(
                                item.jobTitleSnapshot?.name,
                                item.participant.jobTitle?.name,
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${getStatusStyles(item.status)}`}>
                                {formatStatus(item.status).toUpperCase()}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={`inline-flex min-w-[80px] items-center justify-center rounded-full border px-3 py-1 text-[10px] font-bold ${getTicketDeliveryStyles(item.ticketDelivery?.status)}`}>
                                {formatTicketDeliveryStatus(item.ticketDelivery?.status)}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-6 py-3 bg-background">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-500">Rows per page</p>
                  <Select
                    value={rowsPerPage.toString()}
                    onValueChange={(value) => { setRowsPerPage(Number(value)); setCurrentPage(1); }}
                  >
                    <SelectTrigger className="h-8 w-[70px] rounded-lg border-slate-200 bg-white">
                      <SelectValue placeholder={rowsPerPage} />
                    </SelectTrigger>
                    <SelectContent side="top">
                      {[5, 10, 20, 50].map((size) => (
                        <SelectItem key={size} value={`${size}`}>{size}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="text-sm text-slate-500">
                  Showing <span className="font-medium text-slate-700">{indexOfFirstItem}</span> to{" "}
                  <span className="font-medium text-slate-700">{indexOfLastItem}</span> of{" "}
                  <span className="font-medium text-slate-700">{totalResults}</span> results
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-sm font-medium text-slate-600">
                    Page {currentPage} of {totalPages || 1}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline" size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="border border-md border-slate-500"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline" size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="border border-md border-slate-500"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </div>

          {/* Detail Sidebar */}
          <div className={`transition-all duration-300 ${selectedParticipant ? "block lg:block col-span-3" : "hidden lg:hidden"}`}>
            <div className="bg-white p-6 rounded-2xl relative overflow-hidden shadow-xl shadow-slate-300 h-full">
              {selectedParticipant && (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[13px] font-bold text-slate-500">Participant Details</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={closeSelectedParticipant}
                      className="h-8 w-8 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-[#15439F]"
                      aria-label="Close participant details"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                  {!selectedParticipantVisible ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                      Participant ini tetap terbuka untuk direview, tetapi sudah tidak muncul di tabel karena tidak cocok dengan filter saat ini.
                    </div>
                  ) : null}
                  <div className="items-center pt-3">
                    <h2 className="text-3xl font-bold tracking-loose text-primary text-center">
                      {selectedParticipantName}
                    </h2>
                    <h3 className="text-sm text-[#002D7A] text-center">
                      {selectedParticipantEmail}
                    </h3>
                  </div>
                  <div className="flex justify-between text-left">
                    <div>
                      <div className="text-[11px] text-muted-foreground uppercase font-bold">Company</div>
                      <div className="text-sm font-bold text-primary">
                        {resolveSnapshotName(
                          selectedParticipant.companySnapshot?.name,
                          selectedParticipant.participant.company?.name,
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-muted-foreground uppercase font-bold">Role</div>
                      <div className="text-sm font-bold text-[#002D7A]">
                        {resolveSnapshotName(
                          selectedParticipant.jobTitleSnapshot?.name,
                          selectedParticipant.participant.jobTitle?.name,
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between text-left">
                    <div>
                      <div className="text-[11px] text-muted-foreground uppercase font-bold">Industry</div>
                      <div className="text-sm font-bold text-primary">
                        {resolveSnapshotName(
                          selectedParticipant.industrySnapshot?.name,
                          selectedParticipant.participant.industry?.name,
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-muted-foreground uppercase font-bold">City</div>
                      <div className="text-sm font-bold text-[#002D7A]">
                        {resolveSnapshotName(
                          selectedParticipant.citySnapshot?.name,
                          selectedParticipant.participant.city?.name,
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                          QR Ticket Delivery
                        </div>
                        <p className="mt-2 text-sm text-slate-500">
                          Approval will generate a QR ticket and queue the delivery email automatically.
                        </p>
                      </div>
                      <span
                        className={`inline-flex min-w-[108px] items-center justify-center rounded-full border px-3 py-1 text-[12px] font-semibold ${getTicketDeliveryStyles(
                          selectedParticipant.ticketDelivery?.status,
                        )}`}
                      >
                        {formatTicketDeliveryStatus(selectedParticipant.ticketDelivery?.status)}
                      </span>
                    </div>

                    <div className="mt-4 space-y-3 text-sm text-slate-600">
                      <div className="flex items-start justify-between gap-3">
                        <span className="font-semibold text-slate-500">Ticket code</span>
                        <span className="text-right font-mono text-[12px] text-slate-700 max-w-[160px] break-all">
                          {selectedParticipant.ticket?.qrCode ?? "Generated after approval"}
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <span className="font-semibold text-slate-500">Attempts</span>
                        <span>{selectedParticipant.ticketDelivery?.attempts ?? 0}</span>
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <span className="font-semibold text-slate-500">Last issue</span>
                        <span className="max-w-[160px] text-right">
                          {selectedParticipant.ticketDelivery?.failureReason ?? "No delivery issue recorded"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-5 px-3 flex flex-row justify-around">
                    <button
                      type="button"
                      onClick={() => handleReject(selectedParticipant._id)}
                      disabled={selectedParticipant.status !== "pending" || isLoading}
                      className="bg-[#DDDCE3] text-foreground px-6 py-2 rounded-lg font-bold text-sm hover:shadow-xl transition-all active:scale-95 w-[100px] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApprove(selectedParticipant._id)}
                      disabled={selectedParticipant.status !== "pending" || isLoading}
                      className="bg-[#15439F] text-white px-6 py-2 rounded-lg font-bold text-sm hover:shadow-xl transition-all active:scale-95 w-[100px] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        </main>
      </div>
    </div>
  );
}