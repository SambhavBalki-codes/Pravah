import { useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AlertTriangle, ArrowLeft, Check, Loader2, Lock } from "lucide-react";
import { resetPassword } from "../../store/slices/authSlice";
import AuthLayout from "../../components/auth/AuthLayout";
import AuthField from "../../components/auth/AuthField";

const ResetPasswordPage = () => {
  const [formData, setFormData] = useState({ password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});

  const { token: routeToken } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isUpdatingPassword } = useSelector((state) => state.auth);

  const token = routeToken || searchParams.get("token");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name] || errors.form) setErrors((prev) => ({ ...prev, [name]: "", form: "" }));
  };

  const validateForm = () => {
    const next = {};
    if (!formData.password) next.password = "Password is required";
    else if (formData.password.length < 8) next.password = "Password must be at least 8 characters";

    if (!formData.confirmPassword) next.confirmPassword = "Please confirm your password";
    else if (formData.password !== formData.confirmPassword) {
      next.confirmPassword = "Passwords do not match";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await dispatch(
        resetPassword({
          token,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        }),
      ).unwrap();
      navigate("/login");
    } catch (err) {
      setErrors({
        form: typeof err === "string" ? err : "Something went wrong while resetting your password.",
      });
    }
  };

  if (!token) {
    return (
      <AuthLayout title="Invalid reset link">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-500">
            <AlertTriangle size={26} aria-hidden="true" />
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-500">
            This password reset link is missing or invalid. Request a new one to continue.
          </p>
          <Link
            to="/forgot-password"
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700"
          >
            Request a new link
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Set a new password"
      subtitle="Choose a strong password to secure your account."
      footer={
        <Link
          to="/login"
          className="inline-flex items-center gap-2 rounded font-semibold text-slate-600 hover:text-blue-600"
        >
          <ArrowLeft size={16} aria-hidden="true" /> Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <AuthField
          label="New password"
          type="password"
          name="password"
          autoComplete="new-password"
          icon={<Lock size={18} />}
          placeholder="At least 8 characters"
          hint="Use at least 8 characters."
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
        />
        <AuthField
          label="Confirm password"
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          icon={<Lock size={18} />}
          placeholder="Re-enter your password"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
        />

        {errors.form && (
          <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
            {errors.form}
          </p>
        )}

        <button
          type="submit"
          disabled={isUpdatingPassword}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUpdatingPassword ? (
            <>
              <Loader2 size={18} className="animate-spin" aria-hidden="true" /> Resetting...
            </>
          ) : (
            <>
              <Check size={18} aria-hidden="true" /> Reset password
            </>
          )}
        </button>
      </form>
    </AuthLayout>
  );
};

export default ResetPasswordPage;