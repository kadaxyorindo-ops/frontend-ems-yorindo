import { useState, useEffect } from "react";
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
  type Industry,
  type CreateEventBody,
} from "@/services/eventService";

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

const VALID_STATUSES = ["draft", "upcoming", "registration", "ongoing", "done", "cancelled"]; 

export function EventDialog({
  mode,
  eventId,
  defaultData,
  onOpen,
  onSuccess,
}: EventDialogProps) {
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

  useEffect(() => {
    if (!open) return;
    void getIndustries().then((result) => {
      if (result.data) setIndustries(result.data);
    });
  }, [open]);

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
          status: VALID_STATUSES.includes(selectedStatus) ? selectedStatus : undefined,
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <button 
            type="button"
            onClick={onOpen}
            className=" flex items-center gap-2 w-full text-left px-2 py-1.5 font-medium hover:bg-slate-100 rounded-sm cursor-pointer">
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
            >
              <Input
                id="event-location"
                name="eventLocation"
                defaultValue={defaultData?.location}
                placeholder="Enter event location"
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
              >
                <Input
                  id="event-date"
                  name="eventDate"
                  type="date"
                  defaultValue={defaultData?.date}
                  required
                  className="h-9 rounded-lg border-slate-200 bg-slate-50 text-sm text-slate-700 focus-visible:ring-1 focus-visible:ring-[#1a3fa8]/40 focus-visible:border-[#1a3fa8]/50"
                />
              </FieldRow>

              <FieldRow icon={<Clock className="w-3.5 h-3.5" />} label="Time">
                <Input
                  id="event-time"
                  name="eventTime"
                  type="time"
                  defaultValue={defaultData?.time}
                  required
                  className="h-9 rounded-lg border-slate-200 bg-slate-50 text-sm text-slate-700 focus-visible:ring-1 focus-visible:ring-[#1a3fa8]/40 focus-visible:border-[#1a3fa8]/50"
                />
              </FieldRow>
            </div>

            {/* Dropdown Row: Status & Industry */}
            <div className="grid grid-cols-2 gap-3">
              <FieldRow icon={<Tag className="w-3.5 h-3.5" />} label="Status">
                <Select
                  name="eventStatus"
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}
                  required
                >
                  <SelectTrigger className="w-full h-9 rounded-lg border-slate-200 bg-slate-50 text-sm foucs:ring-1 focus:ring-[#1a3fa8]/40">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      value="draft"
                      className="bg-slate-50 text-slate-900 border-slate-200"
                    >
                      Draft
                    </SelectItem>

                    <SelectItem
                      value="upcoming"
                      className="bg-blue-50 text-blue-600 border-blue-200"
                    >
                      Upcoming
                    </SelectItem>

                    <SelectItem
                      value="registration"
                      className="bg-yellow-50 text-yellow-600 border-yellow-200"
                    >
                      Registration
                    </SelectItem>

                    <SelectItem
                      value="ongoing"
                      className="bg-emerald-50 text-emerald-600 border-emerald-200"
                    >
                      Ongoing
                    </SelectItem>

                    <SelectItem
                      value="done"
                      className="bg-slate-100 text-slate-700 border-slate-200"
                    >
                      Done
                    </SelectItem>

                    <SelectItem
                      value="cancelled"
                      className="bg-red-50 text-red-600 border-red-200"
                    >
                      Cancelled
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FieldRow>

              <FieldRow
                icon={<Briefcase className="w-3.5 h-3.5" />}
                label="Industry"
              >
                <Select
                  name="eventIndustry"
                  required
                  value={selectedIndustry?._id ?? ""}
                  onValueChange={(val) => {
                    const found = industries.find((i) => i._id === val) ?? null;
                    setSelectedIndustry(found);
                  }}
                >
                  <SelectTrigger className="w-full h-9 rounded-lg border-slate-200 bg-slate-50 text-sm focus:ring-1 focus:ring-[#1a3fa8]/40">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((industry) => (
                      <SelectItem key={industry._id} value={industry._id}>
                        {industry.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                required
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
