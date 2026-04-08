/**
 * Centralized role display constants.
 * Import from here — never define these inline in components.
 */

export const ROLE_LABELS: Record<string, string> = {
  super_admin:            "Super Admin",
  admin:                  "Admin",
  event_operator:         "Event Operator",
  communication_operator: "Communication Operator",
  survey_analyst:         "Survey Analyst",
};

export const ROLE_COLORS: Record<string, string> = {
  super_admin:            "bg-violet-100 text-violet-700",
  admin:                  "bg-indigo-100 text-indigo-700",
  event_operator:         "bg-blue-100 text-blue-700",
  communication_operator: "bg-amber-100 text-amber-700",
  survey_analyst:         "bg-emerald-100 text-emerald-700",
};
