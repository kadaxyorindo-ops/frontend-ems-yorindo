import { startTransition, useEffect, useState } from "react";
import { AuthLayout } from "@/layouts/AuthLayout";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { OtpInput } from "@/components/auth/OtpInput";

const EMPTY_OTP = ["", "", "", "", "", ""];

export function Login() {
  const navigate = useNavigate();
  const { requestOtp, verifyOtp } = useAuth();

  const [emailInput, setEmailInput] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(EMPTY_OTP);
  const [otpSent, setOtpSent] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpValue = otpDigits.join("");

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setTimeout(
      () => setResendCooldown((v) => v - 1),
      1_000,
    );
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  const handleSendCode = async (event?: { preventDefault(): void }) => {
    event?.preventDefault();
    const email = emailInput.trim().toLowerCase();

    setEmailError("");
    setOtpError("");

    if (!email) {
      setEmailError("Enter your work email first.");
      return;
    }

    setIsSendingCode(true);
    const result = await requestOtp(email);
    setIsSendingCode(false);

    if (!result.ok) {
      setEmailError(result.message);
      return;
    }

    setSubmittedEmail(email);
    setOtpDigits([...EMPTY_OTP]);
    setOtpSent(true);
    setResendCooldown(result.data?.resendAvailableInSeconds ?? 60);
  };

  const handleLogin = async (event: { preventDefault(): void }) => {
    event.preventDefault();
    setOtpError("");

    if (otpValue.length !== 6) {
      setOtpError("Enter all 6 digits of your OTP code.");
      return;
    }

    setIsVerifying(true);
    const result = await verifyOtp(submittedEmail, otpValue);
    setIsVerifying(false);

    if (!result.ok) {
      setOtpError(result.message);
      return;
    }

    startTransition(() => {
      navigate("/events", { replace: true });
    });
  };

  const sendButtonDisabled =
    isSendingCode || isVerifying || (otpSent && resendCooldown > 0);

  const sendButtonLabel = isSendingCode
    ? "Sending code..."
    : otpSent && resendCooldown > 0
      ? `Resend in ${resendCooldown}s`
      : "Send Verification Code";

  return (
    <AuthLayout>
      <div className="space-y-7">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-[1.9rem] font-bold tracking-tight text-slate-900">
            Welcome back
          </h1>
          <p className="text-slate-500 text-sm">
            Access your event management dashboard.
          </p>
        </div>

        {/* Email section */}
        <form onSubmit={handleSendCode} className="space-y-3">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
              Professional Email
            </label>
            <div className="relative">
              <input
                type="email"
                autoFocus
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  if (otpSent) {
                    setOtpSent(false);
                    setOtpDigits([...EMPTY_OTP]);
                    setOtpError("");
                  }
                }}
                disabled={isSendingCode || isVerifying}
                placeholder="nama@yorindo.co.id"
                className="w-full h-11 rounded-lg border border-slate-200 bg-slate-50 px-4 pr-11 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100 disabled:opacity-60"
              />
              {/* Mail icon */}
              <svg
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
            {emailError && (
              <p className="text-xs text-rose-500">{emailError}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={sendButtonDisabled}
            className="w-full h-11 rounded-lg bg-[#0c1b45] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#162454] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sendButtonLabel}
            {!isSendingCode && !(otpSent && resendCooldown > 0) && (
              <span className="text-base leading-none">→</span>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-slate-400">
            Verification Required
          </span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* OTP section */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
              6-Digit Code
            </label>
            <OtpInput
              value={otpDigits}
              onChange={setOtpDigits}
              disabled={!otpSent || isVerifying}
            />
            {otpError && (
              <p className="text-xs text-rose-500">{otpError}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!otpSent || otpValue.length !== 6 || isVerifying}
            className="w-full h-11 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors bg-slate-200 text-slate-400 disabled:cursor-not-allowed enabled:bg-[#0c1b45] enabled:text-white enabled:hover:bg-[#162454]"
          >
            {isVerifying ? (
              "Verifying..."
            ) : (
              <>
                <span>Login</span>
                <span className="text-base leading-none">→</span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <span className="text-blue-600 font-medium cursor-pointer hover:underline">
            Contact admin
          </span>
        </p>
      </div>
    </AuthLayout>
  );
}
