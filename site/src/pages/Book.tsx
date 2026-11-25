/** Booking page — schedule a consultation. */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTitle } from "../lib/useTitle";
import { api } from "../lib/api";
import { useToast } from "../lib/Toast";
import { Button } from "../components/Button";
import { Input, Select } from "../components/Input";
import { Card, CardHeader, CardTitle, CardDescription } from "../components/Card";
import { Container } from "../components/Section";
import { Badge } from "../components/Badge";
import { Calendar } from "lucide-react";

const SLOTS = ["09:00", "10:30", "12:00", "13:30", "15:00", "16:30"];
const SERVICES = [
  "Web Development",
  "Mobile Apps",
  "AI Solutions",
  "Digital Marketing",
  "Brand & Design",
  "Tech Consulting",
];

export function Book() {
  useTitle("Book a Call — PEGTech");
  const navigate = useNavigate();
  const { show } = useToast();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    service: "",
    day: "",
    slot: "",
  });
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post("/api/public/bookings", form);
      if (res.ok) {
        show("Booking confirmed! We'll send a confirmation email shortly.", "success");
        navigate("/");
      } else {
        show("Failed to book. Please try again.", "error");
      }
    } catch {
      show("Failed to book. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex-1 py-16">
        <Container>
          <section className="max-w-xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="accent" className="mb-4 inline-block">Schedule a Consultation</Badge>
              <h1 className="text-3xl font-bold text-white mb-4">
                Book a Discovery Call
              </h1>
              <p className="text-gray-400">
                Schedule a 30-minute discovery call with our team. We'll discuss your
                project needs and how we can help you grow.
              </p>
            </div>

            <Card padding="lg" className="max-w-md mx-auto">
              <CardHeader className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={20} className="text-gemini-blue" />
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
                    onChange={(e) => update("name", e.target.value)}
                    required
                  />
                  <Input
                    label="Email"
                    type="email"
                    placeholder="jane@company.com"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    required
                  />
                </div>
                <Input
                  label="Phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  required
                />
                <Select
                  label="Service of interest"
                  value={form.service}
                  onChange={(e) => update("service", e.target.value)}
                >
                  <option value="">Select a service</option>
                  {SERVICES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
                <div className="grid md:grid-cols-2 gap-5">
                  <Input
                    label="Preferred date"
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={form.day}
                    onChange={(e) => update("day", e.target.value)}
                    required
                  />
                  <Select
                    label="Preferred time"
                    value={form.slot}
                    onChange={(e) => update("slot", e.target.value)}
                  >
                    <option value="">Select a time</option>
                    {SLOTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </Select>
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
      </div>
  );
}
