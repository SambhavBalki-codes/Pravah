import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import backgroundImage from "../../assets/NEW_BACKGROUND.jpg";
import { login } from "../../store/slices/authSlice";

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isLoggingIn, authUser } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "Student",
  });

  const [errors, setErrors] = useState({});

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // Submit login form
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    dispatch(
      login({
        email: formData.email,
        password: formData.password,
        role: formData.role,
      }),
    );
  };

  // Redirect after successful login
  useEffect(() => {
    if (authUser) {
      switch (formData.role) {
        case "Student":
          navigate("/student/dashboard");
          break;

        case "Teacher":
          navigate("/teacher/dashboard");
          break;

        case "Admin":
          navigate("/admin/dashboard");
          break;

        default:
          navigate("/login");
      }
    }
  }, [authUser, formData.role, navigate]);

  return (
    <div
      className="relative min-h-screen w-full bg-cover bg-center bg-no-repeat flex items-center justify-center px-4 sm:px-6 lg:px-8"
      style={{
        backgroundImage: `url(${backgroundImage})`,
      }}
    >
      <div className="absolute inset-0 bg-slate-950/25" />

      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white/90 backdrop-blur-sm shadow-2xl p-8 sm:p-10">
        {/* Project Name */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
            <i className="bx bxs-book-open text-3xl text-blue-600"></i>
          </div>

          <h1 className="text-3xl font-bold text-blue-700">Pravah</h1>

          <p className="mt-2 text-gray-500 text-base">Login to continue</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
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
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className={`w-full text-base pl-10 pr-4 py-2.5 rounded-lg border outline-none transition ${
                  errors.email
                    ? "border-red-400 focus:ring-2 focus:ring-red-100"
                    : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                }`}
              />
            </div>

            {errors.email && (
              <p className="text-red-500 text-sm mt-1.5">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-gray-700 mb-1.5"
            >
              Password
            </label>

            <div className="relative">
              <i className="bx bx-lock-alt absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>

              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
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

          {/* Role */}
          <div>
            <label
              htmlFor="role"
              className="block text-sm font-semibold text-gray-700 mb-1.5"
            >
              Login as
            </label>

            <div className="relative">
              <i className="bx bx-id-card absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>

              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full text-base pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition appearance-none"
              >
                <option value="Student">Student</option>
                <option value="Teacher">Teacher</option>
                <option value="Admin">Admin</option>
              </select>

              <i className="bx bx-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none"></i>
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold py-2.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingIn ? (
              <>
                <i className="bx bx-loader-alt animate-spin text-lg"></i>
                Signing in...
              </>
            ) : (
              <>
                <i className="bx bx-log-in text-lg"></i>
                Sign in
              </>
            )}
          </button>
        </form>

        {/* Forgot Password */}
        <div className="mt-4 text-center">
          <Link
            to="/forgot-password"
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
          >
            Forgot your password?
          </Link>
        </div>

        {/* Register */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
          >
            Create account
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
