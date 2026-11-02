import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../store/slices/authSlice";
import logoImage from "../../assets/Logo.avif";
import { fetchUnreadCount } from "../../store/slices/notificationSlice";

const Navbar = ({ sidebarOpen, setSidebarOpen, showMenu = true }) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { authUser } = useSelector((state) => state.auth);
  const unreadCount = useSelector((state) => state.notification.unreadCount);
  const hasBell = ["Student", "Teacher", "Admin"].includes(authUser?.role);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    if (!hasBell) return undefined;
    dispatch(fetchUnreadCount());
    const timer = setInterval(() => dispatch(fetchUnreadCount()), 60000);
    return () => clearInterval(timer);
  }, [dispatch, hasBell]);

  const handleLogout = async () => {
    setProfileDropdownOpen(false);
    setNotificationsOpen(false);
    try {
      await dispatch(logout()).unwrap();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  const getInitials = (name) => {
    return (
      name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "U"
    );
  };

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200 fixed w-full top-0 z-30">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {showMenu && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {sidebarOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            )}

            <div className={`flex items-center ${showMenu ? "ml-4" : ""}`}>
              <div className="flex-shrink-0 flex items-center">
                <img
                  src={logoImage}
                  alt="Pravah Logo"
                  className="h-14 w-14 rounded-lg object-cover border border-slate-200"
                />
                <div className="ml-3 hidden sm:block">
                  <h1 className="text-[1.8rem] font-bold tracking-wide text-slate-800">
                    Pravah
                  </h1>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {hasBell && (
              <button
                type="button"
                onClick={() => navigate(`/${authUser.role.toLowerCase()}/notifications`)}
                aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
                className="relative rounded-full p-2 text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <svg
                  className="h-5 w-5"
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
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="hidden sm:inline-flex items-center justify-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-200 rounded-full hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all duration-200 shadow-sm"
            >
              <svg
                className="w-4 h-4"
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
              Sign out
            </button>

            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {getInitials(authUser?.name)}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-slate-800">
                    {authUser?.name}
                  </p>
                  <p className="text-xs text-slate-500 capitalize">
                    {authUser?.role}
                  </p>
                </div>
                <svg
                  className="w-4 h-4 text-slate-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
                  <div className="p-2">
                    <div className="px-3 py-2 border-b border-slate-200">
                      <p className="text-sm font-medium text-slate-800">
                        {authUser?.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {authUser?.email}
                      </p>
                      <p className="text-xs text-blue-600 capitalize font-medium mt-1">
                        {authUser?.role}
                      </p>
                    </div>
                    <button
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md mt-2"
                      onClick={handleLogout}
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {(profileDropdownOpen || notificationsOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setProfileDropdownOpen(false);
            setNotificationsOpen(false);
          }}
        />
      )}
    </nav>
  );
};

export default Navbar;