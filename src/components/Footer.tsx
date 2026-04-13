import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Facebook, Instagram, Youtube, ArrowUp, Code2, Sparkles } from "lucide-react";
import schoolLogo from "@/assets/school-logo.png";

const quickLinks = [
  { label: "About Us", href: "#about" },
  { label: "Academics", href: "#academics" },
  { label: "Gallery", href: "#gallery" },
  { label: "FAQ", href: "#faq" },
  { label: "Contact Us", href: "#contact" },
];

const schoolLinks = [
  { label: "Admissions", href: "#contact" },
  { label: "Our Goals", href: "#goals" },
  { label: "Events", href: "#events" },
  { label: "Login Portal", href: "/portal" },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const sparklePositions = [
  { top: "-6px", left: "-6px", delay: 0 },
  { top: "-6px", right: "-6px", delay: 0.7 },
  { bottom: "-6px", left: "30%", delay: 1.4 },
  { bottom: "-6px", right: "20%", delay: 0.4 },
];

const Footer = () => (
  <footer className="animated-gradient-bg py-16 relative overflow-hidden">
    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, hsla(40, 60%, 55%, 0.15) 0%, transparent 50%)" }} />
    
    <motion.div
      className="absolute top-10 right-10 w-40 h-40 rounded-full border border-secondary/5"
      animate={{ rotate: 360 }}
      transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
    />

    <div className="container px-4 relative">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="grid md:grid-cols-4 gap-10 mb-12"
      >
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-2.5 text-primary-foreground mb-4">
            <motion.img
              src={schoolLogo}
              alt="Universal Public School Logo"
              className="w-10 h-10 rounded-lg object-contain"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            />
            <span className="font-display text-lg font-bold">Universal Public School</span>
          </div>
          <p className="text-primary-foreground/50 text-sm leading-relaxed mb-4">
            Shaping futures through quality education, innovation, and holistic development since 1995.
          </p>
          <div className="flex gap-3">
            {[
              { icon: Facebook, href: "https://facebook.com" },
              { icon: Instagram, href: "https://instagram.com" },
              { icon: Youtube, href: "https://www.youtube.com/@ups.motipur" },
            ].map(({ icon: Icon, href }, i) => (
              <motion.a
                key={i}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.2, y: -3, rotate: 5 }}
                className="w-9 h-9 rounded-lg bg-primary-foreground/5 border border-primary-foreground/10 flex items-center justify-center text-primary-foreground/50 hover:text-secondary hover:border-secondary/30 transition-all"
              >
                <Icon className="w-4 h-4" />
              </motion.a>
            ))}
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <h4 className="font-display font-bold text-primary-foreground mb-4 underline-grow inline-block">Quick Links</h4>
          <div className="space-y-2 mt-2">
            {quickLinks.map(link => (
              <motion.a
                key={link.label}
                href={link.href}
                whileHover={{ x: 4 }}
                className="block text-primary-foreground/50 hover:text-secondary transition-all text-sm"
              >
                {link.label}
              </motion.a>
            ))}
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <h4 className="font-display font-bold text-primary-foreground mb-4 underline-grow inline-block">School</h4>
          <div className="space-y-2 mt-2">
            {schoolLinks.map(link => (
              <motion.a
                key={link.label}
                href={link.href}
                whileHover={{ x: 4 }}
                className="block text-primary-foreground/50 hover:text-secondary transition-all text-sm"
              >
                {link.label}
              </motion.a>
            ))}
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <h4 className="font-display font-bold text-primary-foreground mb-4 underline-grow inline-block">Get In Touch</h4>
          <div className="space-y-3 text-sm mt-2">
            <motion.a whileHover={{ x: 4 }} href="tel:+919838276035" className="flex items-start gap-2 text-primary-foreground/50 hover:text-secondary transition-all">
              <Phone className="w-4 h-4 mt-0.5 shrink-0" />
              <span>+91 9838276035</span>
            </motion.a>
            <motion.a whileHover={{ x: 4 }} href="tel:+919161438472" className="flex items-start gap-2 text-primary-foreground/50 hover:text-secondary transition-all">
              <Phone className="w-4 h-4 mt-0.5 shrink-0" />
              <span>+91 9161438472</span>
            </motion.a>
            <motion.a whileHover={{ x: 4 }} href="mailto:info@universalpublicschool.edu" className="flex items-start gap-2 text-primary-foreground/50 hover:text-secondary transition-all">
              <Mail className="w-4 h-4 mt-0.5 shrink-0" />
              <span>info@universalpublicschool.edu</span>
            </motion.a>
            <span className="flex items-start gap-2 text-primary-foreground/50">
              <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
              <span>Loharsan, Motipur, District Sant Kabir Nagar, Uttar Pradesh</span>
            </span>
          </div>
        </motion.div>
      </motion.div>

      <div className="border-t border-primary-foreground/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-primary-foreground/40 text-sm">
          © {new Date().getFullYear()} Universal Public School. All rights reserved.
        </p>
        {/* Enhanced Developer Credit Badge with Particle Background */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 30, scale: 0.8 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Floating particle field behind badge */}
          <div className="absolute -inset-12 pointer-events-none overflow-hidden">
            {Array.from({ length: 20 }).map((_, i) => {
              const size = Math.random() * 3 + 1;
              const left = Math.random() * 100;
              const top = Math.random() * 100;
              const duration = Math.random() * 4 + 3;
              const delay = Math.random() * 3;
              return (
                <motion.div
                  key={`particle-${i}`}
                  className="absolute rounded-full"
                  style={{
                    width: size,
                    height: size,
                    left: `${left}%`,
                    top: `${top}%`,
                    background: i % 3 === 0
                      ? "hsla(40, 80%, 60%, 0.6)"
                      : i % 3 === 1
                      ? "hsla(40, 60%, 55%, 0.4)"
                      : "hsla(220, 50%, 70%, 0.3)",
                  }}
                  animate={{
                    y: [0, -20 - Math.random() * 30, 0],
                    x: [0, (Math.random() - 0.5) * 20, 0],
                    opacity: [0, 0.8, 0],
                    scale: [0.5, 1.2, 0.5],
                  }}
                  transition={{
                    duration,
                    repeat: Infinity,
                    delay,
                    ease: "easeInOut",
                  }}
                />
              );
            })}
            {/* Soft radial glow behind badge */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: "radial-gradient(ellipse at center, hsla(40, 60%, 55%, 0.1) 0%, transparent 70%)",
              }}
              animate={{
                opacity: [0.4, 0.8, 0.4],
                scale: [0.9, 1.1, 0.9],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          <motion.div
            className="credit-badge group cursor-default relative"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            {/* Sparkle particles */}
            {sparklePositions.map((pos, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={pos}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: pos.delay,
                  ease: "easeInOut",
                }}
              >
                <Sparkles className="w-3 h-3 text-secondary/60" />
              </motion.div>
            ))}

            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Code2 className="w-4 h-4 text-secondary/70" />
            </motion.div>

            <div className="flex flex-col items-start leading-tight">
              <span className="credit-label">Designed & Developed by</span>
              <motion.span
                className="credit-name"
                animate={{ 
                  textShadow: [
                    "0 0 8px hsla(40, 60%, 55%, 0.2)",
                    "0 0 16px hsla(40, 60%, 55%, 0.5)",
                    "0 0 8px hsla(40, 60%, 55%, 0.2)",
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                Mohammad Umar Masood
              </motion.span>
            </div>

            <motion.div
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            >
              <Sparkles className="w-4 h-4 text-secondary/60" />
            </motion.div>
          </motion.div>
        </motion.div>
        <div className="flex gap-6 text-primary-foreground/40 text-sm">
          <a href="#" className="hover:text-secondary transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-secondary transition-colors">Terms of Service</a>
        </div>
      </div>

      <motion.a
        href="#home"
        whileHover={{ scale: 1.1, y: -3 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center glow-secondary"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <ArrowUp className="w-5 h-5" />
      </motion.a>
    </div>
  </footer>
);

export default Footer;