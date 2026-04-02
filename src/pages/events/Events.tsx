import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { EventDialog } from "@/components/Event-dialog";
import {
  CalendarClock,
  TrendingUp,
  MapPin,
  MoreHorizontal,
} from "lucide-react";

const dummyEvents = [
  {
    id: 1,
    date: "Oct 12, 2026",
    name: "Global Innovation Summit 2026",
    location: "San Francisco, CA",
    participants: 1200,
    capacity: 1500,
    status: "Upcoming",
  },
  {
    id: 2,
    date: "Nov 05, 2026",
    name: "Designers Meetup: Winter Edition",
    location: "Austin, TX",
    participants: 320,
    capacity: 400,
    status: "Upcoming",
  },
  {
    id: 3,
    date: "Dec 18, 2026",
    name: "Yorindo Charity Gala",
    location: "London, UK",
    participants: 800,
    capacity: 800,
    status: "Ongoing",
  },
];

const statusStyles: Record<string, string> = {
  Ongoing: "bg-emerald-50 text-emerald-600 border-emerald-200",
  Done: "bg-slate-100 text-slate-500 border-slate-200",
  Upcoming: "bg-blue-50 text-blue-600 border-blue-200",
};

export function Events() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-start pb-5 border-b border-slate-100">
          <div>
            <h1 className="text-4xl font-bold text-slate-800 tracking-tight">
              Events
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">
              Orchestrate your upcoming experiences.
            </p>
          </div>
          <EventDialog mode="create" />
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Total Impact Card */}
          <Card className="rounded-xl border border-slate-200 bg-gradient-to-br from-white via-slate-100 to-slate-300/50 p-5 shadow-sm">
            <CardHeader className="p-0 mb-3">
              <CardTitle className="text-[11px] font-semibold uppercase tracking-widest text-amber-900">
                Total Impact{" "}
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0">
              <div className="flex items-end justify-between">
                <span className="text-4xl font-bold text-slate-800 tracking-tight">
                  2,840
                </span>

                {/* Percentage Badge*/}
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-500 bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-1 mb-1">
                  <TrendingUp className="w-3 h-3" />
                  +12.5%
                </span>
              </div>

              {/* Percentage Badge*/}
              <p className="text-xs text-slate-400 mt-1">
                Confirmed attendees across 14 global venues
              </p>
            </CardContent>
          </Card>

          {/* Upcoming Milestone */}
          <Card className="rounded-xl border border-amber-200 bg-gradient-to-br from-yellow-50 via-amber-100 to-yellow-300/50 p-5 shadow-sm">
            <CardHeader className="pb-0 mb-3">
              <CardTitle className="text-[11px] font-semibold uppercase tracking-widest text-amber-900">
                Upcoming Milestone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-slate-800 leading-tight">
                Global Tech Summit
              </div>
              <p className="text-sm text-amber-600/70 mt-1.5">
                Starts in 4 days, 12 hours.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 py-3 pl-5">
                  Event Name & Details
                </TableHead>

                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 py-3">
                  Participant / Capacity
                </TableHead>

                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 py-3">
                  Status
                </TableHead>

                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 py-3 pr-5 text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dummyEvents.map((event) => {
                // Capacity logic for demo purposes
                const pct = Math.round(
                  (event.participants / event.capacity) * 100,
                );
                const isFull = pct >= 100;

                return (
                  <TableRow
                    key={event.id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    {/* Event Name & Details */}
                    <TableCell className="py-4 pl-5">
                      <div
                        className="
                      font-semibold text-slate-800 text-sm leading-tight"
                      >
                        {event.name}
                      </div>
                      <div className="flex flex-col gap-1 mt-1.5">
                        <div className="flex items-center gap-1 text-slate-400 text-xs">
                          <MapPin className="w-3 h-3" />
                          {event.location}
                        </div>
                        <div className="flex items-center gap-1 text-slate-400 text-400 text-xs">
                          <CalendarClock className="w-3 h-3" />
                          {event.date}
                        </div>
                      </div>
                    </TableCell>

                    {/* Progress Bar Capacity */}
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-28 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isFull ? "bg-amber-900" : "bg-[#1a3fa8]"}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap">
                            {event.participants.toLocaleString()} /{" "}
                            {event.capacity.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {pct}% full
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell className="py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[event.status]}`}
                      >
                        {/* Indicator dot*/}
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${event.status === "Ongoing" ? "bg-emerald-400" : "bg-slate-300"}`}
                        />

                        {/* Status Text (Ongoing/Done/Upcoming) */}
                        {event.status}
                      </span>
                    </TableCell>

                    {/* Actions: DropdownMenu */}
                    <TableCell className="py-4 pr-5 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                          >
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="rounded-xl shadow-lg border-slate-100 text-sm"
                        >
                          <DropdownMenuItem
                            asChild
                            onSelect={(e) => e.preventDefault()}
                          >
                            <EventDialog
                              mode="edit"
                              defaultData={{
                                name: event.name,
                                date: event.date,
                                time: "10:00", // Placeholder time, as it's not in the dummy data
                                location: event.location,
                                description: "Event description", // Placeholder description
                              }}
                            />
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer text-slate-600">
                            Manage Participant
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-500 focus:text-red-600 focus:bg-red-50 cursor-pointer">
                            Delete Event
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Footer Pagination */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50">
            <p className="text-xs text-slate-400">
              Showing 1-3 of {dummyEvents.length} events
            </p>
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((p) => (
                <button
                  key={p}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${p === 1 ? "bg-[#1a3fa8] text-white" : "text-slate-400 hover:bg-slate-200"}`}
                >
                  {p}
                </button>
              ))}
              <button className="w-7 h-7 rounded-lg text-xs font-semibold text-slate-400 hover:bg-slate-200">
                {" "}
                →
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
