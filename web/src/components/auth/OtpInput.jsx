import { useEffect, useMemo, useRef } from "react";

const OTP_LENGTH = 6;

const OtpInput = ({ value, onChange, disabled = false, error = false }) => {
  const inputRef = useRef(null);
  const normalizedValue = String(value || "").replace(/\D/g, "").slice(0, OTP_LENGTH);
  const digits = useMemo(() => {
    return Array.from({ length: OTP_LENGTH }, (_, index) => normalizedValue[index] || "");
  }, [normalizedValue]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleChange = (event) => {
    onChange?.(event.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH));
  };

  return (
    <div className="relative" onClick={() => inputRef.current?.focus()}>
      <div className={`grid grid-cols-6 gap-2 ${error ? "animate-shake" : ""}`}>
        {digits.map((digit, index) => {
          const active = normalizedValue.length === index;
          let stateClass = "border-slate-200";
          if (error) {
            stateClass = "border-red-400";
          } else if (active || digit) {
            stateClass = "border-blue-500 ring-2 ring-blue-100";
          }

          return (
            <div
              key={index}
              className={[
                "flex h-14 items-center justify-center rounded-xl border bg-white text-xl font-black text-slate-950 transition",
                stateClass,
              ].join(" ")}
            >
              {digit}
            </div>
          );
        })}
      </div>
      <input
        ref={inputRef}
        value={normalizedValue}
        onChange={handleChange}
        disabled={disabled}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={OTP_LENGTH}
        className="absolute inset-0 h-full w-full cursor-default opacity-0"
        aria-label="Ma OTP"
      />
    </div>
  );
};

export default OtpInput;
