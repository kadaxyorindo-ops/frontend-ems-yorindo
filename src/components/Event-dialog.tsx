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
import { Textarea } from "./ui/textarea";
import { CalendarPlus, CalendarDays, Clock, MapPin, AlignLeft, Pencil, Plus } from "lucide-react";

interface EventDialogProps {
  mode: "create" | "edit";
  defaultData?: {
    name: string;
    date: string;
    time: string;
    location: string;
    description: string;
  };
}

export function EventDialog({ mode, defaultData }: EventDialogProps) {
  const isEdit = mode === "edit";

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const data = {
      name: formData.get("eventName"),
      date: formData.get("eventDate"),
      time: formData.get("eventTime"),
      location: formData.get("eventLocation"),
      description: formData.get("eventDescription"),
    };

    console.log(`Action: ${mode.toUpperCase()}`, data);
    alert(`Event ${isEdit ? "updated" : "created"} successfully!`);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {isEdit ? (
          <button className="w-full text-left px-2 py-1.5 text-sm hover:bg-slate-100 rounded-sm cursor-pointer">
            Edit Event
          </button>
        ) : (
          <Button className="bg-[#1a3fa8] hover:bg-[#153289] cursor-pointer gap-1.5 text-sm font-semibold px-4 h-9 rounded-lg shadow-sm">
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
                  {isEdit
                    ? <Pencil className="w-3.5 h-3.5 text-[#1a3fa8]" />
                    : <CalendarPlus className="w-3.5 h-3.5 text-[#1a3fa8]" />
                  }
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
            <FieldRow icon={<CalendarPlus className="w-3.5 h-3.5" />} label="Event Name" required>
              <Input
                id="event-name"
                name="eventName"
                defaultValue={defaultData?.name}
                placeholder="Enter event name"
                required
                className="h-9 rounded-lg border-slate-200 bg-slate-50 placeholder:text-slate-300 text-sm text-slate-700 focus-visible:ring-1 focus-visible:ring-[#1a3fa8]/40 focus-visible:border-[#1a3fa8]/50"
              />
            </FieldRow>

            {/* Date + Time */}
            <div className="grid grid-cols-2 gap-3">
              <FieldRow icon={<CalendarDays className="w-3.5 h-3.5" />} label="Date">
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

            {/* Location */}
            <FieldRow icon={<MapPin className="w-3.5 h-3.5" />} label="Location">
              <Input
                id="event-location"
                name="eventLocation"
                defaultValue={defaultData?.location}
                placeholder="Enter event location"
                required
                className="h-9 rounded-lg border-slate-200 bg-slate-50 placeholder:text-slate-300 text-sm text-slate-700 focus-visible:ring-1 focus-visible:ring-[#1a3fa8]/40 focus-visible:border-[#1a3fa8]/50"
              />
            </FieldRow>

            {/* Description */}
            <FieldRow icon={<AlignLeft className="w-3.5 h-3.5" />} label="Description">
              <Textarea
                id="event-description"
                name="eventDescription"
                defaultValue={defaultData?.description}
                placeholder="Enter event description"
                required
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
              className="h-9 px-5 rounded-lg bg-[#1a3fa8] hover:bg-[#153289] text-white text-sm font-semibold shadow-sm"
            >
              {isEdit ? "Save Changes" : "Publish Event"}
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
        {required && <span className="text-rose-400 text-[10px] leading-none">*</span>}
      </Label>
      {children}
    </div>
  );
}