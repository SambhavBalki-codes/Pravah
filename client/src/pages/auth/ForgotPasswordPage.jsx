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

        <div className="relative z-10 w-full max-w-md rounded-2xl bg-white/90 backdrop-blur-sm shadow-2xl p-8 text-center">
          <h2 className="text-2xl font-semibold text-gray-900">
            Check your email
          </h2>

          <p className="mt-4 text-gray-600">
            We have sent a password reset link to your email address: {email}
          </p>

          <p className="mt-3 text-gray-600">
            If an account with {email} exists, you will receive a password reset
            email shortly.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <Link
              to="/login"
              className="inline-block text-blue-600 hover:underline"
            >
              Back to login
            </Link>

            <button
              type="button"
              onClick={handleResendEmail}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Send another email
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

        <div className="relative z-10 w-full max-w-md bg-white/90 rounded-2xl shadow-2xl p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
              <i className="bx bx-key text-3xl text-blue-600"></i>
            </div>

            <h1 className="text-3xl font-bold text-blue-700">
              Forgot Password
            </h1>

            <p className="mt-2 text-gray-500 text-base">
              Enter Your email address and we will send you a link to reset your
              password.{" "}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700 mb-1.5"
              >
                Email
              </label>

              <div className="relative">
                <i className="bx bx-envelope absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>

                <input
                  id="email"
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Enter your email"
                  className={`w-full text-base pl-10 pr-4 py-2.5 rounded-lg border outline-none transition ${
                    error
                      ? "border-red-400 focus:ring-2 focus:ring-red-100"
                      : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  }`}
                  disabled={isRequestingForToken}
                />
              </div>

              {error && <p className="text-red-500 text-sm mt-1.5">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={isRequestingForToken}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold py-2.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
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
        </div>
      </div>
    </>
  );
};

export default ForgotPasswordPage;
