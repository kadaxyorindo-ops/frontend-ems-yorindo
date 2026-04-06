import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
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
  type RegistrationItem,
  type RegistrationMeta,
  type RegistrationStatus,
} from "@/services/registrationService";

const STATUS_OPTIONS: { label: string; value: RegistrationStatus }[] = [
  { label: "Approved", value: "approved" },
  { label: "Pending",  value: "pending"  },
  { label: "Rejected", value: "rejected" },
];

const getStatusStyles = (status: string) => {
  switch (status) {
    case "approved":   return "bg-[#9cd3b2] text-[#002112] w-[100px]";
    case "pending":    return "bg-[#fed174] text-[#785800] w-[100px]";
    case "rejected":   return "bg-[#f8d7da] text-[#721c24] w-[100px]";
    case "checked_in": return "bg-[#cfe2ff] text-[#084298] w-[100px]";
    default:           return "bg-slate-50 text-slate-700 w-[100px]";
  }
};

const formatStatus = (status: string) =>
  status === "checked_in" ? "Checked In" : status.charAt(0).toUpperCase() + status.slice(1);

export function Participants() {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get("eventId") ?? "";
  const eventTitle = searchParams.get("eventTitle") ?? "Participant Approvals";


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
  const [refreshKey, setRefreshKey]   = useState(0);

  const [searchQuery, setSearchQuery]       = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter]     = useState<RegistrationStatus | "">("");
  const [currentPage, setCurrentPage]       = useState(1);
  const [rowsPerPage, setRowsPerPage]       = useState(5);

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
      }
      setIsLoading(false);
    })();

    return () => { active = false; };
  }, [eventId, currentPage, rowsPerPage, statusFilter, debouncedSearch, refreshKey]);

  // --- Selection ---

  const toggleSelectAll = () => {
    if (selectedIds.length === items.length && items.length > 0) {
      setSelectedIds([]);
      setSelectedParticipant(null);
    } else {
      setSelectedIds(items.map((p) => p._id));
    }
  };

  const toggleSelectOne = (item: RegistrationItem) => {
    const isSelected = selectedIds.includes(item._id);
    if (isSelected) {
      setSelectedIds((prev) => prev.filter((id) => id !== item._id));
      if (selectedParticipant?._id === item._id) setSelectedParticipant(null);
    } else {
      setSelectedIds((prev) => [...prev, item._id]);
      setSelectedParticipant(item);
    }
  };

  // --- Actions ---

  const handleApprove = async (registrationId: string) => {
    const result = await approveRegistration(eventId, registrationId);
    if (result.error) { setActionError(result.error); return; }
    setSelectedIds([]);
    setSelectedParticipant(null);
    setRefreshKey((k) => k + 1);
  };

  const handleReject = async (registrationId: string) => {
    const result = await rejectRegistration(eventId, registrationId);
    if (result.error) { setActionError(result.error); return; }
    setSelectedIds([]);
    setSelectedParticipant(null);
    setRefreshKey((k) => k + 1);
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    const result = await bulkApproveRegistrations(eventId, selectedIds);
    if (result.error) { setActionError(result.error); return; }
    setSelectedIds([]);
    setSelectedParticipant(null);
    setRefreshKey((k) => k + 1);
  };

  const handleBulkReject = async () => {
    if (selectedIds.length === 0) return;
    const result = await bulkRejectRegistrations(eventId, selectedIds);
    if (result.error) { setActionError(result.error); return; }
    setSelectedIds([]);
    setSelectedParticipant(null);
    setRefreshKey((k) => k + 1);
  };

  const indexOfFirstItem = totalResults === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const indexOfLastItem  = Math.min(currentPage * rowsPerPage, totalResults);

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
                onClick={handleBulkReject}
                disabled={selectedIds.length === 0 || isLoading}
                className="bg-[#e8e7ef]/50 text-primary px-6 py-3 rounded-lg font-bold text-sm shadow-md hover:shadow-xl transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Reject Selected
              </button>
              <button
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
                  <Table className="w-full border border-sm">
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="w-[50px] text-center">
                          <input
                            type="checkbox"
                            checked={items.length > 0 && selectedIds.length === items.length}
                            onChange={toggleSelectAll}
                            className="translate-y-[2px] h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                          />
                        </TableHead>
                        <TableHead className="font-bold text-primary pl-10">Name</TableHead>
                        <TableHead className="font-bold text-primary text-center">Company</TableHead>
                        <TableHead className="font-bold text-primary text-center">Industry</TableHead>
                        <TableHead className="font-bold text-primary text-center">Role</TableHead>
                        <TableHead className="font-bold text-primary text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-10 text-slate-400">
                            Loading...
                          </TableCell>
                        </TableRow>
                      ) : items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-10 text-slate-400">
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
                                className="translate-y-[2px] h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                              />
                            </TableCell>
                            <TableCell className="font-medium pl-10">{item.participant.fullName}</TableCell>
                            <TableCell className="text-center">{item.companySnapshot?.name ?? "—"}</TableCell>
                            <TableCell className="text-center">{item.industrySnapshot?.name ?? "—"}</TableCell>
                            <TableCell className="text-center">{item.jobTitleSnapshot?.name ?? "—"}</TableCell>
                            <TableCell className="text-center">
                              <span className={`inline-flex items-center justify-center w-24 px-3 py-1 rounded-full text-[13px] font-bold tracking-tight ${getStatusStyles(item.status)}`}>
                                {formatStatus(item.status)}
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
                    <div>
                      <p className="text-[13px] font-bold text-slate-500">Participant Details</p>
                    </div>
                    <div className="items-center pt-3">
                      <h2 className="text-3xl font-bold tracking-loose text-primary text-center">
                        {selectedParticipant.participant.fullName}
                      </h2>
                      <h3 className="text-sm text-[#002D7A] text-center">
                        {selectedParticipant.participant.companyEmail || selectedParticipant.participant.personalEmail}
                      </h3>
                    </div>
                    <div className="pt-5 flex justify-between text-left">
                      <div>
                        <div className="text-[11px] text-muted-foreground uppercase font-bold">Company</div>
                        <div className="text-sm font-bold text-primary">{selectedParticipant.companySnapshot?.name ?? "—"}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] text-muted-foreground uppercase font-bold">Role</div>
                        <div className="text-sm font-bold text-[#002D7A]">{selectedParticipant.jobTitleSnapshot?.name ?? "—"}</div>
                      </div>
                    </div>
                    <div className="pt-3 flex justify-between text-left">
                      <div>
                        <div className="text-[11px] text-muted-foreground uppercase font-bold">Industry</div>
                        <div className="text-sm font-bold text-primary">{selectedParticipant.industrySnapshot?.name ?? "—"}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] text-muted-foreground uppercase font-bold">City</div>
                        <div className="text-sm font-bold text-[#002D7A]">{selectedParticipant.citySnapshot?.name ?? "—"}</div>
                      </div>
                    </div>
                    <div className="pt-5 px-3 flex flex-row justify-around">
                      <button
                        onClick={() => handleReject(selectedParticipant._id)}
                        disabled={selectedParticipant.status !== "pending" || isLoading}
                        className="bg-[#DDDCE3] text-foreground px-6 py-2 rounded-lg font-bold text-sm hover:shadow-xl transition-all active:scale-95 w-[100px] disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Reject
                      </button>
                      <button
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