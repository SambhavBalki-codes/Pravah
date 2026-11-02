import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../store/slices/authSlice";

const SignOutIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"
    />
  </svg>
);

const Sidebar = ({ open, setOpen, userRole }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { authUser } = useSelector((state) => state.auth);

  const initials =
    authUser?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  const handleLogout = () => {
    dispatch(logout()).then(() => navigate("/login"));
  };

  const getNavigationItems = () => {
    switch (userRole) {
      case "Student":
        return [
          { name: "Home", path: "/student", icon: "home" },
          {
            name: "Submit Proposal",
            path: "/student/submit-proposal",
            icon: "document",
          },
          {
            name: "Upload Files",
            path: "/student/upload-files",
            icon: "upload",
          },
          { name: "Supervisor", path: "/student/supervisor", icon: "user" },
          { name: "Feedback", path: "/student/feedback", icon: "chat" },
          {
            name: "Notifications",
            path: "/student/notifications",
            icon: "bell",
          },
          {
            name: "Public Showcase",
            path: "/student/publication",
            icon: "globe",
          },
        ];
      case "Teacher":
        return [
          { name: "Home", path: "/teacher", icon: "home" },
          {
            name: "Pending Requests",
            path: "/teacher/pending-requests",
            icon: "clock",
          },
          {
            name: "Assigned Students",
            path: "/teacher/assigned-students",
            icon: "users",
          },
          { name: "Files", path: "/teacher/files", icon: "folder" },
          {
            name: "Notifications",
            path: "/teacher/notifications",
            icon: "bell",
          },
        ];
      case "Admin":
        return [
          { name: "Home", path: "/admin", icon: "home" },
          { name: "Manage Students", path: "/admin/students", icon: "users" },
          {
            name: "Manage Teachers",
            path: "/admin/teachers",
            icon: "academic",
          },
          {
            name: "Assign Supervisor",
            path: "/admin/assign-supervisor",
            icon: "link",
          },
          { name: "Deadlines", path: "/admin/deadlines", icon: "calendar" },
          { name: "Projects", path: "/admin/projects", icon: "folder" },
          {
            name: "Publication Requests",
            path: "/admin/publication-requests",
            icon: "globe",
          },
          {
            name: "Notifications",
            path: "/admin/notifications",
            icon: "bell",
          },
        ];
      default:
        return [];
    }
  };

  const getIcon = (iconName, isActive = false) => {
    const className = `w-5 h-5 ${
      isActive ? "text-blue-600" : "text-slate-600"
    }`;

    switch (iconName) {
      case "home":
        return (
          <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 10.5 12 3l9 7.5" />
            <path d="M5 9.5V20h14V9.5" />
          </svg>
        );
      case "document":
        return (
          <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7 3.5h7l5 5V19a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 6 19V5a1.5 1.5 0 0 1 1.5-1.5Z" />
            <path d="M14 3.5V9h5" />
            <path d="M8.5 13h7" />
            <path d="M8.5 16.5h7" />
          </svg>
        );
      case "upload":
        return (
          <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 16V4" />
            <path d="m7 9 5-5 5 5" />
            <path d="M4 18.5v1a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 19.5v-1" />
          </svg>
        );
      case "user":
        return (
          <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="8" r="3.5" />
            <path d="M5 19a7 7 0 0 1 14 0" />
          </svg>
        );
      case "chat":
        return (
          <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 18.5 3.5 20V6.5A2.5 2.5 0 0 1 6 4h12a2.5 2.5 0 0 1 2.5 2.5v7A2.5 2.5 0 0 1 18 16H9l-3 2.5Z" />
            <path d="M8 9h8" />
            <path d="M8 12.5h6" />
          </svg>
        );
      case "bell":
        return (
          <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18H5.5A1.5 1.5 0 0 1 4 16.5V15l2-2V10a6 6 0 1 1 12 0v3l2 2v1.5a1.5 1.5 0 0 1-1.5 1.5H15" />
            <path d="M10 20a2 2 0 0 0 4 0" />
          </svg>
        );
      case "clock":
        return (
          <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="8" />
            <path d="M12 7.5v5l3 1.5" />
          </svg>
        );
      case "users":
        return (
          <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M16 19v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1" />
            <circle cx="10" cy="7" r="3" />
            <path d="M20 19v-1a4 4 0 0 0-3-3.87" />
            <path d="M16 4.13a4 4 0 0 1 0 7.75" />
          </svg>
        );
      case "folder":
        return (
          <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6H9l1.4 2H18.5A2.5 2.5 0 0 1 21 10.5v7A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5v-9Z" />
          </svg>
        );
      case "academic":
        return (
          <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3.5 9.5 12 5l8.5 4.5L12 14 3.5 9.5Z" />
            <path d="M7 11.5v4.2c0 .5.4.9.9.9H12c3.7 0 6.5-2 8-4.4" />
            <path d="M12 14v5" />
          </svg>
        );
      case "link":
        return (
          <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.5 13.5 8 16a3 3 0 1 1-4.2-4.2l2.5-2.5A3 3 0 0 1 9.5 8.5" />
            <path d="M13.5 10.5 16 8a3 3 0 1 1 4.2 4.2l-2.5 2.5A3 3 0 0 1 14.5 15.5" />
            <path d="M9 15l6-6" />
          </svg>
        );
      case "calendar":
        return (
          <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3.5" y="5.5" width="17" height="15" rx="2" />
            <path d="M7.5 3.5v4" />
            <path d="M16.5 3.5v4" />
            <path d="M3.5 9.5h17" />
          </svg>
        );
      case "globe":
        return (
          <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="8.5" />
            <path d="M3.5 12h17M12 3.5c2.2 2.4 3.3 5.2 3.3 8.5S14.2 18.1 12 20.5c-2.2-2.4-3.3-5.2-3.3-8.5S9.8 5.9 12 3.5Z" />
          </svg>
        );
      default:
        return (
          <svg
            className={className}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7h16z"
            />
          </svg>
        );
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <>
      <div
        className={`fixed -left-full lg:left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-slate-200 transition-all duration-300 z-30 ${
          open ? "w-64" : "w-20"
        }`}
      >
        <div className="flex flex-col h-full">
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigationItems.map((item) => {
              const isRootMenuItem =
                item.path === "/student" ||
                item.path === "/teacher" ||
                item.path === "/admin";

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={isRootMenuItem}
                  className={({ isActive }) => `
                    flex items-center px-4 py-3 rounded-lg transition-all duration-200 border
                    ${
                      isActive
                        ? "bg-slate-100 text-slate-900 border-blue-200 shadow-sm"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 border-transparent"
                    }
                  `}
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      setOpen(false);
                    }
                  }}
                >
                  <div className="flex-shrink-0">
                    {getIcon(item.icon, location.pathname === item.path)}
                  </div>
                  <span
                    className={`ml-3 font-medium transition-opacity duration-300 ${
                      open ? "opacity-100" : "opacity-0 lg:opacity-0"
                    } ${open ? "block" : "hidden lg:hidden"}`}
                  >
                    {item.name}
                  </span>
                </NavLink>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-200 space-y-3">
            <div
              className={`flex items-center ${
                open ? "gap-3" : "flex-col gap-2"
              }`}
            >
              <div
                title={authUser?.name}
                className="w-9 h-9 shrink-0 bg-blue-500 rounded-full flex items-center justify-center text-sm font-medium text-white"
              >
                {initials}
              </div>
              {open && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {authUser?.name}
                  </p>
                  <p className="text-xs text-slate-500 capitalize">
                    {authUser?.role}
                  </p>
                </div>
              )}
              <button
                type="button"
                onClick={handleLogout}
                title="Sign out"
                aria-label="Sign out"
                className="shrink-0 rounded-lg p-2 text-slate-600 transition hover:bg-red-50 hover:text-red-600"
              >
                <SignOutIcon />
              </button>
            </div>
            {open && (
              <p className="text-xs font-normal tracking-wide text-slate-500 text-center">
                Pravah • Connect ideas
              </p>
            )}
          </div>
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        ></div>
      )}

      <div
        className={`fixed inset-y-0 left-0 w-64 bg-white z-50 lg:hidden transform transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full pt-16">
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigationItems.map((item) => {
              const isRootMenuItem =
                item.path === "/student" ||
                item.path === "/teacher" ||
                item.path === "/admin";

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={isRootMenuItem}
                  className={({ isActive }) => `
              flex items-center px-4 py-3 rounded-lg transition-all duration-200
              ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-700 hover:bg-slate-100 hover:text-blue-600"
              }
            `}
                  onClick={() => setOpen(false)}
                >
                  <div className="flex-shrink-0">
                    {getIcon(item.icon, location.pathname === item.path)}
                  </div>
                  <span className="ml-3 font-medium">{item.name}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-200 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 shrink-0 bg-blue-500 rounded-full flex items-center justify-center text-sm font-medium text-white">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">
                  {authUser?.name}
                </p>
                <p className="text-xs text-slate-500 capitalize">
                  {authUser?.role}
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title="Sign out"
                aria-label="Sign out"
                className="shrink-0 rounded-lg p-2 text-slate-600 transition hover:bg-red-50 hover:text-red-600"
              >
                <SignOutIcon />
              </button>
            </div>
            <p className="text-xs font-normal tracking-wide text-slate-500 text-center">
              Pravah • Connect ideas
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;