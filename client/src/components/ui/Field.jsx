import { useId } from "react";

const base =
  "w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60";
const ok = "border-slate-300 focus:border-blue-500 focus:ring-blue-100";
const bad = "border-rose-400 focus:border-rose-500 focus:ring-rose-100";

const Wrapper = ({ id, label, hint, error, required, children }) => (
  <div>
    {label && (
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
        {required && (
          <span className="ml-0.5 text-rose-500" aria-hidden="true">
            *
          </span>
        )}
      </label>
    )}
    {children}
    {hint && !error && (
      <p id={`${id}-hint`} className="mt-1 text-xs text-slate-500">
        {hint}
      </p>
    )}
    {error && (
      <p id={`${id}-error`} role="alert" className="mt-1 text-xs font-medium text-rose-600">
        {error}
      </p>
    )}
  </div>
);

const describe = (id, hint, error) =>
  error ? `${id}-error` : hint ? `${id}-hint` : undefined;

export const Input = ({ label, hint, error, required, className = "", id, ...props }) => {
  const auto = useId();
  const fieldId = id || auto;
  return (
    <Wrapper id={fieldId} label={label} hint={hint} error={error} required={required}>
      <input
        id={fieldId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describe(fieldId, hint, error)}
        className={`${base} ${error ? bad : ok} ${className}`}
        {...props}
      />
    </Wrapper>
  );
};

export const Select = ({ label, hint, error, required, className = "", id, children, ...props }) => {
  const auto = useId();
  const fieldId = id || auto;
  return (
    <Wrapper id={fieldId} label={label} hint={hint} error={error} required={required}>
      <select
        id={fieldId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describe(fieldId, hint, error)}
        className={`${base} ${error ? bad : ok} ${className}`}
        {...props}
      >
        {children}
      </select>
    </Wrapper>
  );
};

export const Textarea = ({
  label,
  hint,
  error,
  required,
  className = "",
  id,
  value = "",
  maxLength,
  ...props
}) => {
  const auto = useId();
  const fieldId = id || auto;
  return (
    <Wrapper id={fieldId} label={label} hint={hint} error={error} required={required}>
      <textarea
        id={fieldId}
        value={value}
        maxLength={maxLength}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describe(fieldId, hint, error)}
        className={`${base} resize-y ${error ? bad : ok} ${className}`}
        {...props}
      />
      {maxLength && (
        <p className="mt-1 text-right text-xs text-slate-400" aria-hidden="true">
          {String(value).length}/{maxLength}
        </p>
      )}
    </Wrapper>
  );
};