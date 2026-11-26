/** Data Deletion Instructions page — required for Meta App publishing. */
import { useTitle } from "../lib/useTitle";
import { Container, Section } from "../components/Section";
import { GlowBackground } from "../components/GlowBackground";

export function DataDeletion() {
  useTitle("Data Deletion — PEGTech");

  return (
    <Section py={24} className="relative overflow-hidden">
      <GlowBackground />
      <Container className="relative max-w-3xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Data Deletion Instructions</h1>
        <p className="text-sm text-slate-500 mb-10">Last updated: {new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}</p>

        <div className="prose prose-invert prose-slate max-w-none space-y-8 text-slate-300">
          <section>
            <p>
              If you'd like us to delete the personal information we hold about you — including
              any messages, contact details, or lead/client records collected through our
              website, email, or WhatsApp Business communication — you can request this at any
              time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">How to request deletion</h2>
            <ol className="list-decimal pl-6 space-y-2">
              <li>
                Send us a message via our{" "}
                <a href="/contact" className="text-brand-400 underline">Contact page</a>, or
                reply to any email or WhatsApp conversation you've had with us, stating that
                you'd like your data deleted.
              </li>
              <li>Include the email address or phone number associated with your enquiry, so we can locate your records.</li>
              <li>
                We will confirm your request and delete your personal information from our
                systems within 30 days, except where we're required to retain certain records
                for legal, accounting, or security purposes.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">What gets deleted</h2>
            <p>
              Your name, contact details, message history, and any lead or client record tied
              to you. If you're an active client with an ongoing project, we'll discuss with
              you what can be deleted immediately versus what we need to retain until the
              engagement concludes.
            </p>
          </section>
        </div>
      </Container>
    </Section>
  );
}
