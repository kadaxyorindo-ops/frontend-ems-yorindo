import {
  useDeferredValue,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "react-router-dom";
import {
  Mail,
  Search,
  SendHorizontal,
  Users2,
} from "lucide-react";
import { TiptapEmailEditor } from "@/components/communication/TiptapEmailEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { api } from "@/services/api";

type FilterOption = {
  id: string;
  label: string;
};

type CommunicationAudienceResponse = {
  events: Array<{
    id: string;
    title: string;
    eventDate: string;
    status: string;
  }>;
  recipients: Array<{
    registrationId: string;
    participantId: string;
    eventId: string;
    eventTitle: string;
    eventDate: string;
    fullName: string;
    email: string;
    participantType: string;
    status: string;
    companyName: string | null;
    industryName: string | null;
    jobTitleName: string | null;
    cityName: string | null;
    sourceChannelCode: string | null;
  }>;
  filterOptions: {
    companies: FilterOption[];
    industries: FilterOption[];
    jobTitles: FilterOption[];
    cities: FilterOption[];
    sourceChannels: string[];
  };
  summary: {
    totalRecipients: number;
    statusCounts: Record<string, number>;
  };
};

type CampaignResponse = {
  id: string;
  status: string;
  recipientCount: number;
  message: string;
  delivery: {
    successCount: number;
    failureCount: number;
    failures: Array<{
      email: string;
      reason: string;
    }>;
  };
};

type EmailEditorValue = {
  html: string;
  json: Record<string, unknown> | null;
  text: string;
};

const STATUS_OPTIONS = [
  { value: "all", label: "All Registered" },
  { value: "approved", label: "Approved" },
  { value: "pending", label: "Pending" },
  { value: "rejected", label: "Rejected" },
  { value: "checked_in", label: "Checked-In" },
] as const;

const PARTICIPANT_TYPE_OPTIONS = [
  { value: "all", label: "All Roles" },
  { value: "participant", label: "Visitor" },
  { value: "exhibitor", label: "Exhibitor" },
] as const;

type StatusValue = (typeof STATUS_OPTIONS)[number]["value"];
type ParticipantTypeValue = (typeof PARTICIPANT_TYPE_OPTIONS)[number]["value"];

type AudienceFiltersState = {
  eventId: string;
  status: StatusValue;
  participantType: ParticipantTypeValue;
  companyId: string;
  industryId: string;
  jobTitleId: string;
  cityId: string;
  sourceChannelCode: string;
};

type FeedbackState = {
  tone: "success" | "error";
  message: string;
};

type ComposerErrors = Partial<Record<"recipients" | "subject" | "body", string>>;
type LeftPanelTab = "segment" | "recipients" | "review";

function readOptionValue<T extends string>(
  value: string | null,
  options: ReadonlyArray<{ value: T }>,
  fallback: T,
) {
  return options.some((option) => option.value === value) ? (value as T) : fallback;
}

function readLeftPanelTab(value: string | null): LeftPanelTab {
  return value === "recipients" || value === "review" ? value : "segment";
}

function createFiltersFromSearchParams(
  searchParams: URLSearchParams,
): AudienceFiltersState {
  return {
    eventId: searchParams.get("eventId") ?? "",
    status: readOptionValue(searchParams.get("status"), STATUS_OPTIONS, "all"),
    participantType: readOptionValue(
      searchParams.get("participantType"),
      PARTICIPANT_TYPE_OPTIONS,
      "all",
    ),
    companyId: searchParams.get("companyId") ?? "",
    industryId: searchParams.get("industryId") ?? "",
    jobTitleId: searchParams.get("jobTitleId") ?? "",
    cityId: searchParams.get("cityId") ?? "",
    sourceChannelCode: searchParams.get("sourceChannelCode") ?? "",
  };
}

function areFiltersEqual(
  left: AudienceFiltersState,
  right: AudienceFiltersState,
) {
  return (
    left.eventId === right.eventId &&
    left.status === right.status &&
    left.participantType === right.participantType &&
    left.companyId === right.companyId &&
    left.industryId === right.industryId &&
    left.jobTitleId === right.jobTitleId &&
    left.cityId === right.cityId &&
    left.sourceChannelCode === right.sourceChannelCode
  );
}

function buildAudienceQuery(filters: AudienceFiltersState, search: string) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (!value || value === "all") {
      continue;
    }

    params.set(key, value);
  }

  const normalizedSearch = search.trim();

  if (normalizedSearch) {
    params.set("search", normalizedSearch);
  }

  return params.toString();
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatEventDate(value: string) {
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function findOptionLabel(
  options: FilterOption[],
  value: string,
  fallbackLabel: string,
) {
  return options.find((option) => option.id === value)?.label ?? fallbackLabel;
}

function summarizeActiveFilters(
  filters: AudienceFiltersState,
  audience: CommunicationAudienceResponse | null,
  search: string,
) {
  const badges: string[] = [];

  if (filters.status !== "all") {
    badges.push(
      STATUS_OPTIONS.find((option) => option.value === filters.status)?.label ??
        filters.status,
    );
  }

  if (filters.participantType !== "all") {
    badges.push(
      PARTICIPANT_TYPE_OPTIONS.find(
        (option) => option.value === filters.participantType,
      )?.label ?? filters.participantType,
    );
  }

  if (filters.companyId) {
    badges.push(
      `Company: ${findOptionLabel(
        audience?.filterOptions.companies ?? [],
        filters.companyId,
        "Selected",
      )}`,
    );
  }

  if (filters.industryId) {
    badges.push(
      `Industry: ${findOptionLabel(
        audience?.filterOptions.industries ?? [],
        filters.industryId,
        "Selected",
      )}`,
    );
  }

  if (filters.jobTitleId) {
    badges.push(
      `Job Title: ${findOptionLabel(
        audience?.filterOptions.jobTitles ?? [],
        filters.jobTitleId,
        "Selected",
      )}`,
    );
  }

  if (filters.cityId) {
    badges.push(
      `City: ${findOptionLabel(
        audience?.filterOptions.cities ?? [],
        filters.cityId,
        "Selected",
      )}`,
    );
  }

  if (filters.sourceChannelCode) {
    badges.push(`Source: ${filters.sourceChannelCode}`);
  }

  if (search.trim()) {
    badges.push(`Search: "${search.trim()}"`);
  }

  return badges;
}

function validateComposer(params: {
  recipientCount: number;
  subject: string;
  bodyText: string;
}) {
  const nextErrors: ComposerErrors = {};

  if (params.recipientCount === 0) {
    nextErrors.recipients = "Select at least one recipient before sending.";
  }

  if (!params.subject.trim()) {
    nextErrors.subject = "Add a clear subject line before sending.";
  }

  if (!params.bodyText.trim()) {
    nextErrors.body = "Write the message body before sending.";
  }

  return nextErrors;
}

function FilterSelect({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={id}
        className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400"
      >
        {label}
      </Label>
      <select
        id={id}
        name={id}
        value={value}
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-dashed border-slate-300 bg-white px-3 text-sm text-slate-700 transition focus-visible:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Communication() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [leftPanelTab, setLeftPanelTab] = useState<LeftPanelTab>(() =>
    readLeftPanelTab(searchParams.get("panel")),
  );
  const [filters, setFilters] = useState<AudienceFiltersState>(() =>
    createFiltersFromSearchParams(searchParams),
  );
  const [searchInput, setSearchInput] = useState(
    () => searchParams.get("search") ?? "",
  );
  const [audience, setAudience] = useState<CommunicationAudienceResponse | null>(
    null,
  );
  const [selectedRegistrationIds, setSelectedRegistrationIds] = useState<string[]>(
    [],
  );
  const [subject, setSubject] = useState("");
  const [editorValue, setEditorValue] = useState<EmailEditorValue>({
    html: "<p></p>",
    json: null,
    text: "",
  });
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [submissionMode, setSubmissionMode] = useState<"draft" | "send" | null>(
    null,
  );
  const [isReviewingSend, setIsReviewingSend] = useState(false);
  const [composerErrors, setComposerErrors] = useState<ComposerErrors>({});
  const [lastCommittedSignature, setLastCommittedSignature] = useState("");
  const deferredSearch = useDeferredValue(searchInput);
  const latestRequestRef = useRef(0);
  const hasUserAdjustedSelectionRef = useRef(false);
  const subjectInputRef = useRef<HTMLInputElement | null>(null);
  const bodyFieldRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const nextFilters = createFiltersFromSearchParams(searchParams);
    const nextSearch = searchParams.get("search") ?? "";
    const nextPanel = readLeftPanelTab(searchParams.get("panel"));

    setFilters((currentValue) =>
      areFiltersEqual(currentValue, nextFilters) ? currentValue : nextFilters,
    );
    setSearchInput((currentValue) =>
      currentValue === nextSearch ? currentValue : nextSearch,
    );
    setLeftPanelTab((currentValue) =>
      currentValue === nextPanel ? currentValue : nextPanel,
    );
  }, [searchParams]);

  useEffect(() => {
    const nextParams = new URLSearchParams();

    if (filters.eventId) {
      nextParams.set("eventId", filters.eventId);
    }

    if (filters.status !== "all") {
      nextParams.set("status", filters.status);
    }

    if (filters.participantType !== "all") {
      nextParams.set("participantType", filters.participantType);
    }

    if (filters.companyId) {
      nextParams.set("companyId", filters.companyId);
    }

    if (filters.industryId) {
      nextParams.set("industryId", filters.industryId);
    }

    if (filters.jobTitleId) {
      nextParams.set("jobTitleId", filters.jobTitleId);
    }

    if (filters.cityId) {
      nextParams.set("cityId", filters.cityId);
    }

    if (filters.sourceChannelCode) {
      nextParams.set("sourceChannelCode", filters.sourceChannelCode);
    }

    const normalizedSearch = deferredSearch.trim();

    if (normalizedSearch) {
      nextParams.set("search", normalizedSearch);
    }

    if (leftPanelTab !== "segment") {
      nextParams.set("panel", leftPanelTab);
    }

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [deferredSearch, filters, leftPanelTab, searchParams, setSearchParams]);

  useEffect(() => {
    const query = buildAudienceQuery(filters, deferredSearch);
    const requestId = latestRequestRef.current + 1;
    latestRequestRef.current = requestId;
    setIsLoading(true);
    setLoadError("");

    void api
      .get<CommunicationAudienceResponse>(
        `/api/communications/audience${query ? `?${query}` : ""}`,
      )
      .then((result) => {
        if (latestRequestRef.current !== requestId) {
          return;
        }

        if (!result.data) {
          setLoadError(result.error ?? "Failed to load communication audience.");
          setAudience(null);
          setIsLoading(false);
          return;
        }

        setAudience(result.data);
        setIsLoading(false);
      });
  }, [deferredSearch, filters]);

  useEffect(() => {
    if (filters.eventId || !audience?.events.length) {
      return;
    }

    setFilters((currentValue) => ({
      ...currentValue,
      eventId: currentValue.eventId || audience.events[0]!.id,
    }));
  }, [audience?.events, filters.eventId]);

  useEffect(() => {
    const visibleRecipientIds =
      audience?.recipients.map((recipient) => recipient.registrationId) ?? [];

    setSelectedRegistrationIds((currentValue) => {
      if (visibleRecipientIds.length === 0) {
        return [];
      }

      const visibleIdSet = new Set(visibleRecipientIds);
      const preservedSelection = currentValue.filter((value) =>
        visibleIdSet.has(value),
      );

      if (preservedSelection.length > 0 || hasUserAdjustedSelectionRef.current) {
        return preservedSelection;
      }

      return visibleRecipientIds;
    });
  }, [audience?.recipients]);

  useEffect(() => {
    if (!isReviewingSend) {
      return;
    }

    setIsReviewingSend(false);
  }, [filters, deferredSearch, selectedRegistrationIds, isReviewingSend]);

  const visibleRecipients = audience?.recipients ?? [];
  const selectedRecipientIdSet = new Set(selectedRegistrationIds);
  const selectedRecipients = visibleRecipients.filter((recipient) =>
    selectedRecipientIdSet.has(recipient.registrationId),
  );
  const currentEvent =
    audience?.events.find((event) => event.id === filters.eventId) ?? null;
  const activeFilterBadges = summarizeActiveFilters(
    filters,
    audience,
    deferredSearch,
  );
  const allVisibleSelected =
    visibleRecipients.length > 0 &&
    visibleRecipients.length === selectedRecipients.length;
  const selectedNonApprovedCount = selectedRecipients.filter(
    (recipient) => recipient.status !== "approved",
  ).length;
  const hasComposeContent =
    Boolean(subject.trim()) ||
    Boolean(editorValue.text.trim()) ||
    selectedRecipients.length > 0;
  const draftSignature = JSON.stringify({
    filters,
    search: deferredSearch.trim(),
    selectedRegistrationIds: selectedRegistrationIds.toSorted(),
    subject: subject.trim(),
    bodyHtml: editorValue.html.trim(),
  });
  const hasUnsavedChanges =
    hasComposeContent && draftSignature !== lastCommittedSignature;

  useEffect(() => {
    if (!hasUnsavedChanges) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  const updateFilter = <K extends keyof AudienceFiltersState>(
    key: K,
    value: AudienceFiltersState[K],
  ) => {
    setFilters((currentValue) => ({
      ...currentValue,
      [key]: value,
    }));
    setFeedback(null);
  };

  const handleToggleRecipient = (registrationId: string) => {
    hasUserAdjustedSelectionRef.current = true;
    setComposerErrors((currentValue) => ({
      ...currentValue,
      recipients: undefined,
    }));
    setFeedback(null);
    setSelectedRegistrationIds((currentValue) =>
      currentValue.includes(registrationId)
        ? currentValue.filter((item) => item !== registrationId)
        : [...currentValue, registrationId],
    );
  };

  const handleToggleAllVisible = () => {
    if (!visibleRecipients.length) {
      return;
    }

    hasUserAdjustedSelectionRef.current = true;
    setComposerErrors((currentValue) => ({
      ...currentValue,
      recipients: undefined,
    }));
    setFeedback(null);
    setSelectedRegistrationIds(
      allVisibleSelected
        ? []
        : visibleRecipients.map((recipient) => recipient.registrationId),
    );
  };

  const handleOpenReview = () => {
    const nextErrors = validateComposer({
      recipientCount: selectedRecipients.length,
      subject,
      bodyText: editorValue.text,
    });

    setComposerErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setFeedback({
        tone: "error",
        message: "Complete the recipients, subject, and message body first.",
      });

      if (nextErrors.subject) {
        subjectInputRef.current?.focus();
        return;
      }

      if (nextErrors.body) {
        bodyFieldRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }

      return;
    }

    setFeedback(null);
    setLeftPanelTab("review");
    setIsReviewingSend(true);
  };

  const handleSubmitCampaign = async (mode: "draft" | "send") => {
    const signatureAtSubmit = draftSignature;

    setSubmissionMode(mode);
    setFeedback(null);

    const result = await api.post<CampaignResponse>(
      "/api/communications/campaigns",
      {
        mode,
        eventId: filters.eventId || null,
        subject,
        bodyHtml: editorValue.html,
        bodyText: editorValue.text,
        bodyJson: editorValue.json,
        filters: {
          ...filters,
          search: deferredSearch,
        },
        recipientRegistrationIds: selectedRegistrationIds,
      },
    );

    setSubmissionMode(null);

    if (result.error) {
      setFeedback({
        tone: "error",
        message: result.error,
      });
      return;
    }

    setFeedback({
      tone: "success",
      message: result.message,
    });
    setLastCommittedSignature(signatureAtSubmit);

    if (mode === "send") {
      setIsReviewingSend(false);
    }
  };

  const selectedRecipientPreview = selectedRecipients.slice(0, 5);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 border-b border-dashed border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-pretty text-3xl font-bold text-[#1d376b]">
              Communication Hub
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-500">
              Build the audience on the left, compose the email on the right, then
              review everything once before sending.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-dashed border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
            <Users2 className="h-4 w-4" aria-hidden="true" />
            <span className="tabular-nums">
              {audience?.summary.totalRecipients ?? 0} eligible recipients
            </span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(320px,360px)_minmax(0,1fr)] lg:items-start">
          <section className="self-start rounded-[28px] border border-dashed border-slate-300 bg-slate-50/80 p-5 sm:p-6">
            <div className="space-y-1">
              <p className="text-sm font-bold text-[#1d376b]">Audience Builder</p>
              <p className="text-sm text-slate-500">
                Narrow the target audience, then choose who should receive the
                message.
              </p>
            </div>

            <div className="mt-5 space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    Visible Now
                  </p>
                  <p className="mt-2 text-2xl font-bold text-[#1d376b] tabular-nums">
                    {visibleRecipients.length}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Recipients match the current audience filters.
                  </p>
                </div>
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    Selected
                  </p>
                  <p className="mt-2 text-2xl font-bold text-[#1d376b] tabular-nums">
                    {selectedRecipients.length}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    These recipients will be included in the draft or send review.
                  </p>
                </div>
              </div>

              <Tabs
                value={leftPanelTab}
                onValueChange={(value) => setLeftPanelTab(value as LeftPanelTab)}
                className="space-y-4"
              >
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="segment">Segment</TabsTrigger>
                  <TabsTrigger value="recipients">Recipients</TabsTrigger>
                  <TabsTrigger value="review">Review</TabsTrigger>
                </TabsList>

                <TabsContent value="segment" className="space-y-4">
                  <p className="text-xs leading-5 text-slate-500">
                    Adjust segment filters here. Open the `Recipients` tab when you
                    want to focus on who will actually receive the email.
                  </p>

                  <FilterSelect
                    id="communication-event"
                    label="Event"
                    value={filters.eventId}
                    options={[
                      { value: "", label: "Choose event" },
                      ...(audience?.events.map((event) => ({
                        value: event.id,
                        label: `${event.title} · ${formatEventDate(event.eventDate)}`,
                      })) ?? []),
                    ]}
                    onChange={(value) => updateFilter("eventId", value)}
                  />

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="communication-search"
                      className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400"
                    >
                      Search
                    </Label>
                    <div className="relative">
                      <Search
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                        aria-hidden="true"
                      />
                      <Input
                        id="communication-search"
                        name="search"
                        type="search"
                        value={searchInput}
                        autoComplete="off"
                        placeholder="Cari nama, email, company…"
                        onChange={(event) => {
                          setSearchInput(event.target.value);
                          setFeedback(null);
                        }}
                        className="h-11 border-dashed bg-white pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                      Registration Status
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {STATUS_OPTIONS.map((status) => {
                        const isActive = filters.status === status.value;
                        const count = audience?.summary.statusCounts[status.value] ?? 0;

                        return (
                          <button
                            key={status.value}
                            type="button"
                            onClick={() => updateFilter("status", status.value)}
                            className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                              isActive
                                ? "border-[#1d376b] bg-[#1d376b] text-white"
                                : "border-dashed border-slate-300 bg-white text-slate-600 hover:border-slate-400"
                            } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d376b]/20`}
                          >
                            <p className="font-semibold">{status.label}</p>
                            <p
                              className={`mt-1 text-xs tabular-nums ${
                                isActive ? "text-slate-200" : "text-slate-400"
                              }`}
                            >
                              {count} recipients
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <FilterSelect
                    id="communication-participant-type"
                    label="Participant Type"
                    value={filters.participantType}
                    options={PARTICIPANT_TYPE_OPTIONS.map((option) => ({
                      value: option.value,
                      label: option.label,
                    }))}
                    onChange={(value) =>
                      updateFilter("participantType", value as ParticipantTypeValue)
                    }
                  />

                  <FilterSelect
                    id="communication-company"
                    label="Company"
                    value={filters.companyId}
                    options={[
                      { value: "", label: "All companies" },
                      ...(audience?.filterOptions.companies.map((company) => ({
                        value: company.id,
                        label: company.label,
                      })) ?? []),
                    ]}
                    onChange={(value) => updateFilter("companyId", value)}
                  />

                  <FilterSelect
                    id="communication-industry"
                    label="Industry"
                    value={filters.industryId}
                    options={[
                      { value: "", label: "All industries" },
                      ...(audience?.filterOptions.industries.map((industry) => ({
                        value: industry.id,
                        label: industry.label,
                      })) ?? []),
                    ]}
                    onChange={(value) => updateFilter("industryId", value)}
                  />

                  <FilterSelect
                    id="communication-job-title"
                    label="Job Title"
                    value={filters.jobTitleId}
                    options={[
                      { value: "", label: "All job titles" },
                      ...(audience?.filterOptions.jobTitles.map((jobTitle) => ({
                        value: jobTitle.id,
                        label: jobTitle.label,
                      })) ?? []),
                    ]}
                    onChange={(value) => updateFilter("jobTitleId", value)}
                  />

                  <FilterSelect
                    id="communication-city"
                    label="City"
                    value={filters.cityId}
                    options={[
                      { value: "", label: "All cities" },
                      ...(audience?.filterOptions.cities.map((city) => ({
                        value: city.id,
                        label: city.label,
                      })) ?? []),
                    ]}
                    onChange={(value) => updateFilter("cityId", value)}
                  />

                  <FilterSelect
                    id="communication-source-channel"
                    label="Source Channel"
                    value={filters.sourceChannelCode}
                    options={[
                      { value: "", label: "All sources" },
                      ...(audience?.filterOptions.sourceChannels.map((source) => ({
                        value: source,
                        label: source,
                      })) ?? []),
                    ]}
                    onChange={(value) => updateFilter("sourceChannelCode", value)}
                  />
                </TabsContent>

                <TabsContent value="recipients" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        Visible Audience
                      </p>
                      <p className="text-xs text-slate-500">
                        Review and adjust the final recipient list here.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={handleToggleAllVisible}
                      className="h-auto p-0 text-[#1d376b]"
                    >
                      {allVisibleSelected ? "Clear Selection" : "Select Visible"}
                    </Button>
                  </div>

                  <div className="space-y-3 rounded-[24px] border border-dashed border-slate-300 bg-white/60 p-3">
                    <div className="max-h-[30rem] space-y-3 overflow-y-auto pr-1 [contain-intrinsic-size:640px] [content-visibility:auto]">
                      {isLoading ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-400">
                          Loading audience…
                        </div>
                      ) : loadError ? (
                        <div
                          role="alert"
                          className="rounded-2xl border border-dashed border-rose-300 bg-rose-50 px-4 py-4 text-sm text-rose-600"
                        >
                          {loadError}
                        </div>
                      ) : visibleRecipients.length ? (
                        visibleRecipients.map((recipient) => {
                          const isChecked = selectedRecipientIdSet.has(
                            recipient.registrationId,
                          );

                          return (
                            <label
                              key={recipient.registrationId}
                              className="flex cursor-pointer items-start gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-3 py-3 transition hover:border-slate-400 has-[:focus-visible]:border-[#1d376b] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#1d376b]/10"
                            >
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-200 font-bold text-slate-700">
                                {getInitials(recipient.fullName)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-slate-800">
                                      {recipient.fullName}
                                    </p>
                                    <p className="truncate text-xs text-slate-500">
                                      {recipient.email}
                                    </p>
                                  </div>
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() =>
                                      handleToggleRecipient(recipient.registrationId)
                                    }
                                    className="mt-1 h-4 w-4 rounded border-slate-300 text-[#1d376b] focus-visible:ring-2 focus-visible:ring-[#1d376b]/30"
                                  />
                                </div>
                                <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                                  <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-600">
                                    {recipient.status}
                                  </span>
                                  <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-500">
                                    {recipient.companyName ?? recipient.participantType}
                                  </span>
                                </div>
                              </div>
                            </label>
                          );
                        })
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-400">
                          No recipients match the current filters.
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="review" className="space-y-4">
                  <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                      Current Event
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-800">
                      {currentEvent?.title ?? "All events"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {currentEvent
                        ? formatEventDate(currentEvent.eventDate)
                        : "No specific event selected."}
                    </p>
                  </div>

                  <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                      Active Filters
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {activeFilterBadges.length ? (
                        activeFilterBadges.map((badge) => (
                          <span
                            key={badge}
                            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                          >
                            {badge}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-500">
                          No extra segment rules beyond the current event.
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                          Selected Recipients
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-800">
                          {selectedRecipients.length} selected for delivery
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setLeftPanelTab("recipients")}
                        className="border-dashed"
                      >
                        Open List
                      </Button>
                    </div>

                    <div className="mt-3 space-y-2">
                      {selectedRecipientPreview.length ? (
                        selectedRecipientPreview.map((recipient) => (
                          <div
                            key={recipient.registrationId}
                            className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2"
                          >
                            <p className="truncate text-sm font-semibold text-slate-800">
                              {recipient.fullName}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {recipient.email}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">
                          No recipients selected yet.
                        </p>
                      )}

                      {selectedRecipients.length > selectedRecipientPreview.length ? (
                        <p className="text-xs text-slate-500">
                          +{selectedRecipients.length - selectedRecipientPreview.length} more recipients
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="border-t border-dashed border-slate-300 pt-4">
                    <p className="text-sm font-semibold text-slate-700">
                      {visibleRecipients.length} visible recipients
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Filters are synced to the URL so you can refresh or share the
                      same audience segment later.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </section>

          <section className="min-w-0 rounded-[28px] border border-dashed border-slate-300 bg-white">
            <div className="flex flex-col gap-4 border-b border-dashed border-slate-300 px-5 py-5 sm:px-6 sm:py-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  Compose
                </p>
                <h2 className="text-pretty text-2xl font-bold text-[#1d376b]">
                  Draft the Message & Review Before Sending
                </h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                <Mail className="h-4 w-4" aria-hidden="true" />
                <span className="tabular-nums">
                  {selectedRecipients.length} recipients selected
                </span>
              </div>
            </div>

            <div className="flex flex-1 flex-col space-y-6 px-5 py-5 sm:px-6 sm:py-6">
              <div className="grid gap-3 xl:grid-cols-3">
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 xl:min-h-[118px]">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    Event
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    {currentEvent?.title ?? "All events"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {currentEvent
                      ? formatEventDate(currentEvent.eventDate)
                      : "Select an event to narrow the audience."}
                  </p>
                </div>

                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 xl:min-h-[118px]">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    Audience Snapshot
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    {selectedRecipients.length} selected
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {visibleRecipients.length} recipients visible in the current
                    segment.
                  </p>
                </div>

                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 xl:min-h-[118px]">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    Active Filters
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    {activeFilterBadges.length} segment rule
                    {activeFilterBadges.length === 1 ? "" : "s"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Review the audience summary below before sending.
                  </p>
                </div>
              </div>

              {feedback ? (
                <div
                  role="status"
                  aria-live="polite"
                  className={`rounded-2xl border px-4 py-3 text-sm ${
                    feedback.tone === "success"
                      ? "border-dashed border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-dashed border-rose-300 bg-rose-50 text-rose-600"
                  }`}
                >
                  {feedback.message}
                </div>
              ) : null}

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    Recipients
                  </Label>
                  <p className="text-xs text-slate-500">
                    {selectedRecipients.length === 0
                      ? "Select recipients from the left panel."
                      : `${selectedRecipients.length} recipient${
                          selectedRecipients.length === 1 ? "" : "s"
                        } ready for review.`}
                  </p>
                </div>

                <div
                  className={`min-h-[76px] rounded-2xl border px-4 py-3 ${
                    composerErrors.recipients
                      ? "border-dashed border-rose-300 bg-rose-50/60"
                      : "border-dashed border-slate-300 bg-slate-50"
                  }`}
                >
                  <div className="flex flex-wrap gap-2">
                    {selectedRecipients.slice(0, 6).map((recipient) => (
                      <span
                        key={recipient.registrationId}
                        className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800"
                      >
                        {recipient.fullName}
                      </span>
                    ))}

                    {selectedRecipients.length > 6 ? (
                      <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                        +{selectedRecipients.length - 6} more
                      </span>
                    ) : null}

                    {!selectedRecipients.length ? (
                      <span className="text-sm text-slate-400">
                        No recipients selected yet.
                      </span>
                    ) : null}
                  </div>
                </div>

                {composerErrors.recipients ? (
                  <p className="text-sm text-rose-600">
                    {composerErrors.recipients}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="communication-subject"
                  className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400"
                >
                  Subject Line
                </Label>
                <Input
                  ref={subjectInputRef}
                  id="communication-subject"
                  name="subject"
                  value={subject}
                  autoComplete="off"
                  aria-invalid={Boolean(composerErrors.subject)}
                  placeholder="Important: Updates for the upcoming Tech Summit…"
                  onChange={(event) => {
                    setSubject(event.target.value);
                    setComposerErrors((currentValue) => ({
                      ...currentValue,
                      subject: undefined,
                    }));
                    setFeedback(null);
                  }}
                  className="h-12 border-dashed bg-slate-50"
                />
                {composerErrors.subject ? (
                  <p className="text-sm text-rose-600">{composerErrors.subject}</p>
                ) : null}
              </div>

              <div ref={bodyFieldRef} className="space-y-2">
                <Label
                  id="communication-message-body-label"
                  className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400"
                >
                  Message Body
                </Label>
                <div
                  className={
                    composerErrors.body
                      ? "rounded-[22px] border border-dashed border-rose-300"
                      : ""
                  }
                >
                  <TiptapEmailEditor
                    value={editorValue}
                    onChange={(nextValue) => {
                      setEditorValue(nextValue);
                      setComposerErrors((currentValue) => ({
                        ...currentValue,
                        body: undefined,
                      }));
                      setFeedback(null);
                    }}
                    labelId="communication-message-body-label"
                    descriptionId="communication-message-body-help"
                  />
                </div>
                <p
                  id="communication-message-body-help"
                  className="text-xs text-slate-400"
                >
                  The editor stores HTML for delivery and JSON for future draft
                  editing.
                </p>
                {composerErrors.body ? (
                  <p className="text-sm text-rose-600">{composerErrors.body}</p>
                ) : null}
              </div>

              {isReviewingSend ? (
                <div className="rounded-[24px] border border-dashed border-amber-300 bg-amber-50/70 p-5">
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-700">
                      Review & Send
                    </p>
                    <p className="text-sm text-amber-900">
                      Confirm the audience and message details one last time before
                      sending the broadcast.
                    </p>
                  </div>

                  <div className="mt-4 grid gap-3 xl:grid-cols-3">
                    <div className="rounded-2xl border border-dashed border-amber-300 bg-white/80 px-4 py-3 xl:min-h-[118px]">
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-700">
                        Final Audience
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-800">
                        {selectedRecipients.length} recipients
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Only the selected recipients will receive the email.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-dashed border-amber-300 bg-white/80 px-4 py-3 xl:min-h-[118px]">
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-700">
                        Subject
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm font-semibold text-slate-800">
                        {subject}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-dashed border-amber-300 bg-white/80 px-4 py-3 xl:min-h-[118px]">
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-700">
                        Risk Check
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-800">
                        {selectedNonApprovedCount > 0
                          ? `${selectedNonApprovedCount} non-approved recipients included`
                          : "Approved-safe segment"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Review the audience if the segment is broader than expected.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-700">
                      Active Audience Filters
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {activeFilterBadges.length ? (
                        activeFilterBadges.map((badge) => (
                          <span
                            key={badge}
                            className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700"
                          >
                            {badge}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-600">
                          No extra filters applied beyond the current event.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="mt-auto flex flex-col gap-4 border-t border-dashed border-slate-300 pt-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-md space-y-1 text-xs leading-5 text-slate-500">
                  <p>{hasUnsavedChanges ? "Unsaved changes pending." : "All changes saved."}</p>
                  <p>
                    Save a draft anytime, then use Review &amp; Send for the final
                    confirmation step.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  {isReviewingSend ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        disabled={submissionMode !== null}
                        onClick={() => setIsReviewingSend(false)}
                        className="h-12 border-dashed"
                      >
                        Back to Editing
                      </Button>
                      <Button
                        type="button"
                        size="lg"
                        disabled={submissionMode !== null}
                        onClick={() => void handleSubmitCampaign("send")}
                        className="h-12 bg-[#0f2f78] px-6 text-white hover:bg-[#11265c]"
                      >
                        <SendHorizontal className="mr-2 h-4 w-4" aria-hidden="true" />
                        {submissionMode === "send"
                          ? "Sending…"
                          : "Confirm & Send"}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        disabled={submissionMode !== null}
                        onClick={() => void handleSubmitCampaign("draft")}
                        className="h-12 border-dashed"
                      >
                        {submissionMode === "draft" ? "Saving…" : "Save Draft"}
                      </Button>

                      <Button
                        type="button"
                        size="lg"
                        disabled={submissionMode !== null || isLoading}
                        onClick={handleOpenReview}
                        className="h-12 bg-[#0f2f78] px-6 text-white hover:bg-[#11265c]"
                      >
                        <SendHorizontal className="mr-2 h-4 w-4" aria-hidden="true" />
                        Review &amp; Send
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
