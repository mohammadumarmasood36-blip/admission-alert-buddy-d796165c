import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

const AdmissionTicker = () => (
  <div className="bg-secondary text-secondary-foreground overflow-hidden relative z-40">
    <div className="flex items-center">
      <div className="bg-secondary-foreground/10 px-4 py-2.5 flex items-center gap-2 shrink-0 font-bold text-sm">
        <Sparkles className="w-4 h-4" />
        <span>NEWS</span>
      </div>
      <div className="overflow-hidden flex-1">
        <motion.div
          className="flex items-center gap-12 whitespace-nowrap py-2.5"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          {[...Array(2)].map((_, dup) => (
            <div key={dup} className="flex items-center gap-12">
              <span className="flex items-center gap-2 text-sm font-medium">
                <ArrowRight className="w-3.5 h-3.5" />
                Admissions Open for Session 2026-27 — Contact: +91 9838276035, +91 9161438472
              </span>
              <span className="flex items-center gap-2 text-sm font-medium">
                <ArrowRight className="w-3.5 h-3.5" />
                Annual Sports Day on 15th March 2026
              </span>
              <span className="flex items-center gap-2 text-sm font-medium">
                <ArrowRight className="w-3.5 h-3.5" />
                New Session Registration Open — Enroll Today!
              </span>
              <span className="flex items-center gap-2 text-sm font-medium">
                <ArrowRight className="w-3.5 h-3.5" />
                Parent-Teacher Meeting scheduled for 20th March 2026
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  </div>
);

export default AdmissionTicker;