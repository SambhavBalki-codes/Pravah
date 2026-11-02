import { Outlet } from "react-router-dom";
import { useState } from "react";
import Navbar from "./Navbar";

const VisitorLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 pt-[66px]">
      <Navbar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        showMenu={false}
      />
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default VisitorLayout;
