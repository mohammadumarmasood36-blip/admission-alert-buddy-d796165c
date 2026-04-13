import { motion } from "framer-motion";
import { Lightbulb, Heart, Rocket, Target, Star, Shield } from "lucide-react";

const pillars = [
  {
    icon: Lightbulb,
    title: "Dream",
    desc: "We inspire students to dream big and pursue their passions with confidence, resilience, and perseverance.",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: Heart,
    title: "Believe",
    desc: "We nurture self-belief in every child, helping them unlock hidden potential and achieve beyond expectations.",
    gradient: "from-rose-500 to-pink-500",
  },
  {
    icon: Rocket,
    title: "Achieve",
    desc: "We empower students to realize their true potential and accomplish academic, personal, and lifelong goals.",
    gradient: "from-emerald-500 to-teal-500",
  },
];

const features = [
  { icon: Target, label: "Holistic Development", desc: "Best in sports and academics" },
  { icon: Star, label: "Modern Facilities", desc: "Latest technology in education" },
  { icon: Shield, label: "Safe Environment", desc: "CCTV monitored campus" },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 50, rotateX: 15 },
  visible: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.7, ease: "easeOut" as const } },
};

const WhyChooseUs = () => (
  <section className="py-28 bg-primary relative overflow-hidden">
    <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 30% 70%, hsla(40, 60%, 55%, 0.1) 0%, transparent 50%), radial-gradient(circle at 70% 30%, hsla(40, 60%, 55%, 0.08) 0%, transparent 50%)" }} />

    <motion.div
      className="absolute -top-20 -right-20 w-64 h-64 rounded-full border border-secondary/10"
      animate={{ rotate: 360 }}
      transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
    />
    <motion.div
      className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full border border-secondary/5"
      animate={{ rotate: -360 }}
      transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
    />

    <div className="container px-4 relative">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="text-center mb-20"
      >
        <p className="text-secondary font-semibold tracking-widest uppercase text-xs mb-4">Why Choose Us</p>
        <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
          Building <span className="text-shimmer">Future Leaders</span>
        </h2>
        <div className="section-divider mb-6" />
        <p className="text-primary-foreground/60 text-lg max-w-2xl mx-auto">
          Our philosophy is built on three pillars that transform ordinary students into extraordinary individuals.
        </p>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="grid md:grid-cols-3 gap-6 mb-20"
        style={{ perspective: "1000px" }}
      >
        {pillars.map((p) => (
          <motion.div
            key={p.title}
            variants={cardVariants}
            whileHover={{ y: -10, scale: 1.03, transition: { duration: 0.3 } }}
            className="relative group rounded-2xl overflow-hidden cursor-pointer"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${p.gradient} opacity-10 group-hover:opacity-25 transition-opacity duration-500`} />
            <div className="glass-card rounded-2xl p-8 h-full relative">
              <motion.div
                whileHover={{ rotate: -15, scale: 1.2 }}
                transition={{ type: "spring", stiffness: 300 }}
                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${p.gradient} flex items-center justify-center mb-6 shadow-lg`}
              >
                <p.icon className="w-8 h-8 text-primary-foreground" />
              </motion.div>
              <h3 className="font-display text-2xl font-bold text-primary-foreground mb-3">{p.title}</h3>
              <p className="text-primary-foreground/60 leading-relaxed">{p.desc}</p>
              <motion.div
                className="h-0.5 bg-gradient-to-r from-secondary to-secondary/30 mt-4 rounded-full"
                initial={{ width: 0 }}
                whileInView={{ width: "40%" }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.5 }}
              />
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="grid md:grid-cols-3 gap-6"
      >
        {features.map((f) => (
          <motion.div
            key={f.label}
            variants={{ hidden: { opacity: 0, x: -30 }, visible: { opacity: 1, x: 0, transition: { duration: 0.6 } } }}
            whileHover={{ x: 5 }}
            className="flex items-center gap-4 glass-card rounded-xl p-5 group"
          >
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center shrink-0 group-hover:bg-secondary/30 transition-colors"
            >
              <f.icon className="w-6 h-6 text-secondary" />
            </motion.div>
            <div>
              <h4 className="font-bold text-primary-foreground text-sm">{f.label}</h4>
              <p className="text-primary-foreground/50 text-xs">{f.desc}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

export default WhyChooseUs;