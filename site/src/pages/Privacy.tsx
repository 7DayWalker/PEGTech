/** Privacy Policy page — required for Meta App publishing + general compliance. */
import { useTitle } from "../lib/useTitle";
import { Container, Section } from "../components/Section";
import { GlowBackground } from "../components/GlowBackground";

export function Privacy() {
  useTitle("Privacy Policy — PEGTech");

  return (
    <Section py={24} className="relative overflow-hidden">
      <GlowBackground />
      <Container className="relative max-w-3xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mb-10">Last updated: {new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}</p>

        <div className="prose prose-invert prose-slate max-w-none space-y-8 text-slate-300">
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">Who we are</h2>
            <p>
              PEGTech is a trading name of PAUL EDISON LIMITED (RC 1833166), a company
              operating in Nigeria. This policy explains what information we collect when
              you interact with our website, contact forms, email, and WhatsApp Business
              channel, and how we use it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">Information we collect</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Contact details you provide directly: name, email address, phone number, company/business name, and project details, via our contact form, booking form, or WhatsApp.</li>
              <li>Messages you send us by email or WhatsApp, so we can respond and keep a record of our conversation with you.</li>
              <li>Basic technical information (such as browser type and pages visited) collected automatically to keep the site working correctly.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">How we use your information</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>To respond to enquiries, quote and deliver projects, and manage our working relationship with you.</li>
              <li>To send you updates about a project or engagement you've asked us about, by email or WhatsApp.</li>
              <li>To improve our services and website.</li>
            </ul>
            <p className="mt-2">We do not sell your personal information to third parties.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">WhatsApp Business Platform</h2>
            <p>
              We use the WhatsApp Business Platform (provided by Meta) to send and receive
              messages with clients and leads who choose to contact us via WhatsApp. Message
              content, delivery status, and your WhatsApp phone number are processed by Meta
              in order to deliver this service, and are also stored in our own systems so our
              team can see and respond to your conversation history. You can opt out of
              WhatsApp communication from us at any time by telling us so in a message.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">How long we keep information</h2>
            <p>
              We retain enquiry, lead, and client records for as long as needed to provide our
              services and meet our legal and accounting obligations, after which it is
              deleted or anonymized.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">Your rights</h2>
            <p>
              You can ask us what personal information we hold about you, ask us to correct
              it, or ask us to delete it, by emailing us using the address below. See our{" "}
              <a href="/data-deletion" className="text-brand-400 underline">Data Deletion</a>{" "}
              page for how to request deletion specifically.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">Contact us</h2>
            <p>
              For any privacy question or request, contact us via the{" "}
              <a href="/contact" className="text-brand-400 underline">Contact page</a> on this
              site.
            </p>
          </section>
        </div>
      </Container>
    </Section>
  );
}
