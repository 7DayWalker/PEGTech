/** Booking page — schedule a consultation. */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTitle } from "../lib/useTitle";
import { api } from "../lib/api";
import { useToast } from "../lib/Toast";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Card, CardHeader, CardTitle, CardDescription } from "../components/Card";
import { Container } from "../components/Section";
import { Badge } from "../components/Badge";
import { Calendar } from "lucide-react";

const SLOTS = ["09:00", "10:30", "12:00", "13:30", "15:00", "16:30"];

export function Book() {
  useTitle("Book a Call — PEGTech");
  const navigate = useNavigate();
  const { show } = useToast();
  const [form] = useState({
    name: "",
    email: "",
    phone: "",
    service: "",
    day: "",
    slot: "",
  });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post("/api/public/bookings", {
        name: form.name,
        email: form.email,
        phone: form.phone,
        day: form.day,
        slot: form.slot,
        service: form.service,
      });
      if (res.ok) {
        show(
          "Booking confirmed! We'll send a confirmation email shortly.",
          "success"
        );
        navigate("/");
      }
    } catch {
      show("Failed to book. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-dark-900 text-slate-100">
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-dark-900/80 backdrop-blur-md">
        <Container>
          <div className="flex items-center justify-between h-16">
            <Link
              to="/"
              className="flex items-center gap-2 font-bold text-xl tracking-tight"
            >
              <span className="text-accent">P</span>EG<span className="text-white">Tech</span>
            </Link>
            <div className="ml-auto flex items-center gap-3">
              <Link
                to="/"
                className="text-slate-400 hover:text-white transition-colors"
              >
                ← Back to Home
              </Link>
              <Link to="/book" className="btn variant-primary size-sm hidden md:block">
                Book a Call
              </Link>
            </div>
          </div>
        </Container>
      </nav>

      <main className="flex-1 py-16">
        <Container>
          <section className="max-w-xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-4 inline-block">Schedule a Consultation</Badge>
              <h1 className="text-3xl font-bold text-slate-100 mb-4">
                Book a Discovery Call
              </h1>
              <p className="text-slate-400">
                Schedule a 30-minute discovery call with our team. We'll discuss your
                project needs and how we can help you grow.
              </p>
            </div>

            <Card padding="lg" className="max-w-md mx-auto">
              <CardHeader className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={20} className="text-accent" />
                  <CardTitle>Booking Form</CardTitle>
                </div>
                <CardDescription>
                  Tell us about your project so we can prepare for our call.
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <Input
                    label="Full name"
                    placeholder="Jane Doe"
                    value={form.name}
                    onChange={(e) => {
                      form.name = e.target.value;
                    }}
                    required
                  />
                  <Input
                    label="Email"
                    type="email"
                    placeholder="jane@company.com"
                    value={form.email}
                    onChange={(e) => {
                      form.email = e.target.value;
                    }}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    label="Phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={form.phone}
                    onChange={(e) => {
                      form.phone = e.target.value;
                    }}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Service of interest
                  </label>
                  <select
                    className="block w-full rounded-xl border border-input bg-dark-900/50 px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
                    value={form.service}
                    onChange={(e) => {
                      form.service = e.target.value;
                    }}
                  >
                    <option value="">Select a service</option>
                    <option value="Web Development">Web Development</option>
                    <option value="AI Solutions">AI Solutions</option>
                    <option value="Digital Marketing">Digital Marketing</option>
                    <option value="Brand & Design">Brand & Design</option>
                    <option value="Tech Consulting">Tech Consulting</option>
                  </select>
                </div>
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Input
                      label="Preferred date"
                      type="date"
                      min={new Date().toISOString().split("T")[0]}
                      value={form.day}
                      onChange={(e) => {
                        form.day = e.target.value;
                      }}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Preferred time
                    </label>
                    <select
                      className="block w-full rounded-xl border border-input bg-dark-900/50 px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
                      value={form.slot}
                      onChange={(e) => {
                        form.slot = e.target.value;
                      }}
                    >
                      <option value="">Select a time</option>
                      {SLOTS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={submitting}
                  className="w-full py-3"
                >
                  {submitting ? "Booking…" : "Confirm Booking"}
                </Button>
              </form>
            </Card>
          </section>
        </Container>
      </main>

      <Footer />
    </div>
  );
}

import { Footer } from "../components/Footer";
