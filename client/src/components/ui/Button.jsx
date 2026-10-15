import { Loader2 } from "lucide-react";

const VARIANTS = {
  primary: "bg-blue-600 text-white hover:bg-blue-700",
  secondary: "bg-emerald-600 text-white hover:bg-emerald-700",
  danger: "bg-rose-600 text-white hover:bg-rose-700",
  outline: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
  ghost: "text-slate-600 hover:bg-slate-100",
};

const SIZES = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-base",
};

// type defaults to "button". Pass type="submit" for form submit buttons.
const Button = ({
  variant = "primary",
  size = "md",
  loading = false,
  icon: Icon,
  disabled,
  className = "",
  type = "button",
  children,
  ...props
}) => (
  <button
    type={type}
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    {...props}
  >
    {loading ? (
      <Loader2 size={15} className="animate-spin" aria-hidden="true" />
    ) : (
      Icon && <Icon size={15} aria-hidden="true" />
    )}
    {children}
  </button>
);

export default Button;