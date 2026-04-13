import { motion } from "framer-motion";
import { Microscope, Palette, Dumbbell, Monitor, Music, Globe, ArrowRight } from "lucide-react";
import { useState } from "react";

const programs = [
  { icon: Microscope, title: "Science & Innovation", desc: "Modern labs and research-driven learning from primary to senior levels.", color: "from-blue-500/10 to-cyan-500/10" },
  { icon: Monitor, title: "Technology", desc: "Computer science, robotics, and AI-integrated curriculum.", color: "from-violet-500/10 to-indigo-500/10" },
  { icon: Palette, title: "Arts & Design", desc: "Visual arts, performing arts, and design thinking workshops.", color: "from-rose-500/10 to-pink-500/10" },
  { icon: Dumbbell, title: "Sports", desc: "Professional coaching in athletics, cricket, basketball, and swimming.", color: "from-emerald-500/10 to-green-500/10" },
  { icon: Music, title: "Music & Drama", desc: "Vocal, instrumental training, and annual theatrical productions.", color: "from-amber-500/10 to-orange-500/10" },
  { icon: Globe, title: "Global Studies", desc: "Model UN, foreign languages, and international exchange programs.", color: "from-sky-500/10 to-teal-500/10" },
];

const AcademicsSection = () => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <section id="academics" className="py-28 bg-muted relative overflow-hidden">
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, hsla(40, 60%, 55%, 0.08) 0%, transparent 50%)" }} />
      
      <div className="container px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <p className="text-secondary font-semibold tracking-widest uppercase text-xs mb-4">Programs</p>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            What We <span className="text-gradient">Offer</span>
          </h2>
          <div className="section-divider mb-6" />
          <p className="text-muted-foreground text-lg">
            A comprehensive curriculum designed to develop well-rounded individuals ready for the challenges of the modern world.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.map((prog, i) => (
            <motion.div
              key={prog.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="group relative bg-card rounded-2xl p-8 border border-border overflow-hidden transition-all duration-500 cursor-pointer"
              style={{ boxShadow: hoveredIdx === i ? "var(--card-shadow-hover)" : "var(--card-shadow)" }}
            >
              <motion.div
                className={`absolute inset-0 bg-gradient-to-br ${prog.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
              />

              <div className="relative z-10">
                <motion.div
                  whileHover={{ rotate: -10, scale: 1.15 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center mb-5 group-hover:bg-secondary/20 transition-colors duration-300"
                >
                  <prog.icon className="w-7 h-7 text-secondary" />
                </motion.div>
                <h3 className="text-xl font-bold text-foreground mb-2">{prog.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">{prog.desc}</p>
                
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={hoveredIdx === i ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-1 text-secondary text-sm font-medium"
                >
                  Learn more <ArrowRight className="w-4 h-4" />
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AcademicsSection;