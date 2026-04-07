import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  createUser,
  updateUser,
  SYSTEM_ROLES,
  type User,
  type UserFormData,
} from "@/services/userService";

interface UserFormModalProps {
  mode: "create" | "edit";
  user?: User;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EMPTY_FORM: UserFormData = {
  name:             "",
  email:            "",
  role:             "event_operator",
  organizationName: null,
};

const ROLE_LABELS: Record<string, string> = {
  super_admin:            "Super Admin",
  admin:                  "Admin",
  event_operator:         "Event Operator",
  communication_operator: "Communication Operator",
  survey_analyst:         "Survey Analyst",
};

export function UserFormModal({ mode, user, isOpen, onClose, onSuccess }: UserFormModalProps) {
  const [form, setForm]         = useState<UserFormData>(EMPTY_FORM);
  const [errors, setErrors]     = useState<Partial<Record<keyof UserFormData, string>>>({});
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (mode === "edit" && user) {
      setForm({
        name:             user.name,
        email:            user.email,
        role:             user.role,
        organizationName: user.organizationName,
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
    setApiError("");
  }, [isOpen, mode, user]);

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!form.name.trim() || form.name.trim().length < 2)
      next.name = "Name must be at least 2 characters.";
    if (mode === "create" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = "Enter a valid email address.";
    if (!form.role)
      next.role = "Role is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setApiError("");

    const result = mode === "create"
      ? await createUser(form)
      : await updateUser(user!._id, {
          name:             form.name,
          role:             form.role,
          organizationName: form.organizationName,
        });

    setIsSubmitting(false);

    if (!result.data) {
      setApiError(result.error ?? result.message);
      return;
    }

    onSuccess();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">

        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dashed border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {mode === "create" ? "Invite User" : "Edit User"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {mode === "create"
                ? "Create a new account for a dashboard member."
                : "Update this user's profile and access."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-dashed border-slate-300 text-slate-400 hover:bg-slate-100 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="px-6 py-5 space-y-4">

            {/* API error */}
            {apiError && (
              <div className="rounded-lg border border-dashed border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                {apiError}
              </div>
            )}

            {/* Name */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                Full Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. John Smith"
                className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
              />
              {errors.name && <p className="text-xs text-rose-500">{errors.name}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                Email Address
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                disabled={mode === "edit"}
                placeholder="name@yorindo.co.id"
                className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
              />
              {errors.email && <p className="text-xs text-rose-500">{errors.email}</p>}
            </div>

            {/* Role + Organization in a row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  Role
                </label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                >
                  {SYSTEM_ROLES.map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
                {errors.role && <p className="text-xs text-rose-500">{errors.role}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  Organization / Team
                </label>
                <input
                  type="text"
                  value={form.organizationName ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, organizationName: e.target.value || null }))}
                  placeholder="e.g. Operations Team"
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
                />
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-dashed border-slate-200 flex justify-end gap-3 bg-slate-50">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
              className="border border-dashed border-slate-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#1a40a8] hover:bg-blue-800"
            >
              {isSubmitting
                ? mode === "create" ? "Creating..." : "Saving..."
                : mode === "create" ? "Create User" : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
