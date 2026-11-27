/** Page layout wrapper with Nav, Footer, and the public AI CSR chat widget. */
import { Outlet, useLocation } from "react-router-dom";
import { Nav } from "./Nav";
import { Footer } from "./Footer";
import { ChatWidget } from "./ChatWidget";

export function Layout() {
  const location = useLocation();
  const isAuthPage = location.pathname.startsWith("/signin") || location.pathname === "/signup";
  // The CSR widget talks to anonymous website visitors — it has no place
  // on the staff-only admin pages (which happen to share this same
  // Layout for Nav/Footer), so it's scoped to public pages only.
  const isAdminPage = location.pathname.startsWith("/admin");

  return (
    <div className="min-h-screen flex flex-col bg-dark-900 text-slate-100">
      {!isAuthPage && <Nav />}
      <main className="flex-1">
        <Outlet />
      </main>
      {!isAuthPage && <Footer />}
      {!isAuthPage && !isAdminPage && <ChatWidget />}
    </div>
  );
}
