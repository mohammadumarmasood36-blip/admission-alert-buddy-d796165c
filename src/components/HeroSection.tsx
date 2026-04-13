import { motion, useScroll, useTransform } from "framer-motion";
import { Award, Users, BookOpen } from "lucide-react";
import { useRef } from "react";
import heroImage from "@/assets/hero-school.jpg";

const highlights = [
  { icon: Award, label: "HOLISTIC", desc: "Best in sports and academics" },
  { icon: BookOpen, label: "FACILITIES", desc: "Latest technology in education" },
  { icon: Users, label: "TOP SCHOOL", desc: "Most awarded school in region" },
];

const HeroSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={sectionRef} id="home" className="relative min-h-screen flex items-center overflow-hidden">
      <motion.img
        src={heroImage}
        alt="Universal Public School campus"
        className="absolute inset-0 w-full h-full object-cover"
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        transition={{ duration: 2.5, ease: "easeOut" }}
        style={{ y: imgY }}
      />
      <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, hsla(220, 45%, 5%, 0.92), hsla(220, 45%, 15%, 0.6))" }} />

      {[...Array(5)].map((_, i) => (
        <motion.div
          key={`orb-${i}`}
          className="absolute rounded-full"
          style={{
            width: `${80 + i * 40}px`,
            height: `${80 + i * 40}px`,
            left: `${10 + i * 18}%`,
            top: `${20 + (i % 3) * 25}%`,
            background: `radial-gradient(circle, hsla(40, 60%, 55%, ${0.06 + i * 0.01}), transparent 70%)`,
          }}
          animate={{
            y: [0, -40 - i * 10, 0],
            x: [0, 15 * (i % 2 === 0 ? 1 : -1), 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 6 + i * 1.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.8,
          }}
        />
      ))}

      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-secondary/20"
          style={{
            width: `${3 + (i % 4) * 2}px`,
            height: `${3 + (i % 4) * 2}px`,
            left: `${5 + i * 8}%`,
            top: `${10 + (i % 5) * 18}%`,
          }}
          animate={{
            y: [0, -50, 0],
            opacity: [0, 0.8, 0],
            scale: [0.5, 1.5, 0.5],
          }}
          transition={{
            duration: 3 + i * 0.6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.4,
          }}
        />
      ))}

      <motion.div className="relative z-10 container px-4" style={{ y: textY, opacity }}>
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 80 }}
            transition={{ duration: 0.8 }}
            className="h-1.5 bg-secondary rounded-full mb-8"
          />

          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-secondary font-semibold tracking-[0.3em] uppercase text-xs mb-4"
          >
            Welcome to Excellence
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground leading-[1.08] mb-6"
          >
            Unlock Your Child's Full Potential at{" "}
            <span className="text-shimmer">Universal Public School</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-primary-foreground/65 text-base md:text-lg max-w-lg mb-10 leading-relaxed"
          >
            We foster curiosity, creativity, and character in every student, preparing them
            for a successful future with cutting-edge learning methods, experienced faculty,
            and a nurturing environment.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <motion.a
              href="#about"
              whileHover={{ scale: 1.05, boxShadow: "0 12px 40px -8px hsla(40, 60%, 55%, 0.5)" }}
              whileTap={{ scale: 0.97 }}
              className="inline-block bg-secondary text-secondary-foreground font-bold px-10 py-4 rounded-xl transition-all text-base relative overflow-hidden group"
              style={{ boxShadow: "var(--gold-glow)" }}
            >
              <span className="relative z-10">About Us</span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-foreground/10 to-transparent"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.6 }}
              />
            </motion.a>
            <motion.a
              href="#contact"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="inline-block glass-card text-primary-foreground font-bold px-10 py-4 rounded-xl hover:bg-primary-foreground/10 transition-all text-base animated-border"
            >
              Contact Us
            </motion.a>
          </motion.div>
        </div>
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 z-20">
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 1.2, ease: "easeOut" }}
            className="grid grid-cols-3 rounded-t-2xl overflow-hidden"
          >
            {highlights.map((h, i) => (
              <motion.div
                key={h.label}
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 400 }}
                className={`flex flex-col items-center text-center p-5 md:p-6 cursor-pointer transition-all duration-300 ${
                  i === 1
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-primary/95 backdrop-blur-md text-primary-foreground"
                }`}
              >
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <h.icon className={`w-7 h-7 mb-2 ${i === 1 ? "text-secondary-foreground" : "text-secondary"}`} />
                </motion.div>
                <h4 className="font-bold text-xs md:text-sm tracking-wider uppercase mb-0.5">{h.label}</h4>
                <p className={`text-[10px] md:text-xs hidden sm:block ${i === 1 ? "text-secondary-foreground/70" : "text-primary-foreground/50"}`}>
                  {h.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;