import { motion, useInView } from "framer-motion";
import { BookOpen, Users, Trophy, Heart } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import heroImage from "@/assets/hero-school.jpg";
import { supabase } from "@/integrations/supabase/client";

const stats = [
  { icon: BookOpen, value: 25, suffix: "+", label: "Years of Excellence" },
  { icon: Users, value: 3000, suffix: "+", label: "Students" },
  { icon: Trophy, value: 150, suffix: "+", label: "Awards Won" },
  { icon: Heart, value: 200, suffix: "+", label: "Dedicated Staff" },
];

const CountUp = ({ end, suffix, inView }: { end: number; suffix: string; inView: boolean }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = Math.max(1, Math.floor(end / 40));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 30);
    return () => clearInterval(timer);
  }, [end, inView]);
  return <>{count.toLocaleString()}{suffix}</>;
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5 } },
};

interface SchoolInfo {
  schoolName: string;
  aboutText: string;
}

const AboutSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(statsRef, { once: true, amount: 0.3 });
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("value")
      .eq("key", "school_info")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) {
          try {
            setSchoolInfo(JSON.parse(data.value));
          } catch {}
        }
      });
  }, []);

  const defaultAbout = [
    "Universal Public School, established in Loharsan, Motipur, is committed to providing a holistic education that balances academic rigor with creative exploration. Our state-of-the-art campus fosters curiosity, critical thinking, and compassion in every student.",
    "Here we don't emphasize on imparting knowledge alone but try to make the child wise enough so as to make them into a worthy human being who would stand above the division of caste, class, and creed.",
    "With dedicated faculty, modern facilities, and a nurturing environment, we prepare our students for the challenges of tomorrow while instilling strong values and a love for lifelong learning.",
  ];

  const aboutParagraphs = schoolInfo?.aboutText
    ? schoolInfo.aboutText.split("\n").filter((p) => p.trim())
    : defaultAbout;

  const schoolName = schoolInfo?.schoolName || "Universal Public School";

  return (
    <section id="about" className="py-28 bg-background relative overflow-hidden bg-dot-pattern">
      <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      <motion.div
        className="absolute top-20 right-20 w-32 h-32 rounded-full border border-secondary/10"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />

      <div className="container px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <p className="text-secondary font-semibold tracking-widest uppercase text-xs mb-4">About Us</p>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            About <span className="text-shimmer">Us</span>
          </h2>
          <div className="section-divider mb-6" />
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          <motion.div
            initial={{ opacity: 0, x: -50, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="rounded-2xl overflow-hidden border-4 border-secondary/20 shadow-xl card-shine">
              <motion.img
                src={heroImage}
                alt={`${schoolName} campus and students`}
                className="w-full h-[350px] md:h-[420px] object-cover"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.6 }}
              />
            </div>
            <motion.div
              className="absolute -bottom-4 -right-4 w-24 h-24 bg-secondary/10 rounded-2xl -z-10"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 6, repeat: Infinity }}
            />
            <motion.div
              className="absolute -top-4 -left-4 w-16 h-16 bg-primary/10 rounded-2xl -z-10"
              animate={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 5, repeat: Infinity }}
            />
            <motion.div
              className="absolute -top-3 right-6 bg-secondary text-secondary-foreground px-4 py-2 rounded-xl text-xs font-bold glow-secondary"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              Est. 1995
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Welcome To <span className="text-shimmer">{schoolName}</span>
            </h3>
            <blockquote className="text-muted-foreground italic border-l-4 border-secondary pl-4 mb-6 text-sm">
              "Education is not filling the mind with a lot of facts. Perfecting the instrument and getting complete mastery of my own mind is the ideal of education."
            </blockquote>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              {aboutParagraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <motion.a
              href="#contact"
              whileHover={{ scale: 1.05, boxShadow: "0 12px 40px -8px hsla(40, 60%, 55%, 0.4)" }}
              whileTap={{ scale: 0.97 }}
              className="inline-block mt-6 bg-secondary text-secondary-foreground font-bold px-8 py-3 rounded-xl transition-all text-sm relative overflow-hidden group"
              style={{ boxShadow: "var(--gold-glow)" }}
            >
              <span className="relative z-10">Contact Us</span>
            </motion.a>
          </motion.div>
        </div>

        <motion.div
          ref={statsRef}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-5"
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              whileHover={{ y: -8, boxShadow: "var(--card-shadow-hover)" }}
              className="bg-card rounded-2xl p-7 text-center border border-border transition-all duration-300 card-shine"
              style={{ boxShadow: "var(--card-shadow)" }}
            >
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 200, duration: 0.5 }}
                className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center mx-auto mb-4"
              >
                <stat.icon className="w-7 h-7 text-secondary" />
              </motion.div>
              <p className="text-4xl font-bold text-foreground mb-1">
                <CountUp end={stat.value} suffix={stat.suffix} inView={isInView} />
              </p>
              <p className="text-muted-foreground text-sm">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default AboutSection;
