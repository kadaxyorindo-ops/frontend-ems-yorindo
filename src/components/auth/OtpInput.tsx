import {
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";

interface OtpInputProps {
  value: string[];
  length?: number;
  disabled?: boolean;
  onChange: (nextValue: string[]) => void;
}

export function OtpInput({
  value,
  length = 6,
  disabled = false,
  onChange,
}: OtpInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const digits = Array.from({ length }, (_, index) => value[index] ?? "");

  const focusInput = (index: number) => {
    inputRefs.current[index]?.focus();
    inputRefs.current[index]?.select();
  };

  const handleChange = (index: number, rawValue: string) => {
    const digit = rawValue.replace(/\D/g, "").slice(-1);
    const nextValue = [...digits];
    nextValue[index] = digit;
    onChange(nextValue);

    if (digit && index < length - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      focusInput(index - 1);
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusInput(index - 1);
      return;
    }

    if (event.key === "ArrowRight" && index < length - 1) {
      event.preventDefault();
      focusInput(index + 1);
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const pastedDigits = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length)
      .split("");

    if (pastedDigits.length === 0) {
      return;
    }

    const nextValue = Array.from(
      { length },
      (_, index) => pastedDigits[index] ?? "",
    );

    onChange(nextValue);
    focusInput(Math.min(pastedDigits.length, length) - 1);
  };

  return (
    <div className="flex gap-2 justify-between" onPaste={handlePaste}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            inputRefs.current[index] = element;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          className="h-12 w-12 rounded-lg border border-dashed border-slate-300 bg-slate-50 text-center font-mono text-lg font-bold text-slate-700 outline-none transition focus:border-slate-500 focus:bg-white focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60 sm:h-14 sm:w-14"
        />
      ))}
    </div>
  );
}
