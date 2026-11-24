/** Page layout wrapper with Nav and Footer. */
import { Outlet, useLocation } from "react-router-dom";
import { Nav } from "./Nav";
import { Footer } from "./Footer";

export function Layout() {
  const location = useLocation();
  const isAuthPage = location.pathname.startsWith("/signin") || location.pathname === "/signup";

  return (
    <div className="min-h-screen flex flex-col bg-dark-900 text-slate-100">
      {!isAuthPage && <Nav />}
      <main className="flex-1">
        <Outlet />
      </main>
      {!isAuthPage && <Footer />}
    </div>
  );
}
