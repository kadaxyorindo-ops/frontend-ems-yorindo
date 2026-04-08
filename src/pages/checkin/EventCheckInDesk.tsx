import {
  startTransition,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  LoaderCircle,
  QrCode,
  RotateCcw,
  Search,
  ShieldAlert,
  Ticket,
  UserCheck,
  XCircle,
} from "lucide-react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getCheckInStats,
  getRecentCheckIns,
  lookupCheckInCandidates,
  manualCheckIn,
  scanCheckIn,
  type CheckInActionResult,
  type CheckInDeskStats,
  type CheckInRecentItem,
  type CheckInRegistrationItem,
} from "@/services/checkInService";

type ScannerState = "idle" | "starting" | "running" | "error";

type ScanFeedback = {
  tone: "success" | "warning" | "error";
  title: string;
  description: string;
  registration: CheckInRegistrationItem | null;
};

type Html5QrCodeModule = typeof import("html5-qrcode");
type Html5QrCodeInstance = import("html5-qrcode").Html5Qrcode;
type Html5QrCodeScannerState = import("html5-qrcode").Html5QrcodeScannerState;

const SCANNER_REGION_ID = "event-checkin-scanner-region";
const WORKSPACE_MODES = ["scanner", "manual"] as const;

type WorkspaceMode = (typeof WORKSPACE_MODES)[number];

const feedbackStyles: Record<ScanFeedback["tone"], string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  error: "border-rose-200 bg-rose-50 text-rose-900",
};

const badgeStyles: Record<string, string> = {
  approved: "border-blue-200 bg-blue-50 text-blue-700",
  checked_in: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

function formatEventDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCheckInTime(value: string | null) {
  if (!value) {
    return "Not checked in yet";
  }

  return new Date(value).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDisplayEmail(item: CheckInRegistrationItem | CheckInRecentItem) {
  return (
    item.participant.personalEmail ??
    item.participant.companyEmail ??
    "No email"
  );
}

export function EventCheckInDesk() {
  const { eventId = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [stats, setStats] = useState<CheckInDeskStats | null>(null);
  const [recentItems, setRecentItems] = useState<CheckInRecentItem[]>([]);
  const [lookupQuery, setLookupQuery] = useState("");
  const [lookupItems, setLookupItems] = useState<CheckInRegistrationItem[]>([]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [scannerState, setScannerState] = useState<ScannerState>("idle");
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<ScanFeedback | null>(null);
  const [manualNotes, setManualNotes] = useState("");
  const [pendingManualId, setPendingManualId] = useState<string | null>(null);
  const [scanSubmitting, setScanSubmitting] = useState(false);

  const scannerRef = useRef<Html5QrCodeInstance | null>(null);
  const scanLockRef = useRef(false);
  const lastScanRef = useRef<{ value: string; timestamp: number } | null>(null);

  const effectiveLookupQuery = useDeferredValue(lookupQuery);
  const workspaceMode =
    WORKSPACE_MODES.find((mode) => mode === searchParams.get("mode")) ??
    "scanner";

  const selectedEventTitle = stats?.event.title ?? "Check-In Desk";

  const canUseCamera = useMemo(() => {
    if (typeof window === "undefined") {
      return false;
    }

    if ("isSecureContext" in window && !window.isSecureContext) {
      return (
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
      );
    }

    return true;
  }, []);

  const updateWorkspaceMode = (mode: WorkspaceMode) => {
    setSearchParams(
      (currentParams) => {
        const nextParams = new URLSearchParams(currentParams);

        if (mode === "scanner") {
          nextParams.delete("mode");
        } else {
          nextParams.set("mode", mode);
        }

        return nextParams;
      },
      { replace: true },
    );
  };

  async function destroyScanner(scanner: Html5QrCodeInstance | null) {
    if (!scanner) {
      return;
    }

    try {
      const state = scanner.getState() as Html5QrCodeScannerState;

      if (state === 2 || state === 3) {
        await scanner.stop();
      }
    } catch {
      // Ignore stop errors during teardown. We only need to avoid crashing React.
    }

    try {
      scanner.clear();
    } catch {
      // Ignore clear errors if the DOM was already altered by the scanner library.
    }

    if (scannerRef.current === scanner) {
      scannerRef.current = null;
    }
  }

  const loadDeskData = useEffectEvent(async () => {
    if (!eventId) {
      return;
    }

    setDashboardLoading(true);
    const [statsResult, recentResult] = await Promise.all([
      getCheckInStats(eventId),
      getRecentCheckIns(eventId, 50),
    ]);

    startTransition(() => {
      if (statsResult.data) {
        setStats(statsResult.data);
      }

      if (recentResult.data) {
        setRecentItems(recentResult.data.items);
      }

      if (statsResult.error && !feedback) {
        setFeedback({
          tone: "error",
          title: "Check-in desk unavailable",
          description: statsResult.error,
          registration: null,
        });
      }

      setDashboardLoading(false);
    });
  });

  const applyActionFeedback = useEffectEvent((result: CheckInActionResult) => {
    startTransition(() => {
      setFeedback({
        tone: result.outcome === "checked_in" ? "success" : "warning",
        title:
          result.outcome === "checked_in"
            ? "Check-in recorded"
            : "Participant already checked in",
        description: result.message,
        registration: result.registration,
      });
    });
  });

  const handleScanPayload = useEffectEvent(async (payload: string) => {
    if (!eventId || scanLockRef.current) {
      return;
    }

    const rawValue = payload.trim();
    const now = Date.now();

    if (
      lastScanRef.current &&
      lastScanRef.current.value === rawValue &&
      now - lastScanRef.current.timestamp < 2500
    ) {
      return;
    }

    lastScanRef.current = {
      value: rawValue,
      timestamp: now,
    };

    scanLockRef.current = true;
    setScanSubmitting(true);

    const result = await scanCheckIn(eventId, rawValue);

    startTransition(() => {
      if (result.data) {
        applyActionFeedback(result.data);
      } else {
        setFeedback({
          tone: "error",
          title: "QR scan rejected",
          description: result.error ?? result.message,
          registration: null,
        });
      }
    });

    await loadDeskData();

    scanLockRef.current = false;
    setScanSubmitting(false);
  });

  useEffect(() => {
    void loadDeskData();
  }, [eventId]);

  useEffect(() => {
    if (!eventId) {
      return;
    }

    const query = effectiveLookupQuery.trim();

    if (query.length < 2) {
      setLookupItems([]);
      setLookupLoading(false);
      return;
    }

    let active = true;
    setLookupLoading(true);

    void lookupCheckInCandidates(eventId, query, 8).then((result) => {
      if (!active) {
        return;
      }

      startTransition(() => {
        setLookupItems(result.data?.items ?? []);
        setLookupLoading(false);
      });
    });

    return () => {
      active = false;
    };
  }, [effectiveLookupQuery, eventId]);

  useEffect(() => {
    return () => {
      const activeScanner = scannerRef.current;

      if (!activeScanner) {
        return;
      }

      void destroyScanner(activeScanner);
    };
  }, []);

  useEffect(() => {
    if (workspaceMode === "scanner") {
      return;
    }

    const activeScanner = scannerRef.current;

    if (!activeScanner) {
      return;
    }

    setScannerState("idle");
    void destroyScanner(activeScanner);
  }, [workspaceMode]);

  const handleStartScanner = async () => {
    if (
      !canUseCamera ||
      scannerState === "starting" ||
      scannerState === "running"
    ) {
      return;
    }

    setScannerError(null);
    setScannerState("starting");

    try {
      const qrModule = (await import("html5-qrcode")) as Html5QrCodeModule;
      const { Html5Qrcode } = qrModule;
      const scanner = new Html5Qrcode(SCANNER_REGION_ID);

      scannerRef.current = scanner;

      const config = {
        fps: 15,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const size = Math.floor(minEdge * 0.7);
          return { width: size, height: size };
        },
        rememberLastUsedCamera: true,
      };

      try {
        await scanner.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            void handleScanPayload(decodedText);
          },
          undefined,
        );
      } catch {
        const cameras = await Html5Qrcode.getCameras();

        if (!cameras.length) {
          throw new Error("No camera devices available on this browser.");
        }

        await scanner.start(
          cameras[0].id,
          config,
          (decodedText) => {
            void handleScanPayload(decodedText);
          },
          undefined,
        );
      }

      setScannerState("running");
    } catch (error) {
      setScannerState("error");
      setScannerError(
        error instanceof Error
          ? error.message
          : "Camera gagal dijalankan. Coba gunakan manual lookup.",
      );

      await destroyScanner(scannerRef.current);
    }
  };

  const handleStopScanner = async () => {
    const activeScanner = scannerRef.current;

    if (!activeScanner) {
      setScannerState("idle");
      return;
    }

    try {
      await destroyScanner(activeScanner);
    } catch {
      // Cleanup is best-effort for third-party camera DOM.
    }

    setScannerState("idle");
  };

  const handleManualCheckIn = async (registrationId: string) => {
    if (!eventId) {
      return;
    }

    setPendingManualId(registrationId);
    const result = await manualCheckIn(eventId, registrationId, manualNotes);

    startTransition(() => {
      if (result.data) {
        applyActionFeedback(result.data);
        setManualNotes("");
      } else {
        setFeedback({
          tone: "error",
          title: "Manual check-in failed",
          description: result.error ?? result.message,
          registration: null,
        });
      }
    });

    await loadDeskData();

    if (effectiveLookupQuery.trim().length >= 2) {
      const lookupResult = await lookupCheckInCandidates(
        eventId,
        effectiveLookupQuery,
        8,
      );
      setLookupItems(lookupResult.data?.items ?? []);
    }

    setPendingManualId(null);
  };

  const latestRegistration = feedback?.registration ?? null;
  const approvedCount = stats?.counts.approvedCount ?? 0;
  const checkedInCount = stats?.counts.checkedInCount ?? 0;
  const remainingCount = stats?.counts.remainingCount ?? 0;
  const readyCount = stats?.counts.totalReadyCount ?? 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <section className="rounded-[30px] border border-slate-200 bg-gradient-to-br from-white via-[#f8faff] to-[#eef4ff] p-6 shadow-sm">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-3 min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#7a8fb8]">
                Event Operations
              </p>
              <h1 className="text-balance text-3xl font-bold tracking-tight text-[#001a4e]">
                QR Check-In Desk
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-slate-600">
                Operate arrival check-in from one desk. Use the live scanner for
                the fast lane, then switch to manual lookup only when an
                attendee cannot present a readable QR ticket.
              </p>
            </div>

            <div className="flex w-fit max-w-full flex-nowrap items-center gap-3 overflow-x-auto pb-1 xl:shrink-0">
              <Button
                asChild
                variant="outline"
                className="h-11 shrink-0 rounded-2xl border-slate-200 px-4 whitespace-nowrap"
              >
                <Link to="/events">
                  <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                  Back to Events
                </Link>
              </Button>
              <Button
                asChild
                className="h-11 shrink-0 rounded-2xl bg-[#0f2f78] px-5 text-white whitespace-nowrap hover:bg-[#11265c]"
              >
                <Link
                  to={`/participants?eventId=${eventId}&eventTitle=${encodeURIComponent(selectedEventTitle)}`}
                >
                  <UserCheck className="mr-2 h-4 w-4" aria-hidden="true" />
                  Manage Participants
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
          <section className="min-w-0">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-6">
              <Card className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">
                  Ready Tickets
                </p>
                <p className="mt-3 text-3xl font-bold tabular-nums text-[#001a4e]">
                  {dashboardLoading ? "…" : readyCount}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Approved attendees who can be checked in now.
                </p>
              </Card>
              <Card className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">
                  Checked In
                </p>
                <p className="mt-3 text-3xl font-bold tabular-nums text-[#001a4e]">
                  {dashboardLoading ? "…" : checkedInCount}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Attendance already recorded at this event.
                </p>
              </Card>
              <Card className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">
                  Remaining Today
                </p>
                <p className="mt-3 text-3xl font-bold tabular-nums text-[#001a4e]">
                  {dashboardLoading ? "…" : remainingCount}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Approved attendees who have not arrived yet.
                </p>
              </Card>
              <Card className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">
                  Active Workspace
                </p>
                <p className="mt-3 text-lg font-semibold text-[#001a4e]">
                  {workspaceMode === "scanner"
                    ? "Live Scanner"
                    : "Manual Lookup"}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Switch mode without losing the event context.
                </p>
              </Card>
            </section>

            <Card className="rounded-[30px] border border-slate-200 bg-white p-0 shadow-sm">
              <Tabs
                value={workspaceMode}
                onValueChange={(value) =>
                  updateWorkspaceMode(value === "manual" ? "manual" : "scanner")
                }
                className="gap-0"
              >
                <div className="border-b border-slate-100 px-6 py-5">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-2 min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#7a8fb8]">
                        Desk Workspace
                      </p>
                      <h2 className="text-balance text-2xl font-bold text-[#001a4e]">
                        Choose the fastest way to record attendance
                      </h2>
                      <p className="max-w-2xl text-sm leading-6 text-slate-500">
                        Keep staff in one primary workflow at a time. Scanner is
                        the default lane, while manual lookup handles edge cases
                        without crowding the main camera area.
                      </p>
                    </div>

                    <TabsList className="w-full max-w-[420px] self-start lg:self-auto">
                      <TabsTrigger value="scanner">Live Scanner</TabsTrigger>
                      <TabsTrigger value="manual">Manual Lookup</TabsTrigger>
                    </TabsList>
                  </div>
                </div>

                <TabsContent value="scanner" className="p-6">
                  <div className="space-y-5">
                    <div className="space-y-4">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#7a8fb8]">
                          Fast Lane
                        </p>
                        <h3 className="mt-2 text-xl font-semibold text-[#001a4e]">
                          Scan attendee QR ticket
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          Keep the attendee’s QR code centered in the frame. The
                          desk records attendance instantly after a valid scan.
                        </p>
                      </div>

                      <div className="flex max-w-full flex-nowrap items-center gap-3 overflow-x-auto pb-1">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setFeedback(null);
                            lastScanRef.current = null;
                          }}
                          className="h-11 shrink-0 rounded-2xl border-slate-200 px-4"
                        >
                          <RotateCcw
                            className="mr-2 h-4 w-4"
                            aria-hidden="true"
                          />
                          Clear Result
                        </Button>
                        {scannerState === "running" ? (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => void handleStopScanner()}
                            className="h-11 shrink-0 rounded-2xl border-slate-200 px-4"
                          >
                            <Camera
                              className="mr-2 h-4 w-4"
                              aria-hidden="true"
                            />
                            Stop Camera
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            onClick={() => void handleStartScanner()}
                            disabled={
                              !canUseCamera || scannerState === "starting"
                            }
                            className="h-11 shrink-0 rounded-2xl bg-[#0f2f78] px-5 text-white hover:bg-[#11265c]"
                          >
                            {scannerState === "starting" ? (
                              <LoaderCircle
                                className="mr-2 h-4 w-4 animate-spin"
                                aria-hidden="true"
                              />
                            ) : (
                              <QrCode
                                className="mr-2 h-4 w-4"
                                aria-hidden="true"
                              />
                            )}
                            {scannerState === "starting"
                              ? "Starting Camera…"
                              : "Start Camera"}
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="rounded-[26px] border border-slate-200 bg-[#f8fbff] p-4 shadow-sm">
                      <div className="relative min-h-[560px] overflow-hidden rounded-[24px] border border-dashed border-[#c8d8f2] bg-[radial-gradient(circle_at_top,_rgba(15,47,120,0.08),_transparent_50%),linear-gradient(180deg,_#fbfdff_0%,_#f1f6ff_100%)]">
                        <div id={SCANNER_REGION_ID} className="min-h-[560px]" />
                        {scannerState !== "running" && (
                          <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
                            <div className="mx-auto flex max-w-sm flex-col items-center text-center">
                              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/85 text-[#0f2f78] shadow-sm">
                                <Ticket
                                  className="h-8 w-8"
                                  aria-hidden="true"
                                />
                              </div>
                              <h3 className="mt-5 text-lg font-semibold text-[#001a4e]">
                                {scannerState === "starting"
                                  ? "Preparing camera feed…"
                                  : "Camera is ready when you are"}
                              </h3>
                              <p className="mt-2 text-sm leading-6 text-slate-500">
                                {scannerState === "starting"
                                  ? "Give the browser a moment to attach the selected camera."
                                  : "Start the camera to scan tickets continuously at the venue gate."}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <Card className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#7a8fb8]">
                          Scanner Status
                        </p>
                        <h3 className="mt-3 text-lg font-semibold text-[#001a4e]">
                          {scannerState === "running"
                            ? "Actively scanning"
                            : scannerState === "starting"
                              ? "Preparing camera…"
                              : "Waiting to start"}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          Keep the attendee’s QR email centered inside the
                          camera frame for the fastest result.
                        </p>
                        <div className="mt-4 space-y-2">
                          {!canUseCamera && (
                            <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                              Camera access needs a secure browser context. Use
                              `localhost` or HTTPS, or continue with manual
                              lookup.
                            </p>
                          )}

                          {scannerError && (
                            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                              {scannerError}
                            </p>
                          )}
                        </div>
                      </Card>

                      <Card className="rounded-[24px] border border-dashed border-[#d3dcf2] bg-[#f9fbff] p-5 shadow-sm">
                        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#7a8fb8]">
                          Scan Tips
                        </p>
                        <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                          <li>
                            Hold the QR email about 20-30 cm from the camera.
                          </li>
                          <li>
                            Use manual lookup when an inbox image is dim or
                            broken.
                          </li>
                          <li>
                            Duplicate scans stay safe and will not double-count
                            attendance.
                          </li>
                        </ul>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="manual" className="p-6">
                  <div className="space-y-5">
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                      <div className="rounded-[24px] border border-slate-200 bg-[#f8fbff] p-5 shadow-sm">
                        <Label
                          htmlFor="manual-lookup"
                          className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#7a8fb8]"
                        >
                          Search Approved Attendees
                        </Label>
                        <div className="relative mt-3">
                          <Search
                            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                            aria-hidden="true"
                          />
                          <Input
                            id="manual-lookup"
                            name="manualLookup"
                            value={lookupQuery}
                            onChange={(event) =>
                              setLookupQuery(event.target.value)
                            }
                            placeholder="Search name, email, company, or ticket code…"
                            className="h-12 rounded-2xl border-slate-200 pl-11"
                            autoComplete="off"
                            spellCheck={false}
                          />
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-500">
                          Search by attendee name, email, company, or QR code
                          when the live camera lane is not practical.
                        </p>
                      </div>

                      <div className="rounded-[24px] border border-dashed border-[#d3dcf2] bg-[#f8fbff] p-5 shadow-sm">
                        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#7a8fb8]">
                          Manual Notes
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          Record exceptional cases, such as badge issues or
                          manual identity verification.
                        </p>
                        <div className="mt-4 space-y-2">
                          <Label
                            htmlFor="manual-notes"
                            className="text-sm font-medium text-slate-700"
                          >
                            Check-In Notes
                          </Label>
                          <textarea
                            id="manual-notes"
                            name="manualNotes"
                            value={manualNotes}
                            onChange={(event) =>
                              setManualNotes(event.target.value)
                            }
                            rows={5}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#1a3fa8]/50 focus:ring-2 focus:ring-[#1a3fa8]/15"
                            placeholder="Example: badge printed manually after identity check…"
                            autoComplete="off"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {lookupLoading && (
                        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                          <LoaderCircle
                            className="h-4 w-4 animate-spin"
                            aria-hidden="true"
                          />
                          Looking up eligible attendees…
                        </div>
                      )}

                      {!lookupLoading &&
                        effectiveLookupQuery.trim().length < 2 && (
                          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-5 text-sm text-slate-500">
                            Type at least 2 characters to search approved
                            attendees for this event.
                          </div>
                        )}

                      {!lookupLoading &&
                        effectiveLookupQuery.trim().length >= 2 &&
                        lookupItems.length === 0 && (
                          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-5 text-sm text-slate-500">
                            No approved attendee matched that search. Try a
                            different name, email, company, or ticket code.
                          </div>
                        )}

                      {lookupItems.map((item) => {
                        const isCheckedIn =
                          item.status === "checked_in" ||
                          item.checkIn.isAttended;

                        return (
                          <div
                            key={item._id}
                            className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[minmax(0,1fr)_auto]"
                          >
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-lg font-semibold text-[#001a4e]">
                                  {item.participant.fullName}
                                </p>
                                <span
                                  className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${badgeStyles[item.status] ?? "border-slate-200 bg-slate-50 text-slate-600"}`}
                                >
                                  {item.status === "checked_in"
                                    ? "Checked In"
                                    : "Approved"}
                                </span>
                              </div>
                              <p className="mt-2 text-sm text-slate-500">
                                {getDisplayEmail(item)}
                              </p>
                              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                                {item.companySnapshot?.name && (
                                  <span className="rounded-full bg-slate-100 px-3 py-1">
                                    {item.companySnapshot.name}
                                  </span>
                                )}
                                {item.jobTitleSnapshot?.name && (
                                  <span className="rounded-full bg-slate-100 px-3 py-1">
                                    {item.jobTitleSnapshot.name}
                                  </span>
                                )}
                                {item.ticket?.qrCode && (
                                  <span className="rounded-full bg-slate-100 px-3 py-1">
                                    Ticket {item.ticket.qrCode.slice(0, 8)}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col items-start gap-3 lg:items-end">
                              <div className="text-left lg:text-right">
                                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                                  Current Status
                                </p>
                                <p className="mt-2 text-sm text-slate-600">
                                  {isCheckedIn
                                    ? `Checked in at ${formatCheckInTime(item.checkIn.checkedInAt)}`
                                    : "Ready for manual check-in"}
                                </p>
                              </div>
                              <Button
                                type="button"
                                disabled={
                                  isCheckedIn || pendingManualId === item._id
                                }
                                onClick={() =>
                                  void handleManualCheckIn(item._id)
                                }
                                className="h-11 rounded-2xl bg-[#0f2f78] px-5 text-white hover:bg-[#11265c] disabled:bg-slate-300"
                              >
                                {pendingManualId === item._id ? (
                                  <LoaderCircle
                                    className="mr-2 h-4 w-4 animate-spin"
                                    aria-hidden="true"
                                  />
                                ) : (
                                  <UserCheck
                                    className="mr-2 h-4 w-4"
                                    aria-hidden="true"
                                  />
                                )}
                                {isCheckedIn
                                  ? "Checked In"
                                  : "Record Manual Check-In"}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </section>

          <aside className="space-y-6 xl:sticky xl:top-24 self-start">
            <Card className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#7a8fb8]">
                Event Snapshot
              </p>
              <h2 className="mt-2 break-words text-2xl font-bold text-[#001a4e]">
                {stats?.event.title ?? "Loading event…"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {stats
                  ? `${formatEventDate(stats.event.eventDate)} • ${stats.event.location ?? "Venue TBA"}`
                  : "Preparing event details for this check-in desk."}
              </p>

              <div className="mt-5 grid gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    Approved
                  </p>
                  <p className="mt-2 text-2xl font-bold tabular-nums text-[#001a4e]">
                    {dashboardLoading ? "…" : approvedCount}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    Checked In
                  </p>
                  <p className="mt-2 text-2xl font-bold tabular-nums text-[#001a4e]">
                    {dashboardLoading ? "…" : checkedInCount}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    Remaining
                  </p>
                  <p className="mt-2 text-2xl font-bold tabular-nums text-[#001a4e]">
                    {dashboardLoading ? "…" : remainingCount}
                  </p>
                </div>
              </div>
            </Card>

            <Card
              className={`rounded-[28px] border p-6 shadow-sm ${feedback ? feedbackStyles[feedback.tone] : "border-slate-200 bg-white text-slate-700"}`}
              aria-live="polite"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {feedback?.tone === "success" ? (
                    <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                  ) : feedback?.tone === "warning" ? (
                    <ShieldAlert className="h-5 w-5" aria-hidden="true" />
                  ) : feedback?.tone === "error" ? (
                    <XCircle className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <QrCode className="h-5 w-5" aria-hidden="true" />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] opacity-70">
                    Latest Result
                  </p>
                  <h3 className="mt-2 text-lg font-semibold">
                    {feedback?.title ?? "Ready for the next attendee"}
                  </h3>
                  <p className="mt-2 text-sm leading-6 opacity-90">
                    {feedback?.description ??
                      "Every successful scan or manual action records attendance for this event."}
                  </p>

                  {latestRegistration && (
                    <div className="mt-4 rounded-2xl border border-white/60 bg-white/75 p-4 text-sm shadow-sm">
                      <p className="font-semibold text-[#001a4e]">
                        {latestRegistration.participant.fullName}
                      </p>
                      <p className="mt-1 text-slate-500">
                        {getDisplayEmail(latestRegistration)}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                          {latestRegistration.participantType}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                          {latestRegistration.checkIn.scanMethod.toUpperCase()}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                          {formatCheckInTime(
                            latestRegistration.checkIn.checkedInAt,
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </aside>
        </div>

        <section>
          <Card className="rounded-[30px] border border-slate-200 bg-white p-0 shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#7a8fb8]">
                    Checked-In Table
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-[#001a4e]">
                    Attendance already recorded
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    A scrollable table keeps the page compact even when the
                    event has many checked-in attendees.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600">
                    Showing {recentItems.length} latest records
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 rounded-2xl border-slate-200 px-4"
                    onClick={() => void loadDeskData()}
                    disabled={dashboardLoading || scanSubmitting}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
                    Refresh Table
                  </Button>
                </div>
              </div>
            </div>

            <div className="px-6 py-5">
              {recentItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-5 text-sm text-slate-500">
                  No attendees have checked in for this event yet.
                </div>
              ) : (
                <div className="max-h-[460px] overflow-auto rounded-[24px] border border-slate-200">
                  <Table>
                    <TableHeader className="sticky top-0 bg-slate-50/95 backdrop-blur supports-[backdrop-filter]:bg-slate-50/85">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                          Attendee
                        </TableHead>
                        <TableHead className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                          Email
                        </TableHead>
                        <TableHead className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                          Role
                        </TableHead>
                        <TableHead className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                          Method
                        </TableHead>
                        <TableHead className="text-right text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                          Time
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentItems.map((item) => (
                        <TableRow key={item._id} className="border-slate-100">
                          <TableCell className="min-w-0">
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-[#001a4e]">
                                {item.participant.fullName}
                              </p>
                              <p className="truncate text-xs text-slate-400">
                                {item.jobTitleSnapshot?.name ??
                                  item.companySnapshot?.name ??
                                  "Participant"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[260px]">
                            <div className="truncate text-sm text-slate-600">
                              {getDisplayEmail(item)}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">
                            {item.participantType}
                          </TableCell>
                          <TableCell>
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                              {item.checkIn.scanMethod}
                            </span>
                          </TableCell>
                          <TableCell className="text-right text-sm tabular-nums text-slate-600">
                            {formatCheckInTime(item.checkIn.checkedInAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </Card>
        </section>
      </div>
    </DashboardLayout>
  );
}
