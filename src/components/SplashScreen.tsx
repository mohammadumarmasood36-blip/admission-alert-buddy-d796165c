import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import schoolLogo from "@/assets/school-logo.png";

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [phase, setPhase] = useState<"logo" | "text" | "exit">("logo");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("text"), 800);
    const t2 = setTimeout(() => setPhase("exit"), 2200);
    const t3 = setTimeout(onComplete, 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase !== "exit" ? null : null}
      <motion.div
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
        style={{ background: "linear-gradient(135deg, hsl(220, 45%, 8%), hsl(220, 45%, 18%))" }}
        exit={{ opacity: 0, scale: 1.1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        animate={phase === "exit" ? { opacity: 0, scale: 1.05 } : { opacity: 1, scale: 1 }}
      >
        <motion.div
          className="absolute w-64 h-64 rounded-full border border-secondary/10"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.5, 2], opacity: [0, 0.3, 0] }}
          transition={{ duration: 2, ease: "easeOut", delay: 0.3 }}
        />
        <motion.div
          className="absolute w-48 h-48 rounded-full border border-secondary/15"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.8, 2.5], opacity: [0, 0.2, 0] }}
          transition={{ duration: 2.2, ease: "easeOut", delay: 0.5 }}
        />

        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-6"
        >
          <img src={schoolLogo} alt="Universal Public School" className="w-20 h-20 rounded-2xl object-contain" style={{ boxShadow: "0 0 40px hsla(40, 60%, 55%, 0.4)" }} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          animate={phase === "logo" ? { opacity: 0, y: 20 } : { opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-3xl md:text-4xl font-bold text-primary-foreground font-display tracking-tight text-center"
        >
          Universal Public School
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={phase === "logo" ? { opacity: 0 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          className="text-secondary text-sm tracking-[0.25em] uppercase mt-2 font-semibold"
        >
          Motipur, Loharsan
        </motion.p>

        <motion.div className="mt-10 w-48 h-0.5 bg-primary-foreground/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, hsl(40, 60%, 55%), hsl(40, 70%, 65%))" }}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SplashScreen;