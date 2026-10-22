import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, ArrowRight, Compass } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-10">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-indigo-200/40 blur-3xl" />

      <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200/80 bg-white px-6 py-14 text-center shadow-xl shadow-slate-200/60 sm:px-12 sm:py-16">
        <div className="relative mx-auto mb-8 flex h-36 w-40 items-center justify-center">
          <div className="absolute inset-2 rounded-full bg-blue-50" />

          <div className="relative flex h-28 w-24 -rotate-6 flex-col items-center justify-center rounded-2xl border border-blue-100 bg-white shadow-xl shadow-blue-100">
            <Compass size={42} className="mb-3 text-blue-700" />
            <div className="h-1.5 w-12 rounded-full bg-slate-200" />
            <div className="mt-2 h-1.5 w-8 rounded-full bg-slate-100" />
          </div>
        </div>

        <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-700">
          Error 404
        </p>

        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Oops! Page not found
        </h1>

        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-slate-500 sm:text-base">
          The page you are looking for doesn't exist or may have been moved.
          Let's get you back on track.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/"
            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-800"
          >
            Return to Home
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;