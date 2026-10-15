import { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft, Loader2, Mail, MailCheck, Send } from "lucide-react";
import { forgotPassword } from "../../store/slices/authSlice";
import AuthLayout from "../../components/auth/AuthLayout";
import AuthField from "../../components/auth/AuthField";

const BackToLogin = () => (
  <Link
    to="/login"
    className="inline-flex items-center gap-2 rounded font-semibold text-slate-600 hover:text-blue-600"
  >
    <ArrowLeft size={16} aria-hidden="true" /> Back to sign in
  </Link>
);

const ForgotPasswordPage = () => {
  const dispatch = useDispatch();
  const { isRequestingForToken } = useSelector((state) => state.auth);

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const send = async () => {
    setError("");
    try {
      await dispatch(forgotPassword({ email: email.trim() })).unwrap();
      setIsSubmitted(true);
    } catch (err) {
      setError(typeof err === "string" ? err : "Something went wrong. Please try again.");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return setError("Email is required");
    if (!/\S+@\S+\.\S+/.test(email)) return setError("Enter a valid email address");
    send();
  };

  if (isSubmitted) {
    return (
      <AuthLayout title="Check your inbox" footer={<BackToLogin />}>
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/60">
            <MailCheck size={26} aria-hidden="true" />
          </div>
          <p className="mt-5 text-sm leading-6 text-slate-500">We sent a password reset link to</p>
          <p className="mt-2 break-all rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700">
            {email}
          </p>
          <p className="mt-4 text-xs leading-5 text-slate-400">
            If an account exists for this address, the email will arrive shortly. Check your spam
            folder if you do not see it.
          </p>
          {error && (
            <p role="alert" className="mt-4 text-xs font-medium text-rose-600">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={send}
            disabled={isRequestingForToken}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            {isRequestingForToken && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            {isRequestingForToken ? "Sending..." : "Resend link"}
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter your email and we will send you a link to reset it."
      footer={<BackToLogin />}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <AuthField
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          icon={<Mail size={18} />}
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError("");
          }}
          error={error}
          disabled={isRequestingForToken}
        />
        <button
          type="submit"
          disabled={isRequestingForToken}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRequestingForToken ? (
            <>
              <Loader2 size={18} className="animate-spin" aria-hidden="true" /> Sending...
            </>
          ) : (
            <>
              <Send size={18} aria-hidden="true" /> Send reset link
            </>
          )}
        </button>
      </form>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;