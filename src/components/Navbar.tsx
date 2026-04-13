import { useState, useEffect } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import schoolLogo from "@/assets/school-logo.png";

const navLinks = [
  { label: "Home", href: "/#home" },
  { label: "About", href: "/#about" },
  { label: "Academics", href: "/#academics" },
  { label: "Fee Structure", href: "/#fee-structure" },
  { label: "Gallery", href: "/#gallery" },
  { label: "Contact", href: "/#contact" },
  {
    label: "More",
    href: "#",
    children: [
      { label: "Vision & Mission", href: "/#vision-mission" },
      { label: "Our Goals", href: "/#goals" },
      { label: "Director's Message", href: "/#director-message" },
      { label: "Principal's Message", href: "/#principal-message" },
      { label: "Testimonials", href: "/#testimonials" },
      { label: "FAQs", href: "/#faq" },
      { label: "Our Team", href: "/our-team", isRoute: true },
      { label: "Admission Form", href: "/admission-form", isRoute: true },
    ],
  },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdown, setDropdown] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "top-0 bg-primary/95 backdrop-blur-md shadow-lg"
          : "top-0 md:top-[36px] bg-transparent"
      }`}
    >
      <div className="container flex items-center justify-between h-18 py-4">
        <motion.a
          href="/"
          className="flex items-center gap-2.5 text-primary-foreground group"
          whileHover={{ scale: 1.02 }}
        >
          <img src={schoolLogo} alt="Universal Public School Logo" className="w-10 h-10 rounded-lg object-contain" />
          <div>
            <span className="font-display text-lg font-bold block leading-tight">Universal Public</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-primary-foreground/50">School</span>
          </div>
        </motion.a>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link, i) => (
            <div
              key={link.href + link.label}
              className="relative"
              onMouseEnter={() => link.children && setDropdown(link.label)}
              onMouseLeave={() => setDropdown(null)}
            >
              <motion.a
                href={link.href}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="story-link relative px-4 py-2 text-primary-foreground/75 hover:text-secondary transition-colors text-sm font-medium rounded-lg hover:bg-primary-foreground/5 flex items-center gap-1"
              >
                <span>{link.label}</span>
                {link.children && <ChevronDown className="w-3 h-3" />}
              </motion.a>
              {/* Dropdown */}
              <AnimatePresence>
                {link.children && dropdown === link.label && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 mt-1 bg-primary/95 backdrop-blur-xl border border-primary-foreground/10 rounded-lg overflow-hidden min-w-[180px] shadow-xl"
                  >
                    {link.children.map((child: any) => (
                      <div key={child.label}>
                        {child.isRoute ? (
                          <Link
                            to={child.href}
                            className="block px-5 py-2.5 text-sm text-primary-foreground/70 hover:text-secondary hover:bg-primary-foreground/5 transition-all"
                          >
                            {child.label}
                          </Link>
                        ) : (
                          <a
                            href={child.href}
                            className="block px-5 py-2.5 text-sm text-primary-foreground/70 hover:text-secondary hover:bg-primary-foreground/5 transition-all"
                          >
                            {child.label}
                          </a>
                        )}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
            className="ml-4"
          >
            <Link
              to="/portal"
              className="block bg-secondary text-secondary-foreground font-semibold px-5 py-2 rounded-lg text-sm hover:opacity-90 transition-all hover:shadow-lg"
              style={{ boxShadow: "var(--gold-glow)" }}
            >
              Login
            </Link>
          </motion.div>
        </div>

        {/* Mobile toggle */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setOpen(!open)}
          className="md:hidden text-primary-foreground w-10 h-10 rounded-lg flex items-center justify-center hover:bg-primary-foreground/10 transition-colors"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </motion.button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden overflow-hidden bg-primary/98 backdrop-blur-xl border-t border-primary-foreground/10"
          >
            <div className="py-4">
              {navLinks.map((link, i) => (
                <div key={link.href + link.label}>
                  <motion.a
                    href={link.href}
                    onClick={() => !link.children && setOpen(false)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="block px-6 py-3 text-primary-foreground/80 hover:text-secondary hover:bg-primary-foreground/5 transition-all text-sm"
                  >
                    {link.label}
                  </motion.a>
                  {link.children && (
                    <div className="pl-10">
                      {link.children.map((child: any) => (
                        <div key={child.label}>
                          {child.isRoute ? (
                            <Link
                              to={child.href}
                              onClick={() => setOpen(false)}
                              className="block px-4 py-2 text-primary-foreground/60 hover:text-secondary text-xs"
                            >
                              {child.label}
                            </Link>
                          ) : (
                            <a
                              href={child.href}
                              onClick={() => setOpen(false)}
                              className="block px-4 py-2 text-primary-foreground/60 hover:text-secondary text-xs"
                            >
                              {child.label}
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div className="px-6 pt-3">
                <Link
                  to="/portal"
                  onClick={() => setOpen(false)}
                  className="block text-center bg-secondary text-secondary-foreground font-semibold px-5 py-2.5 rounded-lg text-sm"
                >
                  Login
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;