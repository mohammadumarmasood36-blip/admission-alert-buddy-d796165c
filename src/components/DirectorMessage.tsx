import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const DirectorMessage = () => {
  const [photo, setPhoto] = useState<string | null>(null);
  const [name, setName] = useState("The Director");

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("value")
      .eq("key", "director_profile")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) {
          try {
            const parsed = JSON.parse(data.value);
            if (parsed.photo) setPhoto(parsed.photo);
            if (parsed.name) setName(parsed.name);
          } catch {}
        }
      });
  }, []);

  return (
    <section id="director-message" className="py-28 bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3" />

      <div className="container px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <p className="text-secondary font-semibold tracking-widest uppercase text-xs mb-4">Leadership</p>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Message From The <span className="text-gradient">Director</span>
          </h2>
          <div className="section-divider" />
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-12 items-center max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-2"
          >
            <div className="relative">
              <div className="absolute -inset-3 rounded-2xl bg-gradient-to-br from-secondary/20 to-secondary/5 blur-sm" />
              <div
                className="relative rounded-2xl overflow-hidden border-4 border-card"
                style={{ boxShadow: "var(--card-shadow-hover)" }}
              >
                {photo ? (
                  <img
                    src={photo}
                    alt="Director of Universal Public School"
                    className="w-full h-auto object-cover aspect-[4/5]"
                  />
                ) : (
                  <div className="w-full aspect-[4/5] bg-muted flex items-center justify-center">
                    <span className="text-6xl">👤</span>
                  </div>
                )}
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="absolute -bottom-4 -right-4 bg-secondary text-secondary-foreground px-5 py-2.5 rounded-xl font-bold text-sm"
                style={{ boxShadow: "var(--gold-glow)" }}
              >
                Director
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-3"
          >
            <div className="relative">
              <Quote className="w-12 h-12 text-secondary/20 mb-4" />
              <p className="text-muted-foreground italic text-sm mb-6">Dear students, faculty, and staff,</p>
              <div className="space-y-4 text-muted-foreground leading-relaxed text-sm">
                <p>
                  It brings me great joy to see how far our school has come since its founding. I am proud 
                  of each and every one of you who has contributed to making this institution a beacon of 
                  knowledge and excellence in our community. As we continue to grow and evolve, I encourage 
                  you to always remember the values and principles upon which this school was built.
                </p>
                <p>
                  Our commitment to providing a nurturing and inclusive environment where students can thrive 
                  and achieve their fullest potential remains as strong as ever. I want to thank our dedicated 
                  faculty and staff for their tireless efforts in educating and guiding our students. Your 
                  commitment to academic excellence and personal growth is a testament to your unwavering 
                  passion for teaching.
                </p>
                <p>
                  To our students, I urge you to make the most of the opportunities that this school provides. 
                  Take advantage of the resources and support available to you, and never stop striving for 
                  greatness. Together, we can continue to build a legacy of academic achievement, personal 
                  growth, and social responsibility that will serve as a model for future generations.
                </p>
              </div>
              <p className="mt-6 text-muted-foreground italic text-sm">Sincerely,</p>
              <p className="font-bold text-foreground">{name}</p>
              <p className="text-secondary font-medium text-sm">Universal Public School</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default DirectorMessage;
