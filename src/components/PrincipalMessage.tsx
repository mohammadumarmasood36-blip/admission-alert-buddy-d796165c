import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { useState, useEffect } from "react";
import principalImg from "@/assets/principal.png";
import { supabase } from "@/integrations/supabase/client";

const PrincipalMessage = () => {
  const [photo, setPhoto] = useState<string>(principalImg);
  const [name, setName] = useState("Mr. Rafi Sir");

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("value")
      .eq("key", "principal_profile")
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
    <section id="principal-message" className="py-28 bg-muted relative overflow-hidden">
      <div className="absolute top-0 left-0 w-72 h-72 bg-secondary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

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
            Principal's <span className="text-gradient">Message</span>
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
              <div className="relative rounded-2xl overflow-hidden border-4 border-card" style={{ boxShadow: "var(--card-shadow-hover)" }}>
                <img
                  src={photo}
                  alt="Principal of Universal Public School"
                  className="w-full h-auto object-cover aspect-[4/5]"
                />
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="absolute -bottom-4 -right-4 bg-secondary text-secondary-foreground px-5 py-2.5 rounded-xl font-bold text-sm"
                style={{ boxShadow: "var(--gold-glow)" }}
              >
                25+ Years in Education
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
              <h3 className="font-display text-2xl font-bold text-foreground mb-2">{name}</h3>
              <p className="text-secondary font-medium text-sm mb-6">Principal, Universal Public School</p>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Welcome to the 2026-2027 school year! Our commitment at Universal Public School is to provide 
                  a safe and intellectually challenging environment that empowers students to become innovative 
                  thinkers, creative problem solvers, and inspired learners prepared to thrive in the twenty-first century.
                </p>
                <p>
                  We believe that education is not merely the filling of a mind with facts, but the perfecting of 
                  the instrument — getting complete mastery of one's own mind. Our dedicated faculty works 
                  tirelessly to nurture each child's unique potential, fostering both academic excellence and 
                  strong moral character.
                </p>
                <p>
                  I invite you to explore our campus, meet our exceptional teachers, and discover the countless 
                  opportunities that await your child at Universal Public School.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default PrincipalMessage;
