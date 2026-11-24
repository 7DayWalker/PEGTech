/** PEGTech frontend — routing with Layout wrapper. */
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Services } from "./pages/Services";
import { Work } from "./pages/Work";
import { About } from "./pages/About";
import { Contact } from "./pages/Contact";
import { FAQ } from "./pages/FAQ";
import { Blog } from "./pages/Blog";
import { Book } from "./pages/Book";
import { Audit } from "./pages/Audit";
import { Careers } from "./pages/Careers";
import { SignIn } from "./pages/SignIn";
import { AdminPortal } from "./pages/AdminPortal";
import { NotFound } from "./pages/NotFound";
import { ChatWidget } from "./components/ChatWidget";

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/work" element={<Work />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/book" element={<Book />} />
          <Route path="/audit" element={<Audit />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/admin" element={<AdminPortal />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="/chat-widget" element={<ChatWidget />} />
      </Routes>
    </Router>
  );
}

export default App;
