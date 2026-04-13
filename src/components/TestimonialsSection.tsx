import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import parentAbhishek from "@/assets/parent-abhishek.png";
import parentRekha from "@/assets/parent-rekha.png";
import parentSanjay from "@/assets/parent-sanjay.png";

const testimonials = [
  {
    name: "Abhishek Mishra",
    relation: "Father of Vaishnavi Mishra",
    text: "My review on my daughter's school is that it is a nice school and all the teachers in the school are very good. The teachers help the students to solve queries. I have noticed that my daughter has developed self confidence and academic progress. The method of teaching in this school is also very good. The teachers are caring and well organized.",
    image: parentAbhishek,
    initials: "AM",
    color: "hsl(220, 45%, 20%)",
    rating: 5,
  },
  {
    name: "Rekha Gupta",
    relation: "Mother of Samriddhi Gupta",
    designation: "Dist. Backward Welfare Officer",
    text: "This is the best school ever for my child. I enrolled my child last year in mid session due to my transfer and I have observed improvement in her academics and extra curricular activities thanks to the teachers. The Principal ma'am always keeps on working on students' overall development. Here learning is fun and there's no room for fear.",
    image: parentRekha,
    initials: "RG",
    color: "hsl(40, 60%, 50%)",
    rating: 5,
  },
  {
    name: "Sanjay Verma",
    relation: "Father of Aryan Verma",
    text: "Universal Public School has been a wonderful choice for our son. The school provides excellent facilities and the teachers are very supportive. Our son has shown tremendous improvement in both academics and personality development since joining UPS.",
    image: parentSanjay,
    initials: "SV",
    color: "hsl(160, 40%, 35%)",
    rating: 5,
  },
];

const TestimonialsSection = () => (
  <section id="testimonials" className="py-24 bg-muted/30 relative overflow-hidden">
    <div className="absolute top-0 left-0 w-72 h-72 bg-secondary/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />
    <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-y-1/2 translate-x-1/2" />

    <div className="container px-4 relative">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-14"
      >
        <p className="text-secondary font-semibold tracking-widest uppercase text-xs mb-3">What Parents Say</p>
        <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-3">
          Parent's <span className="text-gradient">Testimonials</span>
        </h2>
        <div className="section-divider" />
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 30, filter: "blur(4px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -6 }}
            className="relative bg-card border border-border rounded-2xl p-8 transition-shadow duration-300 card-shine group"
            style={{
              boxShadow: "var(--card-shadow)",
              backgroundImage: "linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--muted)) 100%)",
            }}
          >
            <Quote className="w-8 h-8 text-secondary/15 absolute top-6 right-6" />

            <div className="flex items-center gap-4 mb-5">
              <Avatar className="w-14 h-14 ring-2 ring-secondary/20 ring-offset-2 ring-offset-card">
                <AvatarImage src={t.image} alt={t.name} className="object-cover" />
                <AvatarFallback className="text-primary-foreground font-bold text-lg" style={{ background: t.color }}>
                  {t.initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-foreground text-sm">{t.name}</p>
                <p className="text-secondary text-xs font-medium">{t.relation}</p>
                {t.designation && <p className="text-muted-foreground text-[11px] mt-0.5">{t.designation}</p>}
              </div>
            </div>

            <div className="flex gap-0.5 mb-4">
              {[...Array(t.rating)].map((_, s) => (
                <motion.div
                  key={s}
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12 + s * 0.08, duration: 0.3 }}
                >
                  <Star className="w-4 h-4 fill-secondary text-secondary" />
                </motion.div>
              ))}
            </div>

            <p className="text-muted-foreground text-sm leading-relaxed italic">"{t.text}"</p>

            <motion.div
              className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl"
              style={{ background: `linear-gradient(90deg, ${t.color}, hsl(40, 60%, 55%))` }}
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.15 + 0.3, ease: [0.16, 1, 0.3, 1] }}
            />
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default TestimonialsSection;