import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { usePermission } from "@/hooks/usePermission";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { EventDialog } from "@/components/Event-dialog";
import {
  CalendarClock,
  MapPin,
  MoreHorizontal,
  QrCode,
  Trash2,
  UserCog,
} from "lucide-react";
import {
  getEvents,
  getEventStats,
  deleteEvent,
  hardDeleteEvent,
  type EventItem,
  type EventStats,
} from "@/services/eventService";

const statusStyles: Record<string, string> = {
  ongoing: "bg-emerald-50 text-emerald-600 border-emerald-200",
  done: "bg-slate-100 text-slate-500 border-slate-200",
  upcoming: "bg-blue-50 text-blue-600 border-blue-200",
  registration: "bg-yellow-50 text-yellow-600 border-yellow-200",
  draft: "bg-slate-50 text-slate-400 border-slate-200",
  cancelled: "bg-red-50 text-red-600 border-red-200",
};

const dotStyles: Record<string, string> = {
  ongoing: "bg-emerald-400",
  done: "bg-slate-400",
  upcoming: "bg-blue-400",
  registration: "bg-yellow-400",
  draft: "bg-slate-300",
  cancelled: "bg-red-400",
};

const calculateDaysToEvent = (
  eventDate: string | Date,
  currentTime: number,
): number => {
  return Math.ceil((new Date(eventDate).getTime() - currentTime) / 86400000);
};

export function Events() {
  const [currentPage, setCurrentPage] = useState(1);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const refresh = () => setRefreshKey((k) => k + 1);
  const tableRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const LIMIT = 5;

  const canCreate = usePermission("events:create");
  const canEdit = usePermission("events:edit");
  const canDelete = usePermission("events:delete");
  const canViewRegistrations = usePermission("registrations:view");
  const canCheckIn = usePermission("registrations:checkin");

  useEffect(() => {
    void getEventStats().then((result) => {
      if (result.data) setStats(result.data);
    });
  }, [refreshKey]);

  useEffect(() => {
    setLoading(true);
    void getEvents(currentPage, LIMIT, search).then((result) => {
      if (result.data) {
        setEvents(result.data.items);
        setTotalPages(result.data.pagination.totalPages);
        setTotal(result.data.pagination.total);
      }
      setLoading(false);
    });
  }, [currentPage, refreshKey, search]);

  const handleSearch = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen flex flex-col bg-background relative overflow-hidden font-sans">
        {/* HEADER */}
        <header className="flex flex-col p-4 md:px-10 md:pt-8 md:flex-row md:items-end justify-between">
          <div className="flex flex-col justify-between items-start mb-6 gap-3">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[#001a4e]">
              Event Management
            </h1>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="text-right mr-4 border-r pr-4 border-slate-200">
              <div className="text-2xl font-bold text-[#001a4e]">
                {stats?.totalApprovedAcrossAllEvents.toLocaleString() ?? "—"}
              </div>
              <div className="text-[10px] font-bold text-[#72a688] bg-[#9cd3b2]/20 px-2 py-0.5 rounded uppercase">
                Total Participant
              </div>
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search events..."
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#1a3fa8]/50 focus:ring-1 focus:ring-[#1a3fa8]/20 placeholder:text-slate-300"
            />
            {canCreate && <EventDialog mode="create" onSuccess={refresh} />}
          </div>
        </header>

        {/* MILESTONE CARD */}
        <div className="px-10 mb-8">
          <Card className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50/30 p-6 shadow-sm transition-all hover:shadow-md hover:border-amber-200">
           
            <div className="flex items-center justify-between gap-8">
              {/* GROUP 1: TEXT */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold uppercase tracking-widest text-amber-600 mb-1">
                  Upcoming Milestone
                </p>
                <h2 className="text-2xl font-extrabold tracking-tight text-[#001a4e]">
                  {stats?.nearestUpcomingEvent?.title ?? "No upcoming events"}
                </h2>

                <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
                  <CalendarClock className="w-4 h-4 text-amber-500" />
                  {stats?.nearestUpcomingEvent ? (
                    <span>
                      Scheduled for{" "}
                      <span className="text-slate-800 font-semibold">
                        {new Date(
                          stats.nearestUpcomingEvent.eventDate,
                        ).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </span>
                  ) : (
                    "No events scheduled at the moment."
                  )}
                </div>
              </div>

              {/* GROUP 2: COUNTDOWN */}
              {stats?.nearestUpcomingEvent &&
                (() => {
                  const days = calculateDaysToEvent(
                    stats.nearestUpcomingEvent.eventDate,
                    Date.now(),
                  );
                  return (
                    <div className="flex flex-col items-center justify-center min-w-[110px] px-4 py-3 rounded-xl bg-amber-200/50 border border-amber-300 text-amber-800 shadow-sm">
                      <div className="text-[9px] uppercase font-bold tracking-widest opacity-70 mb-0.5">
                        Countdown
                      </div>
                      <div className="text-xl font-bold tabular-nums">
                        {days > 0 ? (
                          <div className="flex items-baseline gap-1">
                            {days}{" "}
                            <span className="text-xs font-semibold">Days</span>
                          </div>
                        ) : (
                          "Today"
                        )}
                      </div>
                    </div>
                  );
                })()}
            </div>{" "}
          </Card>
        </div>

        {/* TABLE SECTION */}
        <div ref={tableRef} className="px-10 pb-10">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm min-h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="py-4 pl-6">
                    Event Name & Details
                  </TableHead>
                  <TableHead className="py-4">
                    Participant / Capacity
                  </TableHead>
                  <TableHead className="py-4">
                    Status
                  </TableHead>
                  <TableHead className="py-4 pr-6 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody
                className={loading ? "opacity-40 pointer-events-none" : ""}
              >
                {!loading && events.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-10 text-slate-400 text-sm"
                    >
                      No events found.
                    </TableCell>
                  </TableRow>
                )}
                {events.map((event) => {
                  const pct = Math.round(
                    (event.approvedCount / (event.totalCount || 1)) * 100,
                  );
                  const isFull = pct >= 100;

                  return (
                    <TableRow
                      key={event._id}
                    >
                      <TableCell className="py-5 pl-6">
                        <div className="font-bold text-[#001a4e] text-sm mb-1.5">
                          {event.title}
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                            <MapPin className="w-3 h-3" />{" "}
                            {event.location ?? "-"}
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                            <CalendarClock className="w-3 h-3" />
                            {new Date(event.eventDate).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Participant / Capacity */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-1.5 bg-slate-300 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${isFull ? "bg-emerald-500" : "bg-[#1a3fa8]"}`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                          <div className="flex flex-col">
                            <span
                              className={`text-[11px] font-bold ${isFull ? "text-emerald-600" : "text-slate-600"}`}
                            >
                              {event.approvedCount.toLocaleString()} /{" "}
                              {event.totalCount.toLocaleString()}
                            </span>
                            <span
                              className={`text-[10px] ${isFull ? "text-emerald-500" : "text-slate-400"}`}
                            >
                              {isFull ? `${pct}% approved` : `${pct}% approved`}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${statusStyles[event.status]}`}
                        >
                          <span
                            className={`w-1 h-1 rounded-full ${dotStyles[event.status] ?? "bg-slate-300"}`}
                          />
                          {event.status.toUpperCase()}
                        </span>
                      </TableCell>

                      <TableCell className="pr-6 text-right">
                        {/* WRAPPER FOR ACTIONS */}
                        <AlertDialog>
                          <DropdownMenu
                            open={openMenuId === event._id}
                            onOpenChange={(open) =>
                              setOpenMenuId(open ? event._id : null)
                            }
                          >
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                disabled={event.status === "cancelled"}
                                className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-slate-600"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="rounded-xl shadow-xl border-slate-100 w-48"
                            >
                              {canEdit && (
                                <DropdownMenuItem
                                  onSelect={(e) => e.preventDefault()}
                                  className="p-0"
                                >
                                  <EventDialog
                                    mode="edit"
                                    eventId={event._id}
                                    onSuccess={() => {
                                      refresh();
                                      setOpenMenuId(null);
                                    }}
                                    defaultData={{
                                      name: event.title,
                                      date: event.eventDate.split("T")[0] ?? "",
                                      time: "10:00",
                                      location: event.location ?? "",
                                      description: event.description ?? "",
                                      status: event.status,
                                      industry: event.industry ?? {
                                        refId: null,
                                        name: null,
                                      },
                                    }}
                                  />
                                </DropdownMenuItem>
                              )}

                              {canViewRegistrations && (
                                <DropdownMenuItem
                                  className="font-medium cursor-pointer"
                                  onSelect={() =>
                                    navigate(`/participants?eventId=${event._id}&eventTitle=${encodeURIComponent(event.title)}`)
                                  }
                                >
                                  <UserCog className="w-4 h-4" /> Manage Participants
                                </DropdownMenuItem>
                              )}

                              {canCheckIn && (
                                <DropdownMenuItem
                                  className="font-medium cursor-pointer"
                                  onSelect={() => navigate(`/events/${event._id}/check-in`)}
                                >
                                  <QrCode className="w-4 h-4" /> Open Check-In Desk
                                </DropdownMenuItem>
                              )}

                              {canDelete && (
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem
                                    variant="destructive"
                                    className="font-medium text-red-500 focus:text-red-600 cursor-pointer gap-2"
                                  >
                                    <Trash2 className="w-4 h-4" /> Delete Event
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>

                          {/* KONTEN KONFIRMASI DELETE */}
                          <AlertDialogContent className="rounded-2xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete{" "}
                                <span className="font-bold text-slate-900">
                                  "{event.title}"
                                </span>
                                . This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-lg">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={async () => {
                                  await hardDeleteEvent(event._id);
                                  refresh();
                                }}
                                className="bg-red-500 hover:bg-red-600 text-white rounded-lg"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* PAGINATION */}
            <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 bg-slate-50/30 border-t border-slate-100 gap-4">
              <div className="text-[13px] font-medium text-slate-400">
                Showing{" "}
                <span className="text-[#001a4e] font-bold">
                  {total > 0 ? (currentPage - 1) * LIMIT + 1 : 0}
                </span>{" "}
                to{" "}
                <span className="text-[#001a4e] font-bold">
                  {Math.min(currentPage * LIMIT, total)}
                </span>{" "}
                of <span className="text-[#001a4e] font-bold">{total}</span>{" "}
                results
              </div>

              <div className="flex items-center gap-4">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Page {currentPage} of {totalPages || 1}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="h-8 rounded-lg text-[11px] font-bold border-slate-200 text-[#001a4e] hover:bg-[#e8e7ef]"
                  >
                    PREVIOUS
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="h-8 rounded-lg text-[11px] font-bold border-slate-200 text-[#001a4e] hover:bg-[#e8e7ef]"
                  >
                    NEXT
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
