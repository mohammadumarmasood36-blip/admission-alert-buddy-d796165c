import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import { useState } from "react";

const contactInfo = [
  { icon: MapPin, label: "Address", value: "Loharsan, Motipur, District Sant Kabir Nagar, Uttar Pradesh 272153" },
  { icon: Phone, label: "Phone", value: "+91 9838276035 / +91 9161438472" },
  { icon: Mail, label: "Email", value: "info@universalpublicschool.edu" },
  { icon: Clock, label: "Office Hours", value: "Mon – Fri: 8:00 AM – 4:00 PM" },
];

const ContactSection = () => {
  const [focused, setFocused] = useState<string | null>(null);

  return (
    <section id="contact" className="py-28 bg-background relative overflow-hidden">
      <div className="absolute top-0 left-1/2 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />

      <div className="container px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <p className="text-secondary font-semibold tracking-widest uppercase text-xs mb-4">Get In Touch</p>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Contact <span className="text-gradient">Us</span>
          </h2>
          <div className="section-divider mb-6" />
          <p className="text-muted-foreground text-lg">
            We'd love to hear from you. Reach out for admissions, queries, or to schedule a campus visit.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {contactInfo.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  whileHover={{ y: -4, boxShadow: "var(--card-shadow-hover)" }}
                  className="bg-card rounded-2xl p-6 border border-border transition-all duration-300"
                  style={{ boxShadow: "var(--card-shadow)" }}
                >
                  <motion.div
                    whileHover={{ rotate: 10 }}
                    className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-4"
                  >
                    <item.icon className="w-5 h-5 text-secondary" />
                  </motion.div>
                  <p className="font-semibold text-foreground text-sm mb-1">{item.label}</p>
                  <p className="text-muted-foreground text-xs leading-relaxed">{item.value}</p>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="rounded-2xl overflow-hidden border border-border"
              style={{ boxShadow: "var(--card-shadow)" }}
            >
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3554.956822696179!2d82.99615067544248!3d26.999915576595356!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3996d31b806b0e99%3A0x15d401e6d0ffd0c9!2sUniversal%20Public%20School!5e0!3m2!1sen!2sin!4v1773808848633!5m2!1sen!2sin"
                width="100%"
                height="250"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Universal Public School Location"
                className="w-full"
              />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="bg-card rounded-2xl p-8 border border-border"
            style={{ boxShadow: "var(--card-shadow)" }}
          >
            <h3 className="font-display text-2xl font-bold text-foreground mb-6">Send a Message</h3>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-2 gap-4">
                {[{ name: "name", placeholder: "Your Name" }, { name: "email", placeholder: "Email Address" }].map(f => (
                  <div key={f.name} className="relative">
                    <input
                      type={f.name === "email" ? "email" : "text"}
                      placeholder={f.placeholder}
                      onFocus={() => setFocused(f.name)}
                      onBlur={() => setFocused(null)}
                      className={`w-full px-4 py-3 rounded-xl bg-muted border text-foreground text-sm placeholder:text-muted-foreground/50 outline-none transition-all duration-300 ${
                        focused === f.name ? "border-secondary shadow-[0_0_0_3px_hsla(40,60%,55%,0.15)]" : "border-border"
                      }`}
                    />
                  </div>
                ))}
              </div>
              <input
                type="text"
                placeholder="Subject"
                onFocus={() => setFocused("subject")}
                onBlur={() => setFocused(null)}
                className={`w-full px-4 py-3 rounded-xl bg-muted border text-foreground text-sm placeholder:text-muted-foreground/50 outline-none transition-all duration-300 ${
                  focused === "subject" ? "border-secondary shadow-[0_0_0_3px_hsla(40,60%,55%,0.15)]" : "border-border"
                }`}
              />
              <textarea
                rows={4}
                placeholder="Your Message"
                onFocus={() => setFocused("message")}
                onBlur={() => setFocused(null)}
                className={`w-full px-4 py-3 rounded-xl bg-muted border text-foreground text-sm placeholder:text-muted-foreground/50 outline-none resize-none transition-all duration-300 ${
                  focused === "message" ? "border-secondary shadow-[0_0_0_3px_hsla(40,60%,55%,0.15)]" : "border-border"
                }`}
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full bg-secondary text-secondary-foreground font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all"
                style={{ boxShadow: "var(--gold-glow)" }}
              >
                Send Message <Send className="w-4 h-4" />
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;