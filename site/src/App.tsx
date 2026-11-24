/**
 * PEGTech frontend — main app with routing.
 */
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { ToastProvider } from "./lib/Toast"
import { Home } from "./pages/Home"
import { Services } from "./pages/Services"
import { Book } from "./pages/Book"
import { Audit } from "./pages/Audit"
import { Careers } from "./pages/Careers"
import { SignIn } from "./pages/SignIn"
import { ClientPortal } from "./pages/ClientPortal"
import { AdminPortal } from "./pages/AdminPortal"
import { NotFound } from "./pages/NotFound"

function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/book" element={<Book />} />
          <Route path="/audit" element={<Audit />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/client-portal" element={<ClientPortal />} />
          <Route path="/admin" element={<AdminPortal />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ToastProvider>
  )
}

export default App
