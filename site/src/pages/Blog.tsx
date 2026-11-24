/** Blog page — articles and insights. */
import { Link } from "react-router-dom";
import { useTitle } from "../lib/useTitle";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { Container, SectionHeader } from "../components/Section";
import { Badge } from "../components/Badge";
import { Clock, ArrowRight } from "lucide-react";

const ARTICLES = [
  {
    title: "5 Ways AI Can Reduce Revenue Leak in Your Business",
    excerpt: "Slow lead response, dead leads, and ad waste are costing you money. Here's how AI finds and fixes them.",
    date: "Nov 20, 2026",
    readTime: "5 min read",
    category: "AI",
  },
  {
    title: "Why Nigerian SMEs Need a Mobile App in 2026",
    excerpt: "Mobile-first isn't optional anymore. See how a custom app can transform your customer engagement.",
    date: "Nov 15, 2026",
    readTime: "6 min read",
    category: "Mobile Apps",
  },
  {
    title: "CAN-SPAM Compliance for Nigerian Businesses",
    excerpt: "What you need to know about email marketing compliance, unsubscribe handling, and avoiding penalties.",
    date: "Nov 10, 2026",
    readTime: "4 min read",
    category: "Compliance",
  },
  {
    title: "WhatsApp Business vs WhatsApp API: Which is Right for You?",
    excerpt: "Comparing the two options for business messaging and when to upgrade to the API.",
    date: "Nov 5, 2026",
    readTime: "5 min read",
    category: "WhatsApp",
  },
];

export function Blog() {
  useTitle("Blog — PEGTech");

  return (
    <div className="flex-1 py-24">
        <Container>
          <SectionHeader>
            <Badge className="mb-4 inline-block blue">Insights</Badge>
            <h1 className="text-balance">Blog</h1>
            <p className="mt-4 text-lg text-slate-400 max-w-2xl">
              Thought leadership on digital transformation, AI, and growing your
              business online.
            </p>
          </SectionHeader>

          <div className="mt-16 grid md:grid-cols-3 gap-6">
            {ARTICLES.map((article) => (
              <Card key={article.title} hover padding="lg" className="group">
                <Badge className="mb-4 inline-block blue">{article.category}</Badge>
                <h3 className="text-xl font-bold text-slate-100 mb-3 group-hover:text-blue-400 transition-colors">
                  {article.title}
                </h3>
                <p className="text-slate-400 text-sm mb-6">{article.excerpt}</p>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-slate-500" />
                    <span>{article.date}</span>
                  </div>
                  <span>{article.readTime}</span>
                </div>
                <Link
                  to="/blog"
                  className="mt-6 inline-flex items-center gap-1 text-blue-400 text-sm font-medium hover:underline group-hover:text-blue-300 transition-colors"
                >
                  Read article <ArrowRight size={16} />
                </Link>
              </Card>
            ))}
          </div>

          <div className="mt-20 text-center">
            <Badge className="mb-4 inline-block blue">Want insights delivered to your inbox?</Badge>
            <h2 className="text-2xl font-bold text-slate-100 mb-6">
              Subscribe to our newsletter
            </h2>
            <p className="text-slate-400 mb-8 max-w-lg mx-auto">
              Get the latest on AI, digital marketing, and growing your business online.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
              <Input
                placeholder="you@company.com"
                className="flex-1"
              />
              <Button variant="primary" size="sm">
                Subscribe
              </Button>
            </div>
          </div>
        </Container>
    </div>
  );
}
