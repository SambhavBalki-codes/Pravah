import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Mail, UserPlus, UserRound, Loader2 } from "lucide-react";
import { useDispatch } from "react-redux";
import AuthLayout from "../../components/auth/AuthLayout";
import AuthField from "../../components/auth/AuthField";
import { registerVisitor } from "../../store/slices/visitorSlice";
import { getUser } from "../../store/slices/authSlice";

const VisitorRegister = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (form.name.trim().length < 2 || !form.email || form.password.length < 8) {
      setError("Enter a name, valid email, and password of at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await dispatch(registerVisitor(form)).unwrap();
      await dispatch(getUser()).unwrap();
      navigate("/visitor/projects");
    } catch (message) {
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create visitor account" subtitle="Explore completed student work and ask grounded questions.">
      <form onSubmit={submit} className="space-y-4">
        <AuthField label="Name" icon={<UserRound size={18} />} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" />
        <AuthField label="Email" type="email" icon={<Mail size={18} />} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
        <AuthField label="Password" type="password" icon={<Lock size={18} />} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" />
        {error && <p className="text-sm text-rose-600" role="alert">{error}</p>}
        <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-700" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" size={18} /> : <UserPlus size={18} />} Create account
        </button>
        <p className="text-center text-sm text-slate-500">Already registered? <Link to="/visitor/login" className="font-semibold text-indigo-600">Sign in</Link></p>
      </form>
    </AuthLayout>
  );
};

export default VisitorRegister;
