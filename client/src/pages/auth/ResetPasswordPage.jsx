import { useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import backgroundImage from "../../assets/NEW_BACKGROUND.jpg";
import { resetPassword } from "../../store/slices/authSlice";

const ResetPasswordPage = () => {
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const { token: routeToken } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const dispatch = useDispatch();
  const { isUpdatingPassword } = useSelector((state) => state.auth);

  const token = routeToken || searchParams.get("token");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    if (errors.form) {
      setErrors((prev) => ({
        ...prev,
        form: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      setErrors({ form: "Invalid or missing reset token." });
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      await dispatch(
        resetPassword({
          token,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        }),
      ).unwrap();
      navigate("/login");
    } catch (error) {
      setErrors({
        form: error || "Something went wrong while resetting your password.",
      });
    }
  };

  return (
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
            <i className="bx bx-lock-open-alt text-3xl"></i>
          </div>

          <p className="mt-7 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
            Account recovery
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Reset your password
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Choose a new password to secure your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              New Password
            </label>

            <div className="relative">
              <i className="bx bx-lock-alt absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400"></i>

              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter new password"
                className={`w-full rounded-lg border py-3 pl-10 pr-4 text-base outline-none transition placeholder:text-slate-400 ${
                  errors.password
                    ? "border-red-400 focus:ring-2 focus:ring-red-100"
                    : "border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                }`}
              />
            </div>

            {errors.password && (
              <p className="text-red-500 text-sm mt-1.5">{errors.password}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Confirm Password
            </label>

            <div className="relative">
              <i className="bx bx-lock-open-alt absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400"></i>

              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                className={`w-full rounded-lg border py-3 pl-10 pr-4 text-base outline-none transition placeholder:text-slate-400 ${
                  errors.confirmPassword
                    ? "border-red-400 focus:ring-2 focus:ring-red-100"
                    : "border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                }`}
              />
            </div>

            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1.5">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {errors.form && (
            <p className="text-red-500 text-sm mt-1.5">{errors.form}</p>
          )}

          <button
            type="submit"
            disabled={isUpdatingPassword}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-base font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUpdatingPassword ? (
              <>
                <i className="bx bx-loader-alt animate-spin text-lg"></i>
                Resetting...
              </>
            ) : (
              <>
                <i className="bx bx-check text-lg"></i>
                Reset Password
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center text-sm font-semibold text-slate-500 transition hover:text-blue-600"
          >
            <i className="bx bx-arrow-back mr-2 text-lg"></i>
            Return to login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
