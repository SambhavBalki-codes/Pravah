import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Mail, LogIn, Loader2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import AuthLayout from "../../components/auth/AuthLayout";
import AuthField from "../../components/auth/AuthField";
import { loginVisitor } from "../../store/slices/visitorSlice";
import { getUser } from "../../store/slices/authSlice";

const VisitorLogin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { authUser } = useSelector((state) => state.auth);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const loading = useSelector((state) => state.visitor.loading);

  useEffect(() => {
    if (authUser?.role === "Visitor") navigate("/visitor/projects", { replace: true });
  }, [authUser, navigate]);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!form.email || !form.password) return setError("Email and password are required.");
    try {
      await dispatch(loginVisitor(form)).unwrap();
      await dispatch(getUser()).unwrap();
      navigate("/visitor/projects");
    } catch (message) {
      setError(message);
    }
  };

  return (
    <AuthLayout
      title="Explore student projects"
      subtitle="Sign in as a visitor to explore projects and chat with their AI assistants."
      footer={<span>New here? <Link to="/visitor/register" className="font-semibold underline">Create a visitor account</Link></span>}
    >
      <form onSubmit={submit} className="space-y-4">
        <AuthField label="Email" type="email" icon={<Mail size={18} />} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
        <AuthField label="Password" type="password" icon={<Lock size={18} />} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Your password" />
        {error && <p className="text-sm text-rose-600" role="alert">{error}</p>}
        <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-700" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" size={18} /> : <LogIn size={18} />} Sign in as visitor
        </button>
        <Link to="/login" className="block text-center text-sm font-semibold text-slate-500 hover:text-indigo-600">Back to standard sign in</Link>
      </form>
    </AuthLayout>
  );
};

export default VisitorLogin;
