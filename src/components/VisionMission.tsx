import { motion } from "framer-motion";
import { Eye, Target } from "lucide-react";

const VisionMission = () => (
  <section id="vision-mission" className="py-24 bg-primary relative overflow-hidden">
    <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

    <div className="container px-4 relative">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-14"
      >
        <p className="text-secondary font-semibold tracking-widest uppercase text-xs mb-3">Our Purpose</p>
        <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-3">
          Vision & <span className="text-gradient">Mission</span>
        </h2>
        <div className="section-divider" />
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          whileHover={{ y: -4 }}
          className="bg-card/10 backdrop-blur-sm border border-primary-foreground/10 rounded-2xl p-8 md:p-10"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
              <Eye className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="text-3xl font-bold text-primary-foreground">Vision</h3>
          </div>
          <div className="space-y-4 text-primary-foreground/80 leading-relaxed text-sm">
            <p>
              "Path to overall excellence" — we are looking at developing individuals with versatile 
              all-rounded personality training the mind, heart, body and conscience through a conceptual 
              interdisciplinary academic programme integrated with enrichment activities for multidimensional exposure.
            </p>
            <p>
              The vision of Universal Public School is to provide opportunities to create Global Citizens 
              and leaders of tomorrow through traditional values of love, empathy, discipline and respect 
              to train skills required for successful interaction with other individuals.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          whileHover={{ y: -4 }}
          className="bg-card/10 backdrop-blur-sm border border-primary-foreground/10 rounded-2xl p-8 md:p-10"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
              <Target className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="text-3xl font-bold text-primary-foreground">Mission</h3>
          </div>
          <ul className="space-y-3 text-primary-foreground/80 text-sm leading-relaxed list-disc list-inside">
            <li>
              Helping the students to discover what it is to live and grow with clarity of thoughts 
              by developing self reliance, courage, self confidence and self esteem.
            </li>
            <li>
              Pursuit of excellence in academics, games and sports, co-curricular activities and in human values.
            </li>
            <li>Encouraging a desire for life long learners.</li>
            <li>
              Fostering independent thinking, thoughtful decision marking, appreciation with intellectual 
              humility to accept difference in opinion.
            </li>
            <li>
              Creating responsible and disciplined citizens who are fully aware of their moral, social and 
              cultural obligations and commitments with a desire for unbounded service to humanity.
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  </section>
);

export default VisionMission;