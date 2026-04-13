import { motion } from "framer-motion";
import { Phone } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqLeft = [
  { q: "What age groups do you cater to?", a: "We provide programs for children across different age groups, including pre-primary, primary, juniors, and seniors." },
  { q: "What makes your teaching methods unique?", a: "Our approach focuses on holistic development through innovative teaching methods that emphasize curiosity, confidence, and compassion." },
  { q: "Do you organize extra curricular activities?", a: "Yes, we offer a variety of extra curricular activities, including sports, art, music, and public speaking, to nurture well-rounded individuals." },
];

const faqRight = [
  { q: "When do admissions open for the new session?", a: "Admissions are now open! Secure your child's seat by applying early for the upcoming academic session." },
  { q: "What facilities does the school offer?", a: "We provide smart classes, modern labs, co-curricular activities, experienced faculty, a library, sports grounds, and a safe campus." },
  { q: "How can I apply for admission?", a: "You can visit our school office at Loharsan, Motipur, District Sant Kabir Nagar or apply online through our website." },
  { q: "Do you provide transportation facilities?", a: "Yes, we offer safe and reliable school transportation covering all major areas around Motipur and Sant Kabir Nagar." },
  { q: "What curriculum does the school follow?", a: "We follow a structured curriculum designed for holistic development and academic excellence aligned with national standards." },
  { q: "How can parents stay updated with school activities?", a: "We regularly update parents through newsletters, our mobile app, social media, and parent-teacher meetings." },
];

const FAQSection = () => (
  <section id="faq" className="py-24 bg-muted/30 relative overflow-hidden">
    <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl translate-y-1/2 translate-x-1/2" />

    <div className="container px-4 relative">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-14"
      >
        <p className="text-secondary font-semibold tracking-widest uppercase text-xs mb-3">Popular Questions</p>
        <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-3">
          Your Queries <span className="text-gradient">Answered</span>
        </h2>
        <div className="section-divider mb-4" />
        <p className="text-muted-foreground max-w-xl mx-auto">
          Learn more about our programs, admissions, and services
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="space-y-4"
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqLeft.map((item, i) => (
              <AccordionItem
                key={i}
                value={`left-${i}`}
                className="bg-card border border-border rounded-xl px-5 overflow-hidden"
              >
                <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline hover:text-secondary">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-secondary rounded-xl p-6 text-center mt-6"
            style={{ boxShadow: "var(--gold-glow)" }}
          >
            <Phone className="w-8 h-8 text-secondary-foreground mx-auto mb-2" />
            <p className="text-secondary-foreground font-bold text-sm mb-1">Call Us Any Time!</p>
            <a href="tel:+919838276035" className="text-secondary-foreground/80 text-lg font-bold hover:underline">
              +91 9838276035
            </a>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqRight.map((item, i) => (
              <AccordionItem
                key={i}
                value={`right-${i}`}
                className="bg-card border border-border rounded-xl px-5 overflow-hidden"
              >
                <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline hover:text-secondary">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </div>
  </section>
);

export default FAQSection;