import { useState } from "react";

import { Link } from "react-router-dom";

import { useDispatch, useSelector } from "react-redux";

import backgroundImage from "../../assets/NEW_BACKGROUND.jpg";
import { forgotPassword } from "../../store/slices/authSlice";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");

  const [isSubmitted, setIsSubmitted] = useState(false);

  const [error, setError] = useState("");
  const { isRequestingForToken } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setError("Email is required");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Email is invalid");
      return;
    }

    setError("");

    try {
      await dispatch(forgotPassword({ email })).unwrap();
      setIsSubmitted(true);
    } catch (error) {
      setError(error || "Something went wrong. Please try again.");
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      setError("Email is required");
      return;
    }

    try {
      setError("");

      await dispatch(forgotPassword({ email })).unwrap();

      setIsSubmitted(true);
    } catch (error) {
      setError(error || "Something went wrong. Please try again.");
    }
  };

  if (isSubmitted) {
    return (
      <div
        className="relative min-h-screen w-full bg-cover bg-center bg-no-repeat flex items-center justify-center px-4 sm:px-6 lg:px-8"
        style={{
          backgroundImage: `url(${backgroundImage})`,
        }}
      >
        <div className="absolute inset-0 bg-slate-950/25" />

        <div className="relative z-10 w-full max-w-md rounded-2xl bg-white/95 p-8 text-center shadow-2xl backdrop-blur-sm sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 ring-8 ring-emerald-50">
            <i className="bx bx-envelope-open text-3xl"></i>
          </div>

          <p className="mt-7 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
            Email sent
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            Check your inbox
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            We sent a password reset link to
          </p>

          <p className="mt-3 break-all rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
            {email}
          </p>

          <p className="mt-4 text-sm leading-6 text-slate-500">
            If an account exists for this address, the email should arrive
            shortly. Please check your spam folder if you do not see it.
          </p>

          <div className="mt-7 flex flex-col gap-3">
            <Link
              to="/login"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <i className="bx bx-arrow-back mr-2 text-lg"></i>
              Return to login
            </Link>

            <button
              type="button"
              onClick={handleResendEmail}
              disabled={isRequestingForToken}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <i
                className={`bx ${isRequestingForToken ? "bx-loader-alt animate-spin" : "bx-refresh"} mr-2 text-lg`}
              ></i>
              {isRequestingForToken ? "Sending..." : "Resend reset link"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="relative min-h-screen w-full bg-cover bg-center bg-no-repeat flex items-center justify-center px-4 sm:px-6 lg:px-8"
        style={{
          backgroundImage: `url(${backgroundImage})`,
        }}
      >
        <div className="absolute inset-0 bg-slate-950/25" />

        <div className="relative z-10 w-full max-w-md rounded-2xl bg-white/95 p-8 shadow-2xl backdrop-blur-sm sm:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600 ring-8 ring-blue-50">
              <i className="bx bx-key text-3xl"></i>
            </div>

            <p className="mt-7 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
              Account recovery
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Forgot password?
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Enter your email address and we will send you a secure link to
              reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Email
              </label>

              <div className="relative">
                <i className="bx bx-envelope absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400"></i>

                <input
                  id="email"
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="you@example.com"
                  className={`w-full rounded-lg border py-3 pl-10 pr-4 text-base outline-none transition placeholder:text-slate-400 ${
                    error
                      ? "border-red-400 focus:ring-2 focus:ring-red-100"
                      : "border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  }`}
                  disabled={isRequestingForToken}
                />
              </div>

              {error && <p className="text-red-500 text-sm mt-1.5">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={isRequestingForToken}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-base font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isRequestingForToken ? (
                <>
                  <i className="bx bx-loader-alt animate-spin text-lg"></i>
                  Sending...
                </>
              ) : (
                <>
                  <i className="bx bx-log-in text-lg"></i>
                  Send Reset Link
                </>
              )}
            </button>
          </form>

          <Link
            to="/login"
            className="mt-6 inline-flex w-full items-center justify-center text-sm font-semibold text-slate-500 transition hover:text-blue-600"
          >
            <i className="bx bx-arrow-back mr-2 text-lg"></i>
            Return to login
          </Link>
        </div>
      </div>
    </>
  );
};

export default ForgotPasswordPage;
