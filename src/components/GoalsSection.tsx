import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, BookOpen, Users, GraduationCap } from "lucide-react";

const goals = [
  {
    id: "pre-primary",
    title: "Pre-Primary Goals",
    subtitle: "The 3 E's",
    icon: Sparkles,
    items: [
      { name: "Explore", desc: "Encouraging our little explorers to be inquisitive, creative, and develop problem-solving skills through hands-on activities." },
      { name: "Express", desc: "Fostering children's ability to express themselves through art, music, and language. Promoting communication, self-expression, and confidence." },
      { name: "Engage", desc: "Encouraging children to interact, participate, and engage with their peers, teachers, and environment. Promoting social skills and community." },
    ],
  },
  {
    id: "primary",
    title: "Primary Goals",
    subtitle: "The 3 C's",
    icon: BookOpen,
    items: [
      { name: "Curiosity", desc: "Encouraging children to explore, ask questions, and seek answers. Fostering a love for learning, creativity, and imagination." },
      { name: "Confidence", desc: "Building children's self-esteem, self-worth, and confidence in their abilities. Promoting positive self-talk, resilience, and perseverance." },
      { name: "Caring & Compassion", desc: "Teaching children to be kind, empathetic, and understanding towards others. Promoting social skills, friendship, and community values." },
    ],
  },
  {
    id: "junior",
    title: "Junior Goals",
    subtitle: "The 3 R's",
    icon: Users,
    items: [
      { name: "Respect", desc: "Teaching children to respect others, their opinions, and their belongings. Promoting empathy, kindness, and inclusivity." },
      { name: "Responsibility", desc: "Encouraging children to take ownership of their actions, learning, and belongings. Teaching accountability and self-discipline." },
      { name: "Resourcefulness", desc: "Fostering creativity, critical thinking, and problem-solving skills. Encouraging exploration and innovative solutions." },
    ],
  },
  {
    id: "senior",
    title: "Senior Goals",
    subtitle: "The 3 P's",
    icon: GraduationCap,
    items: [
      { name: "Pleasing Personality", desc: "Developing qualities such as kindness, confidence, and integrity to create well-rounded, admirable individuals." },
      { name: "Preparation for Life", desc: "Fostering creativity and self-expression through dance, music, and public speaking to contribute positively to society." },
      { name: "Proficiency in Academics", desc: "Ensuring learners achieve academic excellence, particularly in board exams, through rigorous preparation and support." },
    ],
  },
];

const GoalsSection = () => {
  const [active, setActive] = useState(0);
  const current = goals[active];

  return (
    <section id="goals" className="py-24 bg-background relative overflow-hidden">
      <div className="absolute top-0 left-0 w-72 h-72 bg-secondary/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />

      <div className="container px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-secondary font-semibold tracking-widest uppercase text-xs mb-3">Our Steps to Excellence</p>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-3">
            Our <span className="text-gradient">Goals</span>
          </h2>
          <div className="section-divider" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          {goals.map((goal, i) => (
            <button
              key={goal.id}
              onClick={() => setActive(i)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                active === i
                  ? "bg-secondary text-secondary-foreground shadow-lg"
                  : "bg-card border border-border text-muted-foreground hover:border-secondary/30 hover:text-foreground"
              }`}
              style={active === i ? { boxShadow: "var(--gold-glow)" } : {}}
            >
              <goal.icon className="w-4 h-4" />
              {goal.subtitle}
            </button>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <div className="text-center mb-8">
              <h3 className="text-2xl md:text-3xl font-bold text-foreground">{current.title}</h3>
              <p className="text-secondary font-semibold mt-1">({current.subtitle})</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {current.items.map((item, i) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15 }}
                  whileHover={{ y: -6, boxShadow: "var(--card-shadow-hover)" }}
                  className="bg-card rounded-2xl p-8 border border-border text-center transition-all duration-300"
                  style={{ boxShadow: "var(--card-shadow)" }}
                >
                  <div className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center mx-auto mb-5">
                    <span className="text-2xl font-bold text-secondary">{item.name[0]}</span>
                  </div>
                  <h4 className="text-lg font-bold text-foreground mb-3">{item.name}</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export default GoalsSection;