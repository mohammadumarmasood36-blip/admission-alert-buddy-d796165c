import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GraduationCap, Clock, Target, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import TopBar from "@/components/TopBar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import schoolLogo from "@/assets/school-logo.png";
import { supabase } from "@/integrations/supabase/client";

interface Teacher {
  id: string;
  name: string;
  photo: string | null;
  joinDate: string | null;
  teachingClasses: string[] | null;
}

const teacherAims: Record<string, string> = {};

function getAimForTeacher(name: string, classes: string[] | null): string {
  if (teacherAims[name]) return teacherAims[name];
  const classStr = classes?.length ? classes.join(", ") : "";
  const aims = [
    `To nurture curiosity and build a strong academic foundation in every student${classStr ? ` of ${classStr}` : ""}.`,
    `To inspire young minds to think critically and develop a lifelong love for learning.`,
    `To create an inclusive classroom where every child feels valued and motivated to excel.`,
    `To empower students with knowledge, discipline, and confidence to face the future.`,
    `To foster creativity and holistic development through engaging and innovative teaching methods.`,
    `To guide students towards academic excellence while building their moral character.`,
    `To make education meaningful and enjoyable, helping students discover their true potential.`,
    `To cultivate responsible citizens who contribute positively to society through quality education.`,
  ];
  const index = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % aims.length;
  return aims[index];
}

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const OurTeam = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeachers = async () => {
      const { data, error } = await supabase
        .from("staff")
        .select('id, "Full Name", Photo, join_date, teaching_classes')
        .eq("Role", "teacher");

      if (!error && data) {
        setTeachers(
          data.map((s) => ({
            id: s.id,
            name: s["Full Name"],
            photo: s.Photo,
            joinDate: s.join_date,
            teachingClasses: s.teaching_classes,
          }))
        );
      }
      setLoading(false);
    };
    fetchTeachers();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Navbar />

      <section className="pt-32 pb-20 bg-dot-pattern relative overflow-hidden">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

        <div className="container px-4 relative">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-6">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-secondary font-semibold tracking-widest uppercase text-xs mb-4">Meet Our Educators</p>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Our <span className="text-shimmer">Teaching Staff</span>
            </h1>
            <div className="section-divider mb-6" />
            <p className="text-muted-foreground text-lg">
              Dedicated and experienced teachers who shape the future of every child at Universal Public School.
            </p>
          </motion.div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : teachers.length === 0 ? (
            <p className="text-center text-muted-foreground py-20">No teachers found.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {teachers.map((teacher, i) => (
                <motion.div
                  key={teacher.id}
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover={{ y: -8, boxShadow: "0 20px 40px -12px hsla(var(--primary) / 0.15)" }}
                  className="bg-card border border-border rounded-2xl overflow-hidden group transition-all duration-300"
                >
                  <div className="h-48 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center relative overflow-hidden">
                    <motion.div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    {teacher.photo ? (
                      <img src={teacher.photo} alt={teacher.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
                        <img src={schoolLogo} alt="UPS" className="w-16 h-16 object-contain opacity-60" />
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <h3 className="font-bold text-foreground text-lg mb-3 group-hover:text-primary transition-colors">{teacher.name}</h3>
                    <div className="space-y-2 mb-4">
                      {teacher.teachingClasses && teacher.teachingClasses.length > 0 && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <GraduationCap className="w-4 h-4 text-secondary shrink-0" />
                          <span>Classes: {teacher.teachingClasses.join(", ")}</span>
                        </div>
                      )}
                      {teacher.joinDate && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4 text-secondary shrink-0" />
                          <span>Joined: {new Date(teacher.joinDate).toLocaleDateString("en-IN", { year: "numeric", month: "short" })}</span>
                        </div>
                      )}
                    </div>
                    <div className="border-t border-border pt-3">
                      <div className="flex items-start gap-2">
                        <Target className="w-4 h-4 text-primary/60 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-primary/80 mb-1">My Aim</p>
                          <p className="text-xs text-muted-foreground italic leading-relaxed line-clamp-3">
                            "{getAimForTeacher(teacher.name, teacher.teachingClasses)}"
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default OurTeam;
