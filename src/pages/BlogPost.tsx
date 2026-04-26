import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Calendar,
  User,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import {
  getArticleBySlug,
  getRelatedArticles,
} from "@/data/educationArticles";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const SidebarCTA = () => (
  <Card className="glass-card border-primary/30">
    <CardContent className="p-6 text-center">
      <div className="w-12 h-12 mx-auto rounded-full bg-primary/15 flex items-center justify-center mb-4">
        <Shield className="w-6 h-6 text-primary" />
      </div>
      <h3 className="font-display font-bold text-lg mb-2">
        Claim Your Face
      </h3>
      <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
        Register your verified voice and image in the ClaimMyFace registry —
        free to start.
      </p>
      <Button asChild className="w-full font-display glow-red">
        <Link to="/signup">
          Register Free <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </Button>
    </CardContent>
  </Card>
);

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? getArticleBySlug(slug) : undefined;

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container px-4 pt-24 pb-16 max-w-3xl">
          <Button asChild variant="ghost" size="sm" className="mb-6">
            <Link to="/education">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Education
            </Link>
          </Button>
          <div className="text-center text-muted-foreground py-20">
            <p className="text-lg">Article not found.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const related = getRelatedArticles(article);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container px-4 pt-24 pb-16">
        <Button asChild variant="ghost" size="sm" className="mb-6">
          <Link to="/education">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Education
          </Link>
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-10"
        >
          {/* Main column */}
          <article className="min-w-0">
            {/* Hero */}
            <header className="mb-10 pb-8 border-b border-border/40">
              <Badge variant="secondary" className="mb-4 capitalize">
                {article.category}
              </Badge>
              <h1 className="font-display text-3xl md:text-5xl font-bold leading-tight mb-4">
                {article.title}
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                {article.subtitle}
              </p>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <User className="w-4 h-4" /> {article.author}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" /> {formatDate(article.publishDate)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> {article.readTime}
                </span>
              </div>
            </header>

            {/* Body */}
            <div className="space-y-10">
              {article.sections.map((section, i) => (
                <section key={i}>
                  <h2 className="font-display text-2xl md:text-3xl font-bold text-primary mb-4">
                    {section.heading}
                  </h2>
                  <div className="space-y-4">
                    {section.body.map((p, j) => (
                      <p
                        key={j}
                        className="text-foreground/90 leading-relaxed text-base md:text-[1.0625rem]"
                      >
                        {p}
                      </p>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            {/* FAQ */}
            <section className="mt-16">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-primary mb-6">
                Frequently Asked Questions
              </h2>
              <Accordion type="single" collapsible className="w-full">
                {article.faqs.map((faq, i) => (
                  <AccordionItem
                    key={i}
                    value={`faq-${i}`}
                    className="border-border/40"
                  >
                    <AccordionTrigger className="text-left font-display font-semibold text-base md:text-lg hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed text-base">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>

            {/* Mobile CTA (sidebar shows on lg+) */}
            <div className="mt-12 lg:hidden">
              <SidebarCTA />
            </div>

            {/* Related */}
            {related.length > 0 && (
              <section className="mt-16">
                <h2 className="font-display text-2xl md:text-3xl font-bold mb-6">
                  Related Articles
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {related.slice(0, 3).map((r) => (
                    <Link
                      key={r.slug}
                      to={`/education/${r.slug}`}
                      className="group"
                    >
                      <Card className="glass-card border-border/30 hover:border-primary/50 transition-all h-full">
                        <CardContent className="p-5">
                          <Badge variant="secondary" className="mb-3 capitalize">
                            {r.category}
                          </Badge>
                          <h3 className="font-display font-semibold text-base mb-2 leading-snug group-hover:text-primary transition-colors">
                            {r.title}
                          </h3>
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {r.readTime}
                          </span>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </article>

          {/* Sidebar (desktop only) */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <SidebarCTA />
            </div>
          </aside>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default BlogPost;
