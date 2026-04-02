import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  createUser,
  updateUser,
  SYSTEM_ROLES,
  PERMISSION_GROUPS,
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
  role:             "admin",
  organizationName: null,
  permissions:      [],
};

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin:       "Admin",
  staff:       "Staff",
  scanner:     "Scanner",
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
        permissions:      [...(user.permissions ?? [])],
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

  const togglePermission = (value: string) => {
    const next = form.permissions.includes(value)
      ? form.permissions.filter((p) => p !== value)
      : [...form.permissions, value];

    // Dependency: unchecking events:view also removes the sub-permissions
    if (value === "events:view" && !next.includes("events:view")) {
      return setForm((f) => ({
        ...f,
        permissions: next.filter(
          (p) => !["events:create", "events:edit", "events:delete"].includes(p),
        ),
      }));
    }

    setForm((f) => ({ ...f, permissions: next }));
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
          permissions:      form.permissions,
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
                placeholder="e.g. Ahmad Fauzi"
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
                placeholder="nama@yorindo.co.id"
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

            {/* Permissions */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-slate-400">
                  Feature Access
                </span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              <div className="space-y-4">
                {PERMISSION_GROUPS.map((group) => (
                  <div key={group.group}>
                    <p className="text-xs font-bold text-slate-500 mb-2">{group.group}</p>
                    <div className="space-y-2">
                      {group.items.map((item) => {
                        const isChecked = form.permissions.includes(item.value);
                        const isDisabled =
                          ["events:create", "events:edit", "events:delete"].includes(item.value) &&
                          !form.permissions.includes("events:view");

                        return (
                          <label
                            key={item.value}
                            className={`flex items-center gap-3 cursor-pointer group ${isDisabled ? "opacity-40 cursor-not-allowed" : ""}`}
                          >
                            <div
                              onClick={() => !isDisabled && togglePermission(item.value)}
                              className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                isChecked
                                  ? "bg-[#1a40a8] border-[#1a40a8]"
                                  : "border-slate-300 bg-white group-hover:border-slate-400"
                              } ${isDisabled ? "pointer-events-none" : ""}`}
                            >
                              {isChecked && (
                                <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                                  <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </div>
                            <span
                              onClick={() => !isDisabled && togglePermission(item.value)}
                              className="text-sm text-slate-700 select-none"
                            >
                              {item.label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
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
