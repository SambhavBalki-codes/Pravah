import backgroundImage from "../../assets/NEW_BACKGROUND.jpg";
import logoImage from "../../assets/Logo.avif";

const AuthLayout = ({ title, subtitle, children, footer, topAction }) => (
  <div
    className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-cover bg-center bg-no-repeat px-4 py-24 sm:px-6 sm:py-16"
    style={{ backgroundImage: `url(${backgroundImage})` }}
  >
    <div className="absolute inset-0 bg-slate-950/25" />

    <div
      className="pointer-events-none absolute -left-24 top-10 h-80 w-80 animate-float-slow rounded-full bg-blue-400/25 blur-3xl"
      aria-hidden="true"
    />
    <div
      className="pointer-events-none absolute -bottom-24 -right-16 h-96 w-96 animate-float-slower rounded-full bg-indigo-400/25 blur-3xl"
      aria-hidden="true"
    />
    {topAction && (
      <div className="absolute right-4 top-4 z-20 sm:right-8 sm:top-6">{topAction}</div>
    )}

    <div className="animate-in fade-in relative z-10 w-full max-w-md duration-500">
      <div className="rounded-2xl bg-white/90 px-6 py-5 shadow-2xl backdrop-blur-sm sm:px-9">
        <div className="mb-4 text-center">
          <div className="relative mx-auto mb-2 h-16 w-16 sm:h-20 sm:w-20">
            <span
              className="absolute -inset-1.5 animate-pulse-soft rounded-full bg-blue-300/40 blur-md"
              aria-hidden="true"
            />
            <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full border border-blue-100 bg-white shadow-sm">
              <img src={logoImage} alt="Pravah logo" className="h-full w-full object-cover" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-blue-700">Pravah</h2>
          <p className="mt-0.5 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
            create lead grow
          </p>
        </div>

        <div>
          <h1 className="text-center text-lg font-bold tracking-tight text-slate-900">{title}</h1>
          {subtitle && (
            <p className="mt-0.5 text-center text-sm leading-5 text-slate-500">{subtitle}</p>
          )}
          <div className="mt-3 [&_form]:space-y-3.5">{children}</div>
        </div>
      </div>

      {footer && (
        <div className="mt-3 text-center text-sm text-white [&_a]:text-white [&_a:hover]:text-blue-100">
          {footer}
        </div>
      )}
    </div>
  </div>
);

export default AuthLayout;