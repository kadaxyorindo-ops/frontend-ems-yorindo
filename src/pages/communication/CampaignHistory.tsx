import {
  useDeferredValue,
  useEffect,
  useState,
} from "react";
import {
  Link,
  useSearchParams,
} from "react-router-dom";
import {
  Clock3,
  LoaderCircle,
  Search,
  SendHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import {
  api,
  apiPaths,
} from "@/services/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type CampaignStatus =
  | "all"
  | "draft"
  | "queued"
  | "processing"
  | "sent"
  | "partial"
  | "failed";

type CampaignHistoryResponse = {
  items: CampaignHistoryItem[];
  summary: {
    total: number;
    statusCounts: Record<string, number>;
  };
};

type CampaignHistoryItem = {
  id: string;
  status: Exclude<CampaignStatus, "all">;
  templateId: "executive_brief" | "event_spotlight" | "minimal_notice";
  templateName: string;
  previewText: string | null;
  subject: string;
  recipientCount: number;
  delivery: {
    successCount: number;
    failureCount: number;
    failures: Array<{
      email: string;
      reason: string;
    }>;
  };
  createdAt: string;
  updatedAt: string;
  sentAt: string | null;
  event: {
    id: string | null;
    title: string | null;
    eventDate: string | null;
  };
  createdBy: {
    id: string;
    name: string;
    email: string;
  } | null;
};

const STATUS_OPTIONS: Array<{
  value: CampaignStatus;
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "queued", label: "Queued" },
  { value: "processing", label: "Processing" },
  { value: "sent", label: "Sent" },
  { value: "partial", label: "Partial" },
  { value: "failed", label: "Failed" },
  { value: "draft", label: "Drafts" },
];

function readStatus(value: string | null): CampaignStatus {
  return STATUS_OPTIONS.some((option) => option.value === value)
    ? (value as CampaignStatus)
    : "all";
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "Belum dikirim";
  }

  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatEventDate(value: string | null) {
  if (!value) {
    return "Tanpa tanggal event";
  }

  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStatusBadgeClass(status: CampaignHistoryItem["status"]) {
  switch (status) {
    case "queued":
      return "bg-amber-100 text-amber-800";
    case "processing":
      return "bg-sky-100 text-sky-800";
    case "sent":
      return "bg-emerald-100 text-emerald-800";
    case "partial":
      return "bg-orange-100 text-orange-800";
    case "failed":
      return "bg-rose-100 text-rose-800";
    default:
      return "bg-slate-200 text-slate-700";
  }
}

function getDeliveryLabel(item: CampaignHistoryItem) {
  if (item.status === "draft") {
    return "Belum masuk queue";
  }

  if (item.status === "queued") {
    return "Menunggu worker RabbitMQ";
  }

  if (item.status === "processing") {
    return "Sedang dikirim oleh worker";
  }

  return `${item.delivery.successCount} sukses · ${item.delivery.failureCount} gagal`;
}

export function CampaignHistory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState<CampaignStatus>(() =>
    readStatus(searchParams.get("status")),
  );
  const [searchInput, setSearchInput] = useState(
    () => searchParams.get("search") ?? "",
  );
  const [history, setHistory] = useState<CampaignHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const deferredSearch = useDeferredValue(searchInput);

  useEffect(() => {
    const nextStatus = readStatus(searchParams.get("status"));
    const nextSearch = searchParams.get("search") ?? "";

    setStatus((currentValue) =>
      currentValue === nextStatus ? currentValue : nextStatus,
    );
    setSearchInput((currentValue) =>
      currentValue === nextSearch ? currentValue : nextSearch,
    );
  }, [searchParams]);

  useEffect(() => {
    const nextParams = new URLSearchParams();

    if (status !== "all") {
      nextParams.set("status", status);
    }

    const normalizedSearch = deferredSearch.trim();

    if (normalizedSearch) {
      nextParams.set("search", normalizedSearch);
    }

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [deferredSearch, searchParams, setSearchParams, status]);

  useEffect(() => {
    const params = new URLSearchParams();

    if (status !== "all") {
      params.set("status", status);
    }

    const normalizedSearch = deferredSearch.trim();

    if (normalizedSearch) {
      params.set("search", normalizedSearch);
    }

    setIsLoading(true);
    setError("");

    void api
      .get<CampaignHistoryResponse>(
        `${apiPaths.communications}/campaigns${params.toString() ? `?${params.toString()}` : ""}`,
      )
      .then((result) => {
        if (!result.data) {
          setHistory(null);
          setError(result.error ?? "Failed to load campaign history.");
          setIsLoading(false);
          return;
        }

        setHistory(result.data);
        setError("");
        setIsLoading(false);
      });
  }, [deferredSearch, status]);

  const totalCampaigns = history?.summary.total ?? 0;
  const queuedCount =
    (history?.summary.statusCounts.queued ?? 0) +
    (history?.summary.statusCounts.processing ?? 0);
  const deliveredCount =
    (history?.summary.statusCounts.sent ?? 0) +
    (history?.summary.statusCounts.partial ?? 0);
  const failedCount = history?.summary.statusCounts.failed ?? 0;
  const draftCount = history?.summary.statusCounts.draft ?? 0;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 border-b border-dashed border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">
              Communication Ops
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-[#001a4e]">
              Campaign History
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-500">
              Monitor every draft, queue, and delivery result after the broadcast
              leaves the composer.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              size="lg"
              asChild
              className="h-11 border border-sm border-grey-100"
            >
              <Link to="/communication">Back to Composer</Link>
            </Button>
            <Button
              type="button"
              size="lg"
              asChild
              className="h-11 px-5 text-white border border-sm border-[#002d7a]"
            >
              <Link to="/communication">
                <SendHorizontal className="mr-2 h-4 w-4" aria-hidden="true" />
                New Broadcast
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-4">
          <div className="rounded-[24px] border border-slate-300 bg-slate-50 px-5 py-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Total
            </p>
            <p className="mt-2 text-3xl font-bold text-[#1d376b] tabular-nums">
              {totalCampaigns}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Campaign records matching the current filter.
            </p>
          </div>

          <div className="rounded-[24px] border border-amber-300 bg-amber-50/70 px-5 py-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-700">
              Active Queue
            </p>
            <p className="mt-2 text-3xl font-bold text-amber-900 tabular-nums">
              {queuedCount}
            </p>
            <p className="mt-1 text-xs text-amber-700/80">
              Queued or currently being processed by RabbitMQ workers.
            </p>
          </div>

          <div className="rounded-[24px] border border-[#72a688]/50 bg-emerald-50/70 px-5 py-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700">
              Delivered
            </p>
            <p className="mt-2 text-3xl font-bold text-emerald-900 tabular-nums">
              {deliveredCount}
            </p>
            <p className="mt-1 text-xs text-emerald-700/80">
              Campaigns that finished with full or partial delivery.
            </p>
          </div>

          <div className="rounded-[24px] border border-rose-300 bg-rose-50/70 px-5 py-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-rose-700">
              Failed / Draft
            </p>
            <p className="mt-2 text-3xl font-bold text-rose-900 tabular-nums">
              {failedCount + draftCount}
            </p>
            <p className="mt-1 text-xs text-rose-700/80">
              Failed sends plus drafts that still need manual action.
            </p>
          </div>
        </div>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((option) => {
                const isActive = status === option.value;
                const count =
                  option.value === "all"
                    ? history?.summary.total ?? 0
                    : history?.summary.statusCounts[option.value] ?? 0;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStatus(option.value)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                      isActive
                        ? "border-[#1d376b] bg-[#1d376b] text-white"
                        : "border-slate-300 bg-slate-50 text-slate-600 hover:border-slate-400"
                    } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d376b]/20`}
                  >
                    {option.label}{" "}
                    <span className={isActive ? "text-slate-200" : "text-slate-400"}>
                      ({count})
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="relative w-full lg:max-w-sm">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <Input
                type="search"
                name="campaign-history-search"
                value={searchInput}
                autoComplete="off"
                placeholder="Search subject, event, creator…"
                onChange={(event) => setSearchInput(event.target.value)}
                className="h-11 pl-10 bg-background border-slate-200 rounded-xl focus-visible:ring-1 focus-visible:ring-indigo-400 transition-all"
              />
            </div>
          </div>

          {draftCount > 0 ? (
            <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {draftCount} draft masih aktif. Draft bisa dibuka lagi dari composer
              atau langsung dari tabel di bawah.
            </div>
          ) : null}

          {error ? (
            <div
              role="alert"
              className="mt-5 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-4 text-sm text-rose-600"
            >
              {error}
            </div>
          ) : null}

          <div className="mt-5 overflow-hidden rounded-[24px] border border-slate-300">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="hover:bg-slate-50">
                  <TableHead className="w-[100px] px-6 text-center">Status</TableHead>
                  <TableHead className="px-4">Campaign</TableHead>
                  <TableHead className="px-4">Event</TableHead>
                  <TableHead className="px-4">Delivery</TableHead>
                  <TableHead className="px-4">Updated</TableHead>
                  <TableHead className="text-center px-6">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow className="hover:bg-white ">
                    <TableCell colSpan={6} className="h-48 text-center ">
                      <div className="flex items-center justify-center gap-3 text-sm text-slate-500">
                        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                        Loading campaign history…
                      </div>
                    </TableCell>
                  </TableRow>
                ) : history?.items.length ? (
                  history.items.map((item) => (
                    <TableRow key={item.id} className="align-top">
                      <TableCell className="min-w-[6rem] px-7">
                        <div className="space-y-2">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                              item.status,
                            )}`}
                          >
                            {item.status}
                          </span>
                          <p className="text-xs text-slate-500">
                            {item.recipientCount} recipient
                            {item.recipientCount === 1 ? "" : "s"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[18rem] px-4">
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-800">
                            {item.subject || "Untitled campaign"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {item.templateName}
                            {item.previewText ? ` · ${item.previewText}` : ""}
                          </p>
                          <p className="text-xs text-slate-400">
                            by {item.createdBy?.name ?? "Unknown user"}
                            {item.createdBy?.email ? ` · ${item.createdBy.email}` : ""}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[12rem] px-4">
                        <div className="space-y-1">
                          <p className="font-medium text-slate-700">
                            {item.event.title ?? "All events"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatEventDate(item.event.eventDate)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[12rem] px-4">
                        <div className="space-y-1">
                          <p className="font-medium text-slate-700">
                            {getDeliveryLabel(item)}
                          </p>
                          <p className="text-xs text-slate-500">
                            Sent: {formatDateTime(item.sentAt)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[13rem] px-4">
                        <div className="space-y-1">
                          <p className="font-medium text-slate-700">
                            {formatDateTime(item.updatedAt)}
                          </p>
                          <p className="text-xs text-slate-500">
                            Created: {formatDateTime(item.createdAt)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right min-w-[3rem] px-6">
                        {item.status === "draft" ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            asChild
                            className="border-dashed"
                          >
                            <Link to="/communication" state={{ draftId: item.id }}>
                              Open Draft
                            </Link>
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            asChild
                            className="border-dashed"
                          >
                            <Link to="/communication">New Message</Link>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="hover:bg-white">
                    <TableCell colSpan={6} className="h-48 text-center">
                      <div className="space-y-3 text-sm text-slate-500">
                        <div className="inline-flex items-center gap-2 rounded-full border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                          <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                          No campaign activity yet
                        </div>
                        <p>
                          Kirim campaign pertama dari composer agar queue dan
                          delivery activity muncul di sini.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
