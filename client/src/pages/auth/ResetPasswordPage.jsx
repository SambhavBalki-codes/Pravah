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

      <div className="relative z-10 w-full max-w-md bg-white/90 rounded-2xl shadow-2xl p-8 sm:p-10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-3">
            <i className="bx bx-lock-open-alt text-3xl text-indigo-600"></i>
          </div>

          <h1 className="text-3xl font-bold text-blue-700">
            RESET PASSWORD FORM
          </h1>

          <p className="mt-2 text-gray-500 text-base">
            Enter your new password below to reset your account password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-gray-700 mb-1.5"
            >
              New Password
            </label>

            <div className="relative">
              <i className="bx bx-lock-alt absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>

              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter new password"
                className={`w-full text-base pl-10 pr-4 py-2.5 rounded-lg border outline-none transition ${
                  errors.password
                    ? "border-red-400 focus:ring-2 focus:ring-red-100"
                    : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
              className="block text-sm font-semibold text-gray-700 mb-1.5"
            >
              Confirm Password
            </label>

            <div className="relative">
              <i className="bx bx-lock-open-alt absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>

              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                className={`w-full text-base pl-10 pr-4 py-2.5 rounded-lg border outline-none transition ${
                  errors.confirmPassword
                    ? "border-red-400 focus:ring-2 focus:ring-red-100"
                    : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold py-2.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
