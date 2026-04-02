import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EventDialog } from "@/components/Event-dialog";
import {
  CalendarClock,
  MapPin,
  MoreHorizontal,
} from "lucide-react";

const dummyEvents = [
  { id: 1, date: "Oct 12, 2026", name: "Global Innovation Summit 2026", location: "San Francisco, CA", participants: 1200, capacity: 1500, status: "Upcoming" },
  { id: 2, date: "Nov 05, 2026", name: "Designers Meetup: Winter Edition", location: "Austin, TX", participants: 320, capacity: 400, status: "Upcoming" },
  { id: 3, date: "Dec 18, 2026", name: "Yorindo Charity Gala", location: "London, UK", participants: 800, capacity: 800, status: "Ongoing" },
];

const statusStyles: Record<string, string> = {
  Ongoing: "bg-emerald-50 text-emerald-600 border-emerald-200",
  Done: "bg-slate-100 text-slate-500 border-slate-200",
  Upcoming: "bg-blue-50 text-blue-600 border-blue-200",
  Registration: "bg-yellow-50 text-yellow-600 border-yellow-200",
  Draft: "bg-slate-50 text-slate-400 border-slate-200",
  Cancelled: "bg-red-50 text-red-600 border-red-200",
};

export function Events() {
  // --- LOGIKA PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const totalPages = Math.ceil(dummyEvents.length / rowsPerPage);
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = dummyEvents.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <DashboardLayout>
      <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
        
        {/* HEADER (DI LUAR CARD - MIRIP KODE #A) */}
        <header className="flex flex-col p-4 md:px-10 md:pt-8 md:flex-row md:items-end justify-between">
          <div className="flex flex-col justify-between items-start mb-6 gap-3">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[#001a4e]">
              Events
            </h1>
          </div>

          {/* Statistik Ringkas di Kanan Header (Gaya Kode #A) */}
          <div className="flex items-center gap-3 mb-6">
            <div className="text-right mr-4 border-r pr-4 border-slate-200">
              <div className="text-2xl font-bold text-[#001a4e]">
                2,840
              </div>
              <div className="text-[10px] font-bold text-[#72a688] bg-[#9cd3b2]/20 px-2 py-0.5 rounded uppercase">
                Total Impact
              </div>
            </div>
            <EventDialog mode="create" />
          </div>
        </header>

        {/* UPCOMING MILESTONE (Gaya Card di Kode #A) */}
        <div className="px-10 mb-8">
          <Card className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50/30 p-6 shadow-sm">
            <CardContent className="p-0 flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-amber-600 mb-1">
                  Upcoming Milestone
                </p>
                <div className="text-xl font-bold text-[#001a4e]">Global Tech Summit</div>
                <p className="text-xs text-amber-700/70 mt-1 font-medium italic">
                  Scheduled for Oct 12, 2026 in San Francisco, CA
                </p>
              </div>
              <span className="w-fit px-4 py-2 rounded-xl bg-amber-200 text-amber-800 text-xs font-bold uppercase shadow-sm">
                In 4 Days
              </span>
            </CardContent>
          </Card>
        </div>

        {/* TABLE SECTION (Hanya tabel yang dibungkus Card Putih) */}
        <div className="px-10 pb-10">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 py-4 pl-6">
                    Event Name & Details
                  </TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 py-4">
                    Participant / Capacity
                  </TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 py-4">
                    Status
                  </TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 py-4 pr-6 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.map((event) => {
                  const pct = Math.round((event.participants / event.capacity) * 100);
                  const isFull = pct >= 100;

                  return (
                    <TableRow key={event.id} className="hover:bg-slate-50/40 transition-colors border-slate-100">
                      <TableCell className="py-5 pl-6">
                        <div className="font-bold text-[#001a4e] text-sm mb-1.5">{event.name}</div>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                            <MapPin className="w-3 h-3" /> {event.location}
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                            <CalendarClock className="w-3 h-3" /> {event.date}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${isFull ? "bg-slate-400" : "bg-[#1a3fa8]"}`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-slate-600">
                              {event.participants.toLocaleString()} / {event.capacity.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-400">{pct}% full</span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${statusStyles[event.status]}`}>
                          <span className={`w-1 h-1 rounded-full ${event.status === "Ongoing" ? "bg-emerald-400" : "bg-blue-400"}`} />
                          {event.status.toUpperCase()}
                        </span>
                      </TableCell>

                      <TableCell className="pr-6 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl shadow-xl border-slate-100">
                            <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
                              <EventDialog mode="edit" defaultData={{ ...event, time: "10:00", description: "" }} />
                            </DropdownMenuItem>
                            <DropdownMenuItem className="font-medium cursor-pointer">Manage Participants</DropdownMenuItem>
                            <DropdownMenuItem className="font-medium text-red-500 focus:text-red-600 cursor-pointer">Delete Event</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* FOOTER PAGINATION (SESUAI KODE #A) */}
            <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 bg-slate-50/30 border-t border-slate-100 gap-4">
              <div className="flex items-center gap-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rows per page</p>
                <Select
                  value={rowsPerPage.toString()}
                  onValueChange={(value) => {
                    setRowsPerPage(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-8 w-[70px] rounded-lg border-slate-200 bg-white text-xs font-bold text-[#001a4e]">
                    <SelectValue placeholder={rowsPerPage} />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[5, 10, 20, 50].map((pageSize) => (
                      <SelectItem key={pageSize} value={`${pageSize}`} className="text-xs font-medium">
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="text-[11px] font-medium text-slate-400">
                Showing <span className="text-[#001a4e] font-bold">{dummyEvents.length > 0 ? indexOfFirstItem + 1 : 0}</span> to{" "}
                <span className="text-[#001a4e] font-bold">{Math.min(indexOfLastItem, dummyEvents.length)}</span> of{" "}
                <span className="text-[#001a4e] font-bold">{dummyEvents.length}</span> results
              </div>

              <div className="flex items-center gap-4">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Page {currentPage} of {totalPages || 1}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="h-8 rounded-lg text-[10px] font-bold border-slate-200 text-[#001a4e] hover:bg-[#e8e7ef] disabled:opacity-30"
                  >
                    PREVIOUS
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="h-8 rounded-lg text-[10px] font-bold border-slate-200 text-[#001a4e] hover:bg-[#e8e7ef] disabled:opacity-30"
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