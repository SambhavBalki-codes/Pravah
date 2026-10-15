import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Loader2, LogIn, Lock, Mail } from "lucide-react";
import { login } from "../../store/slices/authSlice";
import AuthLayout from "../../components/auth/AuthLayout";
import AuthField from "../../components/auth/AuthField";

const ROLES = ["Student", "Teacher", "Admin"];

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoggingIn, authUser } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({ email: "", password: "", role: "Student" });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const next = {};
    if (!formData.email.trim()) next.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) next.email = "Enter a valid email address";

    if (!formData.password) next.password = "Password is required";
    else if (formData.password.length < 8) next.password = "Password must be at least 8 characters";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    dispatch(
      login({
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
      }),
    );
  };

  useEffect(() => {
    if (!authUser) return;
    const role = authUser.role?.toLowerCase();
    if (role === "student") navigate("/student");
    else if (role === "teacher") navigate("/teacher");
    else if (role === "admin") navigate("/admin");
    else navigate("/login");
  }, [authUser, navigate]);

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your Pravah account to continue.">
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold text-slate-700">Sign in as</legend>
          <div className="grid grid-cols-3 gap-2">
            {ROLES.map((role) => (
              <label key={role} className="cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value={role}
                  checked={formData.role === role}
                  onChange={handleChange}
                  className="peer sr-only"
                />
                <span className="block rounded-xl border border-slate-300 py-2.5 text-center text-sm font-semibold text-slate-600 transition hover:bg-slate-50 peer-checked:border-blue-600 peer-checked:bg-blue-50 peer-checked:text-blue-700 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-300">
                  {role}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <AuthField
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          autoCapitalize="none"
          icon={<Mail size={18} />}
          placeholder="you@example.com"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
        />

        <AuthField
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          icon={<Lock size={18} />}
          placeholder="Enter your password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
        />

        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="rounded text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoggingIn}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoggingIn ? (
            <>
              <Loader2 size={18} className="animate-spin" aria-hidden="true" /> Signing in...
            </>
          ) : (
            <>
              <LogIn size={18} aria-hidden="true" /> Sign in
            </>
          )}
        </button>
      </form>
    </AuthLayout>
  );
};

export default LoginPage;