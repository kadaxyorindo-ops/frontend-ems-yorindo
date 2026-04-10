import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CalendarPlus,
  CalendarDays,
  Clock,
  MapPin,
  AlignLeft,
  Pencil,
  Plus,
  Tag,
  Briefcase,
  SquarePen,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Import Select
import {
  createEvent,
  updateEvent,
  getIndustries,
  createIndustry,
  type Industry,
  type CreateEventBody,
} from "@/services/eventService";
import { ChevronsUpDown, Check } from "lucide-react";

interface EventDialogProps {
  mode: "create" | "edit";
  eventId?: string;
  defaultData?: {
    name: string;
    date: string;
    time: string;
    location: string;
    description: string;
    status: string;
    industry: { refId: string | null; name: string | null };
  };
  onOpen?: () => void;
  onSuccess?: () => void;
}

const VALID_STATUSES = [
  "draft",
  "upcoming",
  "registration",
  "ongoing",
  "done",
  "cancelled",
];

export function EventDialog({
  mode,
  eventId,
  defaultData,
  onOpen,
  onSuccess,
}: EventDialogProps) {
  const today = new Date().toISOString().split("T")[0];
  const minDate = mode === "create" ? today : undefined;
  const isEdit = mode === "edit";
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(
    defaultData?.industry?.refId
      ? {
          _id: defaultData.industry.refId,
          name: defaultData.industry.name ?? "",
        }
      : null,
  );
  const [selectedStatus, setSelectedStatus] = useState<string>(
    defaultData?.status ?? "",
  );
  const [_addingIndustry, setAddingIndustry] = useState(false);
  const [newIndustryName, setNewIndustryName] = useState("");
  const [industryError, setIndustryError] = useState<string | null>(null);
  const [industryOpen, setIndustryOpen] = useState(false);

  const industryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!industryOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        industryRef.current &&
        !industryRef.current.contains(e.target as Node)
      ) {
        setIndustryOpen(false);
        setNewIndustryName("");
        setIndustryError(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [industryOpen]);

  useEffect(() => {
    if (!open) return;
    void getIndustries().then((result) => {
      if (result.data) setIndustries(result.data);
    });
  }, [open]);

  const handleAddIndustry = async () => {
    const trimmed = newIndustryName.trim();
    if (!trimmed) return;

    // Client-side similarity check before hitting the API.
    const normalized = trimmed.toLowerCase();
    const similar = industries.find(
      (i) =>
        i.name.toLowerCase() === normalized ||
        i.name.toLowerCase().includes(normalized) ||
        normalized.includes(i.name.toLowerCase()),
    );
    if (similar) {
      setIndustryError(`Too similar to existing industry: "${similar.name}"`);
      return;
    }

    const result = await createIndustry(trimmed);
    if (result.error) {
      setIndustryError(result.error);
      return;
    }

    const created = result.data!;
    setIndustries((prev) =>
      [...prev, created].sort((a, b) => a.name.localeCompare(b.name)),
    );
    setSelectedIndustry(created);
    setAddingIndustry(false);
    setNewIndustryName("");
    setIndustryError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const date = formData.get("eventDate") as string;
    const time = formData.get("eventTime") as string;
    const eventDate = `${date}T${time}:00.000Z`;

    setSubmitting(true);
    try {
      if (isEdit && eventId) {
        const result = await updateEvent(eventId, {
          title: formData.get("eventName") as string,
          description: (formData.get("eventDescription") as string) || null,
          location: (formData.get("eventLocation") as string) || null,
          eventDate,
          status: VALID_STATUSES.includes(selectedStatus)
            ? selectedStatus
            : undefined,
          industry: selectedIndustry
            ? {
                refId: selectedIndustry._id,
                name: selectedIndustry.name || null,
              }
            : { refId: null, name: null },
        });
        if (result.error) {
          alert(`Update failed: ${result.error}`);
          return;
        }
      } else {
        const body: CreateEventBody = {
          title: formData.get("eventName") as string,
          description: (formData.get("eventDescription") as string) || null,
          category: null,
          industry: selectedIndustry
            ? {
                refId: selectedIndustry._id,
                name: selectedIndustry.name || null,
              }
            : { refId: null, name: null },
          eventDate,
          location: (formData.get("eventLocation") as string) || null,
          registrationForm: { fields: [] },
        };
        const result = await createEvent(body);
        if (result.error) {
          alert(`Create failed: ${result.error}`);
          return;
        }
      }
      setOpen(false);
      onSuccess?.();
    } finally {
      setSubmitting(false);
    }
  };

  const STATUS_TRANSITIONS: Record<string, string[]> = {
    draft: ["draft", "upcoming", "cancelled"],
    upcoming: ["upcoming", "registration", "cancelled"],
    registration: ["registration", "ongoing"],
    ongoing: ["ongoing", "done"],
    done: ["done"],
    cancelled: ["cancelled"],
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <button
            type="button"
            onClick={onOpen}
            className=" flex items-center gap-2 w-full text-left px-2 py-1.5 font-medium hover:bg-slate-100 rounded-sm cursor-pointer"
          >
            <SquarePen className="w-4 h-4" />
            Edit Event
          </button>
        ) : (
          <Button
            type="button"
            onClick={onOpen}
            className="bg-[#1a3fa8] hover:bg-[#153289] cursor-pointer gap-1.5 text-sm font-semibold px-4 h-9 rounded-lg shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Event
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border border-slate-200 shadow-xl rounded-xl gap-0">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="px-6 pt-6 pb-5 border-b border-slate-100">
            <DialogHeader className="space-y-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center justify-center w-7 h-7 rounded-md bg-[#1a3fa8]/10">
                  {isEdit ? (
                    <Pencil className="w-3.5 h-3.5 text-[#1a3fa8]" />
                  ) : (
                    <CalendarPlus className="w-3.5 h-3.5 text-[#1a3fa8]" />
                  )}
                </div>
              </div>
              <DialogTitle className="text-lg font-bold text-slate-800 tracking-tight leading-none">
                {isEdit ? "Edit Event" : "Create Event"}
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-sm pt-0.5">
                {isEdit
                  ? "Update the details of your existing event."
                  : "Fill in the details for your new event."}
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4 bg-white">
            {/* Event Name */}
            <FieldRow
              icon={<CalendarPlus className="w-3.5 h-3.5" />}
              label="Event Name"
              required
            >
              <Input
                id="event-name"
                name="eventName"
                defaultValue={defaultData?.name}
                placeholder="Enter event name"
                required
                onKeyDown={(e) => e.stopPropagation()}
                className="h-9 rounded-lg border-slate-200 bg-slate-50 placeholder:text-slate-300 text-sm text-slate-700 focus-visible:ring-1 focus-visible:ring-[#1a3fa8]/40 focus-visible:border-[#1a3fa8]/50"
              />
            </FieldRow>

            {/* Location */}
            <FieldRow
              icon={<MapPin className="w-3.5 h-3.5" />}
              label="Location"
              required
            >
              <Input
                id="event-location"
                name="eventLocation"
                defaultValue={defaultData?.location}
                placeholder="Location, City"
                required
                onKeyDown={(e) => e.stopPropagation()}
                className="h-9 rounded-lg border-slate-200 bg-slate-50 placeholder:text-slate-300 text-sm text-slate-700 focus-visible:ring-1 focus-visible:ring-[#1a3fa8]/40 focus-visible:border-[#1a3fa8]/50"
              />
            </FieldRow>

            {/* Date + Time */}
            <div className="grid grid-cols-2 gap-3">
              <FieldRow
                icon={<CalendarDays className="w-3.5 h-3.5" />}
                label="Date"
                required
              >
                <Input
                  id="event-date"
                  name="eventDate"
                  type="date"
                  min={minDate}
                  defaultValue={defaultData?.date}
                  required
                  className="h-10! leading-none py-0 rounded-lg border-slate-200 bg-slate-50 text-sm text-slate-700 focus-visible:ring-1 focus-visible:ring-[#1a3fa8]/40 focus-visible:border-[#1a3fa8]/50"
                />
              </FieldRow>

              <FieldRow
                icon={<Clock className="w-3.5 h-3.5" />}
                label="Time"
                required
              >
                <Input
                  id="event-time"
                  name="eventTime"
                  type="time"
                  defaultValue={defaultData?.time}
                  required
                  className="h-10! leading-none py-0 rounded-lg border-slate-200 bg-slate-50 text-sm text-slate-700 focus-visible:ring-1 focus-visible:ring-[#1a3fa8]/40 focus-visible:border-[#1a3fa8]/50"
                />
              </FieldRow>
            </div>

            {/* Dropdown Row: Status & Industry */}
            <div className="grid grid-cols-2 gap-3">
              <FieldRow
                icon={<Tag className="w-3.5 h-3.5" />}
                label="Status"
                required
              >
                <Select
                  name="eventStatus"
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}
                  required
                >
                  <SelectTrigger className="w-full h-10! flex items-center rounded-lg border-slate-200 bg-slate-50 text-sm foucs:ring-1 focus:ring-[#1a3fa8]/40">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {(() => {
                      const currentStatus = defaultData?.status || "draft";
                      const allowedStatuses = STATUS_TRANSITIONS[
                        currentStatus
                      ] || ["draft"];

                      return (
                        <>
                          {allowedStatuses.includes("draft") && (
                            <SelectItem
                              value="draft"
                              className="bg-slate-50 text-slate-900 border-slate-200"
                            >
                              Draft
                            </SelectItem>
                          )}
                          {allowedStatuses.includes("upcoming") && (
                            <SelectItem
                              value="upcoming"
                              className="bg-blue-50 text-blue-600 border-blue-200"
                            >
                              Upcoming
                            </SelectItem>
                          )}
                          {allowedStatuses.includes("registration") && (
                            <SelectItem
                              value="registration"
                              className="bg-yellow-50 text-yellow-600 border-yellow-200"
                            >
                              Registration
                            </SelectItem>
                          )}
                          {allowedStatuses.includes("ongoing") && (
                            <SelectItem
                              value="ongoing"
                              className="bg-emerald-50 text-emerald-600 border-emerald-200"
                            >
                              Ongoing
                            </SelectItem>
                          )}
                          {allowedStatuses.includes("done") && (
                            <SelectItem
                              value="done"
                              className="bg-slate-100 text-slate-700 border-slate-200"
                            >
                              Done
                            </SelectItem>
                          )}
                          {allowedStatuses.includes("cancelled") && (
                            <SelectItem
                              value="cancelled"
                              className="bg-red-50 text-red-600 border-red-200"
                            >
                              Cancelled
                            </SelectItem>
                          )}
                        </>
                      );
                    })()}
                  </SelectContent>
                </Select>
              </FieldRow>

              <FieldRow
                icon={<Briefcase className="w-3.5 h-3.5" />}
                label="Industry"
                required
              >
                <div className="relative" ref={industryRef}>
                  {/* Trigger */}
                  <button
                    type="button"
                    onClick={() => {
                      setIndustryOpen((v) => !v);
                      setIndustryError(null);
                    }}
                    className="w-full h-10 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1a3fa8]/40"
                  >
                    <span className={selectedIndustry ? "" : "text-slate-400"}>
                      {selectedIndustry?.name ?? "Select industry"}
                    </span>
                    <ChevronsUpDown className="w-4 h-4 text-slate-400 shrink-0" />
                  </button>

                  {/* Inline dropdown */}
                  {industryOpen && (
                    <div className="absolute z-10 bottom-full mb-1 w-full rounded-lg border border-slate-200 bg-white shadow-md">
                      {/* Search / add input */}
                      <div className="p-2 border-b border-slate-100">
                        <Input
                          autoFocus
                          placeholder="Search or type new industry..."
                          value={newIndustryName}
                          onChange={(e) => {
                            setNewIndustryName(e.target.value);
                            setIndustryError(null);
                          }}
                          onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === "Enter") {
                              e.preventDefault();
                              void handleAddIndustry();
                            }
                            if (e.key === "Escape") {
                              setIndustryOpen(false);
                              setNewIndustryName("");
                            }
                          }}
                          className="h-8 text-sm rounded-lg border-slate-200"
                        />
                        {industryError && (
                          <p className="text-xs text-red-500 mt-1">
                            {industryError}
                          </p>
                        )}
                      </div>

                      {/* List */}
                      <ul className="max-h-44 overflow-y-auto py-1">
                        {industries
                          .filter(
                            (i) =>
                              newIndustryName.trim() === "" ||
                              i.name
                                .toLowerCase()
                                .includes(newIndustryName.toLowerCase()),
                          )
                          .map((industry) => (
                            <li
                              key={industry._id}
                              onClick={() => {
                                setSelectedIndustry(industry);
                                setIndustryOpen(false);
                                setNewIndustryName("");
                                setIndustryError(null);
                              }}
                              className="flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer hover:bg-slate-50"
                            >
                              <Check
                                className={`w-4 h-4 shrink-0 ${selectedIndustry?._id === industry._id ? "text-[#1a3fa8]" : "opacity-0"}`}
                              />
                              {industry.name}
                            </li>
                          ))}
                        {/* No match — show Add button */}
                        {newIndustryName.trim() !== "" &&
                          !industries.some(
                            (i) =>
                              i.name.toLowerCase() ===
                              newIndustryName.toLowerCase(),
                          ) && (
                            <li
                              onClick={() => void handleAddIndustry()}
                              className="flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer hover:bg-slate-50 text-[#1a3fa8] font-semibold"
                            >
                              <Plus className="w-4 h-4 shrink-0" />
                              Add "{newIndustryName.trim()}"
                            </li>
                          )}
                      </ul>
                    </div>
                  )}
                </div>
              </FieldRow>
            </div>

            {/* Description */}
            <FieldRow
              icon={<AlignLeft className="w-3.5 h-3.5" />}
              label="Description"
            >
              <Textarea
                id="event-description"
                name="eventDescription"
                defaultValue={defaultData?.description}
                placeholder="Enter event description"
                onKeyDown={(e) => e.stopPropagation()}
                className="min-h-[88px] rounded-lg border-slate-200 bg-slate-50 placeholder:text-slate-300 text-sm text-slate-700 focus-visible:ring-1 focus-visible:ring-[#1a3fa8]/40 focus-visible:border-[#1a3fa8]/50 resize-none p-3"
              />
            </FieldRow>
          </div>

          {/* Footer */}
          <DialogFooter className="bg-slate-50 border-t border-slate-100 px-7 pt-4 pb-7 flex flex-row justify-end gap-2">
            <DialogClose asChild>
              <Button
                type="button"
                variant="ghost"
                className="h-9 px-4 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/70 text-sm font-medium"
              >
                Discard
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={submitting}
              className="h-9 px-5 rounded-lg bg-[#1a3fa8] hover:bg-[#153289] text-white text-sm font-semibold shadow-sm disabled:opacity-60"
            >
              {submitting
                ? "Saving..."
                : isEdit
                  ? "Save Changes"
                  : "Publish Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ---- Helper sub-component ---- */
function FieldRow({
  icon,
  label,
  required,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
        <span className="text-[#1a3fa8]/70">{icon}</span>
        {label}
        {required && (
          <span className="text-rose-400 text-[10px] leading-none">*</span>
        )}
      </Label>
      {children}
    </div>
  );
}
