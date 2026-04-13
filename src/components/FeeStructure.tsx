import { motion } from "framer-motion";
import { IndianRupee, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface FeeRow {
  class: string;
  admissionFee: string;
  tuitionFee: string;
  annualCharges: string;
  total: string;
}

const DEFAULT_FEES: FeeRow[] = [
  { class: "Nursery", admissionFee: "5,000", tuitionFee: "1,200", annualCharges: "3,000", total: "9,200" },
  { class: "LKG", admissionFee: "5,000", tuitionFee: "1,200", annualCharges: "3,000", total: "9,200" },
  { class: "UKG", admissionFee: "5,000", tuitionFee: "1,200", annualCharges: "3,000", total: "9,200" },
  { class: "I - III", admissionFee: "5,000", tuitionFee: "1,500", annualCharges: "3,500", total: "10,500" },
  { class: "IV - V", admissionFee: "5,000", tuitionFee: "1,500", annualCharges: "3,500", total: "10,500" },
  { class: "VI - VIII", admissionFee: "6,000", tuitionFee: "1,800", annualCharges: "4,000", total: "12,800" },
  { class: "IX - X", admissionFee: "6,000", tuitionFee: "2,000", annualCharges: "4,500", total: "13,500" },
  { class: "XI - XII", admissionFee: "7,000", tuitionFee: "2,500", annualCharges: "5,000", total: "15,500" },
];

const rowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.06, duration: 0.4 },
  }),
};

const FeeStructure = () => {
  const [feeData, setFeeData] = useState<FeeRow[]>(DEFAULT_FEES);

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("value")
      .eq("key", "fee_structure")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) {
          try {
            const parsed = JSON.parse(data.value);
            if (Array.isArray(parsed) && parsed.length > 0) setFeeData(parsed);
          } catch {}
        }
      });
  }, []);

  return (
    <section id="fee-structure" className="py-28 bg-muted/30 relative overflow-hidden bg-dot-pattern">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />

      <div className="container px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <p className="text-secondary font-semibold tracking-widest uppercase text-xs mb-4">Transparent Pricing</p>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Fee <span className="text-shimmer">Structure</span>
          </h2>
          <div className="section-divider mb-6" />
          <p className="text-muted-foreground text-lg">
            Session 2026–27 fee details for all classes. Contact us for more information.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="bg-card rounded-2xl border border-border overflow-hidden glow-secondary"
          style={{ boxShadow: "var(--card-shadow)" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  <th className="px-6 py-4 text-left font-semibold">Class</th>
                  <th className="px-6 py-4 text-center font-semibold">Admission Fee</th>
                  <th className="px-6 py-4 text-center font-semibold">Tuition Fee (Monthly)</th>
                  <th className="px-6 py-4 text-center font-semibold">Annual Charges</th>
                  <th className="px-6 py-4 text-center font-semibold">
                    <span className="flex items-center justify-center gap-1">
                      <IndianRupee className="w-4 h-4" /> Total (Approx.)
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {feeData.map((row, i) => (
                  <motion.tr
                    key={row.class}
                    custom={i}
                    variants={rowVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className={`border-b border-border transition-colors hover:bg-secondary/5 ${
                      i % 2 === 0 ? "bg-background" : "bg-muted/30"
                    }`}
                  >
                    <td className="px-6 py-4 font-semibold text-foreground">{row.class}</td>
                    <td className="px-6 py-4 text-center text-muted-foreground">₹{row.admissionFee}</td>
                    <td className="px-6 py-4 text-center text-muted-foreground">₹{row.tuitionFee}</td>
                    <td className="px-6 py-4 text-center text-muted-foreground">₹{row.annualCharges}</td>
                    <td className="px-6 py-4 text-center font-bold text-secondary">₹{row.total}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 bg-muted/30 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              * Fee structure is indicative and subject to revision. Transport & other charges extra.
            </p>
            <motion.a
              href="#contact"
              whileHover={{ scale: 1.05, boxShadow: "0 8px 30px -8px hsla(40, 60%, 55%, 0.4)" }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground font-semibold px-5 py-2.5 rounded-xl text-sm transition-all relative overflow-hidden group"
              style={{ boxShadow: "var(--gold-glow)" }}
            >
              <span className="relative z-10 flex items-center gap-2">
                <Download className="w-4 h-4" /> Enquire Now
              </span>
            </motion.a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FeeStructure;
