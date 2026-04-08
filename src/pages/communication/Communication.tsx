import { useDeferredValue, useEffect, useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import {
  LoaderCircle,
  Mail,
  Search,
  SendHorizontal,
  TextQuote,
  Users2,
} from "lucide-react";
import { TiptapEmailEditor } from "@/components/communication/TiptapEmailEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { api, apiPaths } from "@/services/api";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

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

type EmailTemplateId = "executive_brief" | "event_spotlight" | "minimal_notice";

type EmailPreviewResponse = {
  templateId: EmailTemplateId;
  templateName: string;
  previewText: string;
  subject: string;
  html: string;
  text: string;
  from: {
    name: string;
    email: string;
  };
  sampleRecipient: {
    name: string;
    email: string;
  };
  event: {
    id: string | null;
    title: string | null;
    eventDate: string | null;
  };
};

type CommunicationDraftSummary = {
  id: string;
  status: "draft";
  subject: string;
  previewText: string | null;
  templateId: EmailTemplateId;
  updatedAt: string;
  recipientCount: number;
  event: {
    id: string | null;
    title: string | null;
    eventDate: string | null;
  };
};

const EMAIL_TEMPLATE_OPTIONS = [
  {
    value: "executive_brief",
    label: "Executive Brief",
    description:
      "Formal update layout for logistics, approvals, and event ops.",
    accentClass: "from-[#e7efff] to-white",
  },
  {
    value: "event_spotlight",
    label: "Event Spotlight",
    description:
      "Warmer, campaign-style presentation for announcements and invites.",
    accentClass: "from-amber-100 to-white",
  },
  {
    value: "minimal_notice",
    label: "Minimal Notice",
    description:
      "Compact template for direct, low-friction informational blasts.",
    accentClass: "from-slate-200 to-white",
  },
] as const satisfies ReadonlyArray<{
  value: EmailTemplateId;
  label: string;
  description: string;
  accentClass: string;
}>;

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

type CommunicationDraftFiltersPayload = Partial<{
  eventId: string;
  status: StatusValue;
  participantType: ParticipantTypeValue;
  companyId: string;
  industryId: string;
  jobTitleId: string;
  cityId: string;
  sourceChannelCode: string;
  search: string;
}>;

type CommunicationDraftDetail = CommunicationDraftSummary & {
  bodyHtml: string;
  bodyText: string | null;
  bodyJson: Record<string, unknown> | null;
  filters: CommunicationDraftFiltersPayload;
  recipientRegistrationIds: string[];
};

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

type ComposerErrors = Partial<
  Record<"recipients" | "subject" | "body", string>
>;
type ComposerStep = "compose" | "review";
type LeftPanelTab = "segment" | "recipients" | "review";

function readOptionValue<T extends string>(
  value: string | null,
  options: ReadonlyArray<{ value: T }>,
  fallback: T,
) {
  return options.some((option) => option.value === value)
    ? (value as T)
    : fallback;
}

function readLeftPanelTab(value: string | null): LeftPanelTab {
  return value === "recipients" || value === "review" ? value : "segment";
}

function readComposerStep(value: string | null): ComposerStep {
  return value === "review" ? "review" : "compose";
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

function formatDraftUpdatedAt(value: string) {
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function createEmptyEditorValue(): EmailEditorValue {
  return {
    html: "<p></p>",
    json: null,
    text: "",
  };
}

function createFiltersStateFromDraft(
  input: CommunicationDraftFiltersPayload | undefined,
): AudienceFiltersState {
  return {
    eventId: input?.eventId ?? "",
    status:
      input?.status &&
      STATUS_OPTIONS.some((option) => option.value === input.status)
        ? input.status
        : "all",
    participantType:
      input?.participantType &&
      PARTICIPANT_TYPE_OPTIONS.some(
        (option) => option.value === input.participantType,
      )
        ? input.participantType
        : "all",
    companyId: input?.companyId ?? "",
    industryId: input?.industryId ?? "",
    jobTitleId: input?.jobTitleId ?? "",
    cityId: input?.cityId ?? "",
    sourceChannelCode: input?.sourceChannelCode ?? "",
  };
}

function buildDraftSignature(params: {
  filters: AudienceFiltersState;
  search: string;
  selectedRegistrationIds: string[];
  templateId: EmailTemplateId;
  previewText: string;
  subject: string;
  bodyHtml: string;
}) {
  return JSON.stringify({
    filters: params.filters,
    search: params.search.trim(),
    selectedRegistrationIds: params.selectedRegistrationIds.toSorted(),
    templateId: params.templateId,
    previewText: params.previewText.trim(),
    subject: params.subject.trim(),
    bodyHtml: params.bodyHtml.trim(),
  });
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
        className="h-11 w-full rounded-xl border  border-slate-300 bg-white px-3 text-sm text-slate-700 transition focus-visible:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200"
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

const LOCAL_STORAGE_KEY = "pending_email_campaign";

// Helper untuk mengambil data dari local storage
function getLocalDraft() {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  return saved ? JSON.parse(saved) : null;
}

export function Communication() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [composerStep, setComposerStep] = useState<ComposerStep>(() =>
    readComposerStep(searchParams.get("step")),
  );
  const [leftPanelTab, setLeftPanelTab] = useState<LeftPanelTab>(() =>
    readLeftPanelTab(searchParams.get("panel")),
  );
  const [filters, setFilters] = useState<AudienceFiltersState>(() =>
    createFiltersFromSearchParams(searchParams),
  );
  const [searchInput, setSearchInput] = useState(
    () => searchParams.get("search") ?? "",
  );
  const [audience, setAudience] =
    useState<CommunicationAudienceResponse | null>(null);
  const [selectedRegistrationIds, setSelectedRegistrationIds] = useState<
    string[]
  >([]);
  const [templateId, setTemplateId] =
    useState<EmailTemplateId>("executive_brief");
  const [previewText, setPreviewText] = useState("");
  const [subject, setSubject] = useState("");

  const [editorValue, setEditorValue] = useState<EmailEditorValue>(
    createEmptyEditorValue,
  );
  const [emailPreview, setEmailPreview] = useState<EmailPreviewResponse | null>(
    null,
  );
  const [drafts, setDrafts] = useState<CommunicationDraftSummary[]>([]);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [draftsError, setDraftsError] = useState("");
  const [isDraftsLoading, setIsDraftsLoading] = useState(true);
  const [loadingDraftId, setLoadingDraftId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [loadError, setLoadError] = useState("");
  const [previewError, setPreviewError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [submissionMode, setSubmissionMode] = useState<"draft" | "send" | null>(
    null,
  );
  const [composerErrors, setComposerErrors] = useState<ComposerErrors>({});
  const [lastCommittedSignature, setLastCommittedSignature] = useState("");
  const deferredSearch = useDeferredValue(searchInput);
  const latestRequestRef = useRef(0);
  const previewRequestRef = useRef(0);
  const hasUserAdjustedSelectionRef = useRef(false);
  const subjectInputRef = useRef<HTMLInputElement | null>(null);
  const bodyFieldRef = useRef<HTMLDivElement | null>(null);
  const loadedDraftFromNavigationRef = useRef<string | null>(null);
  const normalizedSearchInput = searchInput.trim();
  const draftIdFromNavigation =
    location.state &&
    typeof location.state === "object" &&
    "draftId" in location.state &&
    typeof location.state.draftId === "string"
      ? location.state.draftId
      : null;

  const loadDrafts = async () => {
    setIsDraftsLoading(true);
    setDraftsError("");

    const result = await api.get<CommunicationDraftSummary[]>(
      `${apiPaths.communications}/drafts`,
    );

    if (!result.data) {
      setDrafts([]);
      setDraftsError(result.error ?? "Failed to load saved drafts.");
      setIsDraftsLoading(false);
      return;
    }

    setDrafts(result.data);
    setDraftsError("");
    setIsDraftsLoading(false);
  };

  const handleLoadDraft = async (draftId: string) => {
    setLoadingDraftId(draftId);
    setFeedback(null);

    const result = await api.get<CommunicationDraftDetail>(
      `${apiPaths.communications}/drafts/${draftId}`,
    );

    setLoadingDraftId(null);

    if (!result.data) {
      setFeedback({
        tone: "error",
        message: result.error ?? "Failed to load the selected draft.",
      });
      return;
    }

    const draftFilters = createFiltersStateFromDraft(result.data.filters);
    const draftSearch = result.data.filters.search ?? "";
    const nextEditorValue: EmailEditorValue = {
      html: result.data.bodyHtml || "<p></p>",
      json: result.data.bodyJson ?? null,
      text: result.data.bodyText ?? "",
    };
    const nextSelectedIds = result.data.recipientRegistrationIds;
    const committedSignature = buildDraftSignature({
      filters: draftFilters,
      search: draftSearch,
      selectedRegistrationIds: nextSelectedIds,
      templateId: result.data.templateId,
      previewText: result.data.previewText ?? "",
      subject: result.data.subject,
      bodyHtml: result.data.bodyHtml,
    });

    hasUserAdjustedSelectionRef.current = true;
    setCurrentDraftId(result.data.id);
    setFilters(draftFilters);
    setSearchInput(draftSearch);
    setSelectedRegistrationIds(nextSelectedIds);
    setTemplateId(result.data.templateId);
    setPreviewText(result.data.previewText ?? "");
    setSubject(result.data.subject);
    setEditorValue(nextEditorValue);
    setComposerErrors({});
    setComposerStep("compose");
    setLeftPanelTab("segment");
    setEmailPreview(null);
    setPreviewError("");
    setLastCommittedSignature(committedSignature);
    setFeedback({
      tone: "success",
      message: "Draft loaded. You can continue editing or go to review.",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDetachDraft = () => {
    setCurrentDraftId(null);
    setLastCommittedSignature("");
    setFeedback({
      tone: "success",
      message:
        "The current content is now detached. The next Save Draft will create a new draft copy.",
    });
  };

  useEffect(() => {
    const nextFilters = createFiltersFromSearchParams(searchParams);
    const nextSearch = searchParams.get("search") ?? "";
    const nextPanel = readLeftPanelTab(searchParams.get("panel"));
    const nextStep = readComposerStep(searchParams.get("step"));

    setFilters((currentValue) =>
      areFiltersEqual(currentValue, nextFilters) ? currentValue : nextFilters,
    );

    setSearchInput((currentValue) => {
      // If the URL value is the same as state, do nothing
      if (currentValue === nextSearch) return currentValue;

      // CRITICAL: If the user is currently typing in the search box,
      // do NOT let the URL overwrite the state. This stops the glitch.
      if (document.activeElement?.id === "communication-search") {
        return currentValue;
      }

      return nextSearch;
    });
    // setSearchInput((currentValue) =>
    //   currentValue === nextSearch ? currentValue : nextSearch,
    // );
    setLeftPanelTab((currentValue) =>
      currentValue === nextPanel ? currentValue : nextPanel,
    );
    setComposerStep((currentValue) =>
      currentValue === nextStep ? currentValue : nextStep,
    );
  }, [searchParams]);

  useEffect(() => {
    void loadDrafts();
  }, []);

  useEffect(() => {
    if (
      !draftIdFromNavigation ||
      currentDraftId === draftIdFromNavigation ||
      loadingDraftId === draftIdFromNavigation ||
      loadedDraftFromNavigationRef.current === draftIdFromNavigation
    ) {
      return;
    }

    loadedDraftFromNavigationRef.current = draftIdFromNavigation;
    void handleLoadDraft(draftIdFromNavigation);
  }, [currentDraftId, draftIdFromNavigation, loadingDraftId]);

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

    if (composerStep === "review") {
      nextParams.set("step", "review");
    }

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [
    composerStep,
    deferredSearch,
    filters,
    leftPanelTab,
    searchParams,
    setSearchParams,
  ]);

  useEffect(() => {
    const query = buildAudienceQuery(filters, deferredSearch);
    const requestId = latestRequestRef.current + 1;
    latestRequestRef.current = requestId;
    setIsLoading(true);
    setLoadError("");

    void api
      .get<CommunicationAudienceResponse>(
        `${apiPaths.communications}/audience${query ? `?${query}` : ""}`,
      )
      .then((result) => {
        if (latestRequestRef.current !== requestId) {
          return;
        }

        if (!result.data) {
          setLoadError(
            result.error ?? "Failed to load communication audience.",
          );
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

      if (
        preservedSelection.length > 0 ||
        hasUserAdjustedSelectionRef.current
      ) {
        return preservedSelection;
      }

      return visibleRecipientIds;
    });
  }, [audience?.recipients]);

  const visibleRecipients = audience?.recipients ?? [];
  const selectedRecipientIdSet = new Set(selectedRegistrationIds);
  const selectedRecipients = visibleRecipients.filter((recipient) =>
    selectedRecipientIdSet.has(recipient.registrationId),
  );
  const selectedRecipientCount = selectedRegistrationIds.length;
  const isReviewingSend = composerStep === "review";
  const samplePreviewRecipient = selectedRecipients[0] ?? null;
  const samplePreviewRegistrationId =
    samplePreviewRecipient?.registrationId ?? "";
  const currentEvent =
    audience?.events.find((event) => event.id === filters.eventId) ?? null;
  const activeFilterBadges = summarizeActiveFilters(
    filters,
    audience,
    normalizedSearchInput,
  );
  const allVisibleSelected =
    visibleRecipients.length > 0 &&
    visibleRecipients.length === selectedRecipients.length;
  const selectedNonApprovedCount = selectedRecipients.filter(
    (recipient) => recipient.status !== "approved",
  ).length;
  const hasComposeContent =
    Boolean(subject.trim()) ||
    Boolean(previewText.trim()) ||
    Boolean(editorValue.text.trim()) ||
    selectedRegistrationIds.length > 0;
  const draftSignature = buildDraftSignature({
    filters,
    search: normalizedSearchInput,
    selectedRegistrationIds,
    templateId,
    previewText,
    subject,
    bodyHtml: editorValue.html,
  });
  const hasUnsavedChanges =
    hasComposeContent && draftSignature !== lastCommittedSignature;
  const currentDraftSummary =
    drafts.find((draft) => draft.id === currentDraftId) ?? null;

  useEffect(() => {
    if (composerStep !== "review") {
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [composerStep]);

  useEffect(() => {
    if (!isReviewingSend) {
      setIsPreviewLoading(false);
      return;
    }

    if (
      !samplePreviewRecipient ||
      !subject.trim() ||
      !editorValue.text.trim()
    ) {
      setEmailPreview(null);
      setIsPreviewLoading(false);
      return;
    }

    const requestId = previewRequestRef.current + 1;
    previewRequestRef.current = requestId;
    setIsPreviewLoading(true);
    setPreviewError("");

    void api
      .post<EmailPreviewResponse>(`${apiPaths.communications}/preview`, {
        eventId: filters.eventId || null,
        templateId,
        previewText,
        subject,
        bodyHtml: editorValue.html,
        bodyText: editorValue.text,
        sampleRegistrationId: samplePreviewRegistrationId,
      })
      .then((result) => {
        if (previewRequestRef.current !== requestId) {
          return;
        }

        if (!result.data) {
          setPreviewError(result.error ?? "Failed to generate email preview.");
          setEmailPreview(null);
          setIsPreviewLoading(false);
          return;
        }

        setEmailPreview(result.data);
        setIsPreviewLoading(false);
      });
  }, [
    editorValue.html,
    editorValue.text,
    filters.eventId,
    isReviewingSend,
    previewText,
    samplePreviewRegistrationId,
    subject,
    templateId,
  ]);

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
      recipientCount: selectedRegistrationIds.length,
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
    setEmailPreview(null);
    setPreviewError("");
    setLeftPanelTab("review");
    setComposerStep("review");
  };

  const handleSubmitCampaign = async (mode: "draft" | "send") => {
    if (mode === "send" && (!emailPreview || isPreviewLoading)) {
      setFeedback({
        tone: "error",
        message: "Wait for the inbox preview to finish loading before sending.",
      });
      return;
    }

    const signatureAtSubmit = draftSignature;

    setSubmissionMode(mode);
    setFeedback(null);

    const result = await api.post<CampaignResponse>(
      `${apiPaths.communications}/campaigns`,
      {
        mode,
        draftId: currentDraftId,
        eventId: filters.eventId || null,
        templateId,
        previewText,
        subject,
        bodyHtml: editorValue.html,
        bodyText: editorValue.text,
        bodyJson: editorValue.json,
        filters: {
          ...filters,
          search: normalizedSearchInput,
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

    // Jika sampai di titik ini, artinya API berhasil menyimpan data ke server.
    // Kita bisa menghapus draf sementara di browser karena sudah "aman" di database.
    localStorage.removeItem(LOCAL_STORAGE_KEY);

    setFeedback({
      tone: "success",
      message: result.message,
    });

    setLastCommittedSignature(signatureAtSubmit);
    await loadDrafts();

    if (mode === "draft") {
      setCurrentDraftId(result.data?.id ?? currentDraftId);
      return;
    }

    setCurrentDraftId(null);
    if (mode === "send") {
      setComposerStep("compose");
      setEmailPreview(null);
      setPreviewError("");
    }
  };

  const selectedRecipientPreview = selectedRecipients.slice(0, 5);

  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [localDraftData, setLocalDraftData] = useState<any>(null);

  useEffect(() => {
    // Jangan simpan jika sedang loading draft dari server atau sedang review
    if (loadingDraftId || isReviewingSend) return;

    const timeoutId = setTimeout(() => {
      const dataToSave = {
        subject,
        previewText,
        editorValue,
        templateId,
        filters,
        selectedRegistrationIds,
        timestamp: new Date().toISOString(),
      };

      // Hanya simpan jika ada konten yang berarti
      if (
        subject.trim() ||
        editorValue.text.trim() ||
        selectedRegistrationIds.length > 0
      ) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
      }
    }, 1000); // Debounce 1 detik agar tidak terlalu sering menulis ke disk

    return () => clearTimeout(timeoutId);
  }, [
    subject,
    previewText,
    editorValue,
    templateId,
    filters,
    selectedRegistrationIds,
    loadingDraftId,
  ]);

  useEffect(() => {
    const savedData = getLocalDraft();
    // Jika ada data DAN user tidak sedang diarahkan untuk memuat draft spesifik dari navigasi
    if (savedData && !draftIdFromNavigation) {
      setLocalDraftData(savedData);
      setShowRestorePrompt(true);
    }
  }, [draftIdFromNavigation]);

  const handleRestoreLocalDraft = () => {
    if (!localDraftData) return;

    setSubject(localDraftData.subject);
    setPreviewText(localDraftData.previewText);
    setEditorValue(localDraftData.editorValue);
    setTemplateId(localDraftData.templateId);
    setFilters(localDraftData.filters);
    setSelectedRegistrationIds(localDraftData.selectedRegistrationIds);

    setShowRestorePrompt(false);
    localStorage.removeItem(LOCAL_STORAGE_KEY); // Hapus setelah direstore
  };

  const handleDiscardLocalDraft = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setShowRestorePrompt(false);
  };

  if (isReviewingSend) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <div className="flex flex-col gap-4 border-b  border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">
                Communication Review
              </p>
              <h1 className="text-pretty text-3xl font-bold text-[#1d376b]">
                Review Template & Queue Broadcast
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-500">
                Template email, inbox preview, dan konfirmasi RabbitMQ sekarang
                ada di screen terpisah supaya admin benar-benar tahu apa yang
                akan dikirim.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                size="lg"
                asChild
                className="h-12 "
              >
                <Link to="/communication/history">Campaign History</Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={submissionMode !== null}
                onClick={() => {
                  setComposerStep("compose");
                  setIsPreviewLoading(false);
                  setPreviewError("");
                }}
                className="h-12 self-start "
              >
                Back to Editing
              </Button>
            </div>
          </div>

          {feedback ? (
            <div
              role="status"
              aria-live="polite"
              className={`rounded-2xl border px-4 py-3 text-sm ${
                feedback.tone === "success"
                  ? " border-emerald-300 bg-emerald-50 text-emerald-700"
                  : " border-rose-300 bg-rose-50 text-rose-600"
              }`}
            >
              {feedback.message}
            </div>
          ) : null}

          <div className="grid gap-6 xl:grid-cols-[minmax(320px,360px)_minmax(0,1fr)]">
            <section className="space-y-5 rounded-[28px] border  border-slate-300 bg-slate-50/80 p-5 sm:p-6">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-2xl border  border-slate-300 bg-white px-4 py-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    Final Audience
                  </p>
                  <p className="mt-2 text-2xl font-bold text-[#1d376b] tabular-nums">
                    {selectedRecipientCount}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Recipient terpilih yang akan masuk queue.
                  </p>
                </div>

                <div className="rounded-2xl border  border-slate-300 bg-white px-4 py-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    Risk Check
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    {selectedNonApprovedCount > 0
                      ? `${selectedNonApprovedCount} non-approved recipients included`
                      : "Approved-safe segment"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Pastikan audience memang sesuai sebelum mengirim.
                  </p>
                </div>
              </div>

              <div className="rounded-[24px] border  border-slate-300 bg-white p-4">
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

              <div className="rounded-[24px] border  border-slate-300 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                      Selected Recipients
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-800">
                      {selectedRecipientCount} selected for delivery
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setComposerStep("compose");
                      setLeftPanelTab("recipients");
                    }}
                    className=""
                  >
                    Open List
                  </Button>
                </div>

                <div className="mt-3 space-y-2">
                  {selectedRecipientPreview.length ? (
                    selectedRecipientPreview.map((recipient) => (
                      <div
                        key={recipient.registrationId}
                        className="rounded-2xl border  border-slate-300 bg-slate-50 px-3 py-2"
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

                  {selectedRecipientCount > selectedRecipientPreview.length ? (
                    <p className="text-xs text-slate-500">
                      +
                      {selectedRecipientCount - selectedRecipientPreview.length}{" "}
                      more recipients
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-[24px] border  border-slate-300 bg-white p-4">
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
            </section>

            <section className="space-y-5 rounded-[28px] border  border-slate-300 bg-white p-5 sm:p-6">
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  Final Preview
                </p>
                <h2 className="text-pretty text-2xl font-bold text-[#1d376b]">
                  Choose the Email Template
                </h2>
                <p className="text-sm leading-6 text-slate-500">
                  Ini adalah screen review final sebelum campaign masuk ke
                  worker RabbitMQ.
                </p>
              </div>

              <div className="grid gap-3 xl:grid-cols-3">
                {EMAIL_TEMPLATE_OPTIONS.map((option) => {
                  const isActive = templateId === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTemplateId(option.value)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        isActive
                          ? "border-amber-400 bg-amber-50/40 shadow-sm"
                          : " border-slate-300 bg-slate-50 hover:border-slate-400"
                      } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300`}
                    >
                      <div
                        className={`h-16 rounded-2xl bg-gradient-to-br ${option.accentClass}`}
                      />
                      <p className="mt-3 text-sm font-semibold text-slate-800">
                        {option.label}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {option.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    From
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    {emailPreview?.from.name ?? "Yorindo EMS"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {emailPreview?.from.email ?? "Loading sender…"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    To
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    {samplePreviewRecipient?.fullName ?? "No sample recipient"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {samplePreviewRecipient?.email ??
                      "Choose at least one recipient"}
                  </p>
                </div>

                <div className="rounded-2xl border  border-slate-300 bg-slate-50 px-4 py-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    Subject
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm font-semibold text-slate-800">
                    {emailPreview?.subject ?? subject}
                  </p>
                </div>

                <div className="rounded-2xl border  border-slate-300 bg-slate-50 px-4 py-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    Preheader
                  </p>
                  <p className="mt-2 line-clamp-3 text-sm text-slate-700">
                    {emailPreview?.previewText ??
                      (previewText ||
                        "Will auto-generate from the email body if left empty.")}
                  </p>
                </div>
              </div>

              {previewError ? (
                <div
                  role="alert"
                  className="rounded-2xl border  border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-600"
                >
                  {previewError}
                </div>
              ) : null}

              <Tabs defaultValue="visual" className="space-y-4">
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="visual">Visual Preview</TabsTrigger>
                  <TabsTrigger value="text">Plain Text</TabsTrigger>
                </TabsList>

                <TabsContent value="visual">
                  <div className="overflow-hidden rounded-[24px] border border-slate-300 bg-slate-100">
                    {isPreviewLoading ? (
                      <div className="flex min-h-[40rem] items-center justify-center gap-3 text-sm text-slate-500">
                        <LoaderCircle
                          className="h-4 w-4 animate-spin"
                          aria-hidden="true"
                        />
                        Building the inbox preview…
                      </div>
                    ) : emailPreview ? (
                      <iframe
                        title="Email inbox preview"
                        srcDoc={emailPreview.html}
                        sandbox=""
                        className="h-[40rem] w-full bg-white"
                      />
                    ) : (
                      <div className="flex min-h-[40rem] items-center justify-center text-sm text-slate-500">
                        The preview will appear here after the message is
                        prepared.
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="text">
                  <div className="rounded-[24px] border  border-slate-300 bg-slate-950 px-4 py-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-100">
                      <TextQuote className="h-4 w-4" aria-hidden="true" />
                      Plain Text Fallback
                    </div>
                    <pre className="whitespace-pre-wrap text-sm leading-7 text-slate-300">
                      {emailPreview?.text ||
                        "The text fallback will appear here after the preview is generated."}
                    </pre>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex flex-col gap-3 border-t  border-slate-300 pt-5 sm:flex-row sm:justify-between">
                <div className="space-y-1 text-xs leading-5 text-slate-500">
                  <p>
                    `Save Draft` saves segment, subject, and body without
                    sending email.
                  </p>
                  <p>
                    `Confirm & Queue Send` make a campaign with status `queued`,
                    then worker RabbitMQ will process the broadcast delivery.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    disabled={submissionMode !== null}
                    onClick={() => void handleSubmitCampaign("draft")}
                    className="h-12 "
                  >
                    {submissionMode === "draft" ? "Saving…" : "Save Draft"}
                  </Button>

                  <Button
                    type="button"
                    size="lg"
                    disabled={
                      submissionMode !== null ||
                      isPreviewLoading ||
                      Boolean(previewError) ||
                      !emailPreview
                    }
                    onClick={() => void handleSubmitCampaign("send")}
                    className="h-12 bg-[#0f2f78] px-6 text-white hover:bg-[#11265c]"
                  >
                    <SendHorizontal
                      className="mr-2 h-4 w-4"
                      aria-hidden="true"
                    />
                    {submissionMode === "send"
                      ? "Queueing…"
                      : "Confirm & Queue Send"}
                  </Button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {showRestorePrompt && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-amber-100 p-2 text-amber-600">
                <Mail size={20} />
              </div>
              <div>
                <p className="text-[13.5px] text-amber-700">
                  We found unsaved draft from your last session.
                </p>
                <h4 className="font-semibold text-amber-900 text-md ">
                  Restore and continue your draft?
                </h4>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDiscardLocalDraft}
                className="text-amber-700 text-sm font-semibold hover:bg-amber-100"
              >
                Discard
              </Button>
              <Button
                size="sm"
                onClick={handleRestoreLocalDraft}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                Restore
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8">
        <div className="flex flex-col gap-4 border-b  border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-[#001a4e]">
              Communication Hub
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-500">
              Build the audience on the left, compose the email on the right,
              then review everything once before sending.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="inline-flex items-center gap-2 self-start rounded-full border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
              <Users2 className="h-4 w-4" aria-hidden="true" />
              <span className="tabular-nums">
                {audience?.summary.totalRecipients ?? 0} eligible recipients
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="lg"
              asChild
              className="h-11 "
            >
              <Link to="/communication/history">Campaign History</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(320px,360px)_minmax(0,1fr)] lg:items-start">
          <section className="self-start rounded-[28px] border border-slate-300 bg-sidebar p-5 sm:p-6">
            <div className="space-y-1">
              <p className="text-sm font-bold text-[#1d376b]">
                Audience Builder
              </p>
              <p className="text-sm text-slate-500">
                Narrow the target audience, then choose who should receive the
                message.
              </p>
            </div>

            <div className="mt-5 space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-300 bg-white px-4 py-3">
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
                <div className="rounded-2xl border border-slate-300 bg-white px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    Selected
                  </p>
                  <p className="mt-2 text-2xl font-bold text-[#1d376b] tabular-nums">
                    {selectedRecipientCount}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    These recipients will be included in the draft or send
                    review.
                  </p>
                </div>
              </div>

              <Tabs
                value={leftPanelTab}
                onValueChange={(value) =>
                  setLeftPanelTab(value as LeftPanelTab)
                }
                className="space-y-4"
              >
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="segment">Segment</TabsTrigger>
                  <TabsTrigger value="recipients">Recipients</TabsTrigger>
                  <TabsTrigger value="review">Review</TabsTrigger>
                </TabsList>

                <TabsContent value="segment" className="space-y-4">
                  <p className="text-xs leading-5 text-slate-500">
                    Adjust segment filters here. Open the `Recipients` tab when
                    you want to focus on who will actually receive the email.
                  </p>

                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">
                      Event
                    </Label>

                    <Select
                      value={filters.eventId}
                      onValueChange={(value) =>
                        updateFilter("eventId", value === "all" ? "" : value)
                      }
                    >
                      <SelectTrigger
                        id="communication-event"
                        className="h-11 py-5.5 w-full bg-white border-slate-300 rounded-xl focus:ring-1 focus:ring-indigo-400"
                      >
                        <SelectValue placeholder="Choose event" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                        {audience?.events.map((event) => (
                          <SelectItem key={event.id} value={event.id}>
                            <div className="flex flex-col">
                              {event.title} · {formatEventDate(event.eventDate)}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Search */}
                  {/* <div className="space-y-1.5">
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
                        type="text"
                        value={searchInput}
                        autoComplete="off"
                        placeholder="Search name, email, company…"
                        onChange={(event) => {
                          setSearchInput(event.target.value);
                          if (feedback) setFeedback(null);
                        }}
                        className="h-11 bg-white pl-10 border-slate-300 rounded-xl focus-visible:ring-1 focus-visible:ring-indigo-400 transition-all"
                      />
                    </div>
                  </div> */}

                  <div className="space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                      Registration Status
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {STATUS_OPTIONS.map((status) => {
                        const isActive = filters.status === status.value;
                        const count =
                          audience?.summary.statusCounts[status.value] ?? 0;

                        return (
                          <button
                            key={status.value}
                            type="button"
                            onClick={() => updateFilter("status", status.value)}
                            className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                              isActive
                                ? "border-[#1d376b] bg-[#1d376b] text-white"
                                : "border-slate-300 bg-white text-slate-600 hover:border-slate-400"
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

                  {/* participant type */}
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">
                      Participant Type
                    </Label>

                    <Select
                      value={filters.participantType}
                      onValueChange={(value) =>
                        updateFilter(
                          "participantType",
                          value as ParticipantTypeValue,
                        )
                      }
                    >
                      <SelectTrigger
                        id="communication-participant-type"
                        className="h-11 py-5.5 w-full bg-white border-slate-300 rounded-xl focus:ring-1 focus:ring-indigo-400"
                      >
                        <SelectValue placeholder="Participant Type" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                        {PARTICIPANT_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* company */}
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-4 mb-2">
                      Company
                    </Label>

                    <Select
                      value={filters.companyId || "all"}
                      onValueChange={(value) =>
                        updateFilter("companyId", value === "all" ? "" : value)
                      }
                    >
                      <SelectTrigger
                        id="communication-company"
                        className="h-11 py-5.5 w-full bg-white border-slate-300 rounded-xl focus:ring-1 focus:ring-indigo-400"
                      >
                        <SelectValue placeholder="All companies" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                        <SelectItem value="all">All companies</SelectItem>
                        {audience?.filterOptions.companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* INDUSTRY */}
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-4 mb-2">
                      Industry
                    </Label>

                    <Select
                      value={filters.industryId || "all"}
                      onValueChange={(value) =>
                        updateFilter("industryId", value === "all" ? "" : value)
                      }
                    >
                      <SelectTrigger
                        id="communication-industry"
                        className="h-11 py-5.5 w-full bg-white border-slate-300 rounded-xl focus:ring-1 focus:ring-indigo-400"
                      >
                        <SelectValue placeholder="All industries" />
                      </SelectTrigger>

                      <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                        <SelectItem value="all">All industries</SelectItem>

                        {audience?.filterOptions.industries.map((industry) => (
                          <SelectItem key={industry.id} value={industry.id}>
                            {industry.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* JOBTITLE */}
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-4 mb-2">
                      Job title
                    </Label>

                    <Select
                      value={filters.jobTitleId || "all"}
                      onValueChange={(value) =>
                        updateFilter("jobTitleId", value === "all" ? "" : value)
                      }
                    >
                      <SelectTrigger
                        id="communication-job-title"
                        className="h-11 py-5.5 w-full bg-white border-slate-300 rounded-xl focus:ring-1 focus:ring-indigo-400"
                      >
                        <SelectValue placeholder="All job titles" />
                      </SelectTrigger>

                      <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                        <SelectItem value="all">All job titles</SelectItem>

                        {audience?.filterOptions.jobTitles.map((jobTitle) => (
                          <SelectItem key={jobTitle.id} value={jobTitle.id}>
                            {jobTitle.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* CITY */}
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-4 mb-2">
                      City
                    </Label>

                    <Select
                      value={filters.cityId || "all"}
                      onValueChange={(value) =>
                        updateFilter("cityId", value === "all" ? "" : value)
                      }
                    >
                      <SelectTrigger
                        id="communication-city"
                        className="h-11 py-5.5 w-full bg-white border-slate-300 rounded-xl focus:ring-1 focus:ring-indigo-400"
                      >
                        <SelectValue placeholder="All cities" />
                      </SelectTrigger>

                      <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                        <SelectItem value="all">All cities</SelectItem>

                        {audience?.filterOptions.cities.map((city) => (
                          <SelectItem key={city.id} value={city.id}>
                            {city.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* SOURCE CHANNEL */}
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-4 mb-2">
                      Source channel
                    </Label>

                    <Select
                      value={filters.sourceChannelCode || "all"}
                      onValueChange={(value) =>
                        updateFilter(
                          "sourceChannelCode",
                          value === "all" ? "" : value,
                        )
                      }
                    >
                      <SelectTrigger
                        id="communication-source-channel"
                        className="h-11 py-5.5 w-full bg-white border-slate-300 rounded-xl focus:ring-1 focus:ring-indigo-400"
                      >
                        <SelectValue placeholder="All source channels" />
                      </SelectTrigger>

                      <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                        <SelectItem value="all">All source channels</SelectItem>

                        {audience?.filterOptions.sourceChannels.map((code) => (
                          <SelectItem key={code} value={code}>
                            {code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                <TabsContent value="recipients" className="space-y-4">
                  {/* Search */}
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
                        type="text"
                        value={searchInput}
                        autoComplete="off"
                        placeholder="Search name, email, company…"
                        onChange={(event) => {
                          setSearchInput(event.target.value);
                          if (feedback) setFeedback(null);
                        }}
                        className="h-11 bg-white pl-10 border-slate-300 rounded-xl focus-visible:ring-1 focus-visible:ring-indigo-400 transition-all"
                      />
                    </div>
                  </div>
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
                      {allVisibleSelected
                        ? "Clear Selection"
                        : "Select Visible"}
                    </Button>
                  </div>

                  <div className="space-y-3 rounded-[24px] border  border-slate-300 bg-white/60 p-3">
                    <div className="max-h-[30rem] space-y-3 overflow-y-auto pr-1 [contain-intrinsic-size:640px] [content-visibility:auto]">
                      {isLoading ? (
                        <div className="rounded-2xl border border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-400">
                          Loading audience…
                        </div>
                      ) : loadError ? (
                        <div
                          role="alert"
                          className="rounded-2xl border  border-rose-300 bg-rose-50 px-4 py-4 text-sm text-rose-600"
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
                              className="flex cursor-pointer items-start gap-3 rounded-2xl border  border-slate-300 bg-white px-3 py-3 transition hover:border-slate-400 has-[:focus-visible]:border-[#1d376b] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#1d376b]/10"
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
                                      handleToggleRecipient(
                                        recipient.registrationId,
                                      )
                                    }
                                    className="mt-1 h-4 w-4 rounded border-slate-300 text-[#1d376b] focus-visible:ring-2 focus-visible:ring-[#1d376b]/30"
                                  />
                                </div>
                                <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                                  <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-600">
                                    {recipient.status}
                                  </span>
                                  <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-500">
                                    {recipient.companyName ??
                                      recipient.participantType}
                                  </span>
                                </div>
                              </div>
                            </label>
                          );
                        })
                      ) : (
                        <div className="rounded-2xl border  border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-400">
                          No recipients match the current filters.
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="review" className="space-y-4">
                  <div className="rounded-[24px] border border-slate-300 bg-white p-4">
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

                  <div className="rounded-[24px] border border-slate-300 bg-white p-4">
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

                  <div className="rounded-[24px] border border-slate-300 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                          Selected Recipients
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-800">
                          {selectedRecipientCount} selected for delivery
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setLeftPanelTab("recipients")}
                        className=""
                      >
                        Open List
                      </Button>
                    </div>

                    <div className="mt-3 space-y-2">
                      {selectedRecipientPreview.length ? (
                        selectedRecipientPreview.map((recipient) => (
                          <div
                            key={recipient.registrationId}
                            className="rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2"
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

                      {selectedRecipientCount >
                      selectedRecipientPreview.length ? (
                        <p className="text-xs text-slate-500">
                          +
                          {selectedRecipientCount -
                            selectedRecipientPreview.length}{" "}
                          more recipients
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="border-t border-slate-300 pt-4">
                    <p className="text-sm font-semibold text-slate-700">
                      {visibleRecipients.length} visible recipients
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Filters are synced to the URL so you can refresh or share
                      the same audience segment later.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="rounded-[24px] border border-slate-300 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                      Saved Drafts
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-800">
                      Reopen a saved draft without rebuilding the audience.
                    </p>
                  </div>
                  {currentDraftId ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDetachDraft}
                      className=""
                    >
                      Save as New
                    </Button>
                  ) : null}
                </div>

                {draftsError ? (
                  <div
                    role="alert"
                    className="mt-3 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-600"
                  >
                    {draftsError}
                  </div>
                ) : null}

                <div className="mt-4 space-y-3">
                  {isDraftsLoading ? (
                    <div className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                      Loading saved drafts…
                    </div>
                  ) : drafts.length ? (
                    drafts.map((draft) => {
                      const isCurrentDraft = draft.id === currentDraftId;

                      return (
                        <div
                          key={draft.id}
                          className={`rounded-2xl border px-4 py-4 ${
                            isCurrentDraft
                              ? "border-amber-300 bg-amber-50/50"
                              : "border-slate-300 bg-slate-50/70"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-800">
                                {draft.subject || "Untitled draft"}
                              </p>
                              <p className="mt-1 truncate text-xs text-slate-500">
                                {draft.event.title ?? "All events"} ·{" "}
                                {draft.recipientCount} recipient
                                {draft.recipientCount === 1 ? "" : "s"}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                Updated {formatDraftUpdatedAt(draft.updatedAt)}
                              </p>
                            </div>

                            {isCurrentDraft ? (
                              <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold text-amber-800">
                                Editing
                              </span>
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={loadingDraftId === draft.id}
                                onClick={() => void handleLoadDraft(draft.id)}
                                className=""
                              >
                                {loadingDraftId === draft.id
                                  ? "Opening…"
                                  : "Open"}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                      No saved drafts yet. Save the current composer once to
                      create your first reusable draft.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="min-w-0 rounded-[28px] border border-slate-300 bg-white">
            <div className="flex flex-col gap-4 border-b border-slate-300 px-5 py-5 sm:px-6 sm:py-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  Compose
                </p>
                <h2 className="text-pretty text-2xl font-bold text-[#1d376b]">
                  Draft the Message & Review Before Sending
                </h2>
                <p className="text-sm text-slate-500">
                  {currentDraftSummary
                    ? `Editing saved draft updated ${formatDraftUpdatedAt(
                        currentDraftSummary.updatedAt,
                      )}.`
                    : "Save the current work as a draft any time before queueing the broadcast."}
                </p>
              </div>
              {/* <div className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                <Mail className="h-4 w-4" aria-hidden="true" />
                <span className="tabular-nums">
                  {selectedRecipientCount} recipients selected
                </span>
              </div> */}
            </div>

            <div className="flex flex-1 flex-col space-y-6 px-5 py-5 sm:px-6 sm:py-6">
              <div className="grid gap-3 xl:grid-cols-3">
                <div className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 xl:min-h-[118px]">
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

                <div className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 xl:min-h-[118px]">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    Audience Snapshot
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    {selectedRecipientCount} selected
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {visibleRecipients.length} recipients visible in the current
                    segment.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 xl:min-h-[118px]">
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
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-rose-300 bg-rose-50 text-rose-600"
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
                    {selectedRecipientCount === 0
                      ? "Select recipients from the left panel."
                      : `${selectedRecipientCount} recipient${
                          selectedRecipientCount === 1 ? "" : "s"
                        } ready for review.`}
                  </p>
                </div>

                <div
                  className={`min-h-[76px] rounded-2xl border px-4 py-3 ${
                    composerErrors.recipients
                      ? "border-rose-300 bg-rose-50/60"
                      : "border-slate-300 bg-slate-50"
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

                    {selectedRecipientCount > 6 ? (
                      <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                        +{selectedRecipientCount - 6} more
                      </span>
                    ) : null}

                    {!selectedRecipientCount ? (
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
                  <span className="text-rose-400 text-[10px] leading-none">*</span>
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
                  className="h-12 bg-slate-50 border-slate-200 rounded-xl focus-visible:ring-1 focus-visible:ring-indigo-400 transition-all"
                />
                {composerErrors.subject ? (
                  <p className="text-sm text-rose-600">
                    {composerErrors.subject}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label
                    htmlFor="communication-preview-text"
                    className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400"
                  >
                    Inbox Preview Text
                  </Label>
                </div>
                <Input
                  id="communication-preview-text"
                  name="previewText"
                  value={previewText}
                  autoComplete="off"
                  maxLength={160}
                  placeholder="Add simple summary to be viewed by participant…"
                  onChange={(event) => {
                    setPreviewText(event.target.value);
                    setFeedback(null);
                  }}
                  className="h-12  bg-slate-50 border-slate-200 rounded-xl focus-visible:ring-1 focus-visible:ring-indigo-400 transition-all"
                />
              </div>

              <div ref={bodyFieldRef} className="space-y-2">
                <Label
                  id="communication-message-body-label"
                  className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400"
                >
                  Message Body
                  <span className="text-rose-400 text-[10px] leading-none">*</span>
                </Label>
                <div
                  className={
                    composerErrors.body
                      ? "rounded-[22px] border border-rose-300"
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

              <div className="mt-auto flex flex-col gap-4 border-t  border-slate-300 pt-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-md space-y-1 text-xs leading-5 text-slate-500">
                  <p>
                    {hasUnsavedChanges
                      ? "Unsaved changes pending."
                      : "All changes saved."}
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    disabled={submissionMode !== null}
                    onClick={() => void handleSubmitCampaign("draft")}
                    className="h-12 "
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
                    <SendHorizontal
                      className="mr-2 h-4 w-4"
                      aria-hidden="true"
                    />
                    Review &amp; Send
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
