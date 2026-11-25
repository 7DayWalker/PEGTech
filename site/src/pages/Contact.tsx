/** Contact page — contact form and contact info. */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTitle } from "../lib/useTitle";
import { useToast } from "../lib/Toast";
import { api } from "../lib/api";
import { Button } from "../components/Button";
import { Input, Textarea, Select } from "../components/Input";
import { Card } from "../components/Card";
import { Container, SectionHeader } from "../components/Section";
import { Badge } from "../components/Badge";
import { Mail, Phone, Globe } from "lucide-react";

const SERVICES = [
  "Web Development",
  "Mobile Apps",
  "AI Solutions",
  "Digital Marketing",
  "Brand & Design",
  "Tech Consulting",
  "Not sure yet",
];

export function Contact() {
  useTitle("Contact — PEGTech");
  const navigate = useNavigate();
  const { show } = useToast();
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    service: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post("/api/public/contact", form);
      if (res.ok) {
        show("Thanks! We'll get back to you within 24 hours.", "success");
        navigate("/");
      } else {
        show("Message failed to send. Please try again.", "error");
      }
    } catch {
      show("Message failed to send. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex-1 py-24">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <section>
              <SectionHeader className="text-left mb-0">
                <Badge variant="accent" className="mb-4 inline-block">Get in Touch</Badge>
                <h1 className="text-3xl font-bold text-white mb-4">Contact Us</h1>
                <p className="text-gray-400">
                  Have a project in mind? Fill out the form and we'll reach out to
                  discuss how we can help.
                </p>
              </SectionHeader>

              <div className="mt-12 space-y-8">
                <div className="flex items-start gap-4">
                  <Mail size={24} className="text-gemini-blue mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-bold text-white">Email</h3>
                    <p className="text-gray-400 text-sm">hello@pegtech.co</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Phone size={24} className="text-gemini-blue mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-bold text-white">Phone</h3>
                    <p className="text-gray-400 text-sm">+234 801 234 5678</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Globe size={24} className="text-gemini-blue mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-bold text-white">Location</h3>
                    <p className="text-gray-400 text-sm">
                      Lagos, Nigeria<br />
                      Serving clients worldwide
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <a
                    href="https://wa.me/2348012345678"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3"
                  >
                    <span className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">WA</span>
                    <div>
                      <h3 className="font-bold text-white">WhatsApp</h3>
                      <p className="text-gray-400 text-sm">Meta-verified business</p>
                    </div>
                  </a>
                </div>
              </div>
            </section>

            {/* Contact Form */}
            <Card padding="lg">
              <SectionHeader className="text-left mb-8">
                <Badge variant="accent" className="mb-4 inline-block">Send a Message</Badge>
                <h2 className="text-2xl font-bold text-white mb-2">Tell us about your project</h2>
              </SectionHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
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
                  label="Company (optional)"
                  placeholder="Acme Corp"
                  value={form.company}
                  onChange={(e) => update("company", e.target.value)}
                />
                <Select
                  label="Service of interest"
                  value={form.service}
                  onChange={(e) => update("service", e.target.value)}
                >
                  <option value="">Select a service</option>
                  {SERVICES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
                <Textarea
                  label="Message"
                  rows={5}
                  placeholder="Tell us about your project, timeline, and budget..."
                  value={form.message}
                  onChange={(e) => update("message", e.target.value)}
                  required
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={submitting}
                  className="w-full"
                >
                  {submitting ? "Sending…" : "Send Message"}
                </Button>
              </form>
            </Card>
          </div>
        </Container>
      </div>
  );
}
