import { Phone, Mail, MapPin, Facebook, Instagram, Youtube } from "lucide-react";
import { motion } from "framer-motion";

const TopBar = () => (
  <motion.div
    initial={{ y: -40 }}
    animate={{ y: 0 }}
    transition={{ duration: 0.5 }}
    className="bg-primary text-primary-foreground text-xs hidden md:block border-b border-primary-foreground/10 relative z-[60]"
  >
    <div className="container flex items-center justify-between py-2 px-4">
      <div className="flex items-center gap-6">
        <a href="tel:+919838276035" className="flex items-center gap-1.5 hover:text-secondary transition-colors">
          <Phone className="w-3 h-3" />
          <span>+91 9838276035</span>
        </a>
        <a href="tel:+919161438472" className="flex items-center gap-1.5 hover:text-secondary transition-colors">
          <Phone className="w-3 h-3" />
          <span>+91 9161438472</span>
        </a>
        <a href="mailto:info@universalpublicschool.edu" className="flex items-center gap-1.5 hover:text-secondary transition-colors">
          <Mail className="w-3 h-3" />
          <span>info@universalpublicschool.edu</span>
        </a>
      </div>
      <div className="flex items-center gap-3">
        {[
          { icon: Facebook, href: "https://facebook.com" },
          { icon: Instagram, href: "https://instagram.com" },
          { icon: Youtube, href: "https://www.youtube.com/@ups.motipur" },
        ].map(({ icon: Icon, href }, i) => (
          <a
            key={i}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="w-6 h-6 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-secondary hover:text-secondary-foreground transition-all"
          >
            <Icon className="w-3 h-3" />
          </a>
        ))}
      </div>
    </div>
  </motion.div>
);

export default TopBar;