import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface GalleryItem {
  url: string;
  caption: string;
}

const DEFAULT_IMAGES: GalleryItem[] = [
  { url: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600&h=400&fit=crop", caption: "Modern Classrooms" },
  { url: "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=600&h=400&fit=crop", caption: "Science Lab" },
  { url: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&h=400&fit=crop", caption: "Campus Life" },
  { url: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=600&h=400&fit=crop", caption: "Sports Day" },
  { url: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600&h=400&fit=crop", caption: "Library" },
  { url: "https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=600&h=400&fit=crop", caption: "Cultural Events" },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.85, filter: "blur(8px)" },
  visible: { opacity: 1, scale: 1, filter: "blur(0px)", transition: { duration: 0.6 } },
};

const GallerySection = () => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [gallery, setGallery] = useState<GalleryItem[]>(DEFAULT_IMAGES);

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("value")
      .eq("key", "gallery_images")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) {
          try {
            const parsed = JSON.parse(data.value);
            if (Array.isArray(parsed) && parsed.length > 0) setGallery(parsed);
          } catch {}
        }
      });
  }, []);

  return (
    <section id="gallery" className="py-28 bg-background relative overflow-hidden bg-grid-pattern">
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-secondary/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

      <div className="container px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <p className="text-secondary font-semibold tracking-widest uppercase text-xs mb-4">Campus Life</p>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Our <span className="text-shimmer">Gallery</span>
          </h2>
          <div className="section-divider mb-6" />
          <p className="text-muted-foreground text-lg">
            A glimpse into the vibrant life at Universal Public School.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-3 gap-4"
        >
          {gallery.map((item, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              whileHover={{ scale: 1.03 }}
              onClick={() => setSelectedImage(i)}
              className="relative group rounded-2xl overflow-hidden aspect-[3/2] cursor-pointer card-shine"
              style={{ boxShadow: "var(--card-shadow)" }}
            >
              <img
                src={item.url}
                alt={item.caption}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-5">
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  className="text-primary-foreground font-semibold text-sm"
                >
                  {item.caption}
                </motion.p>
              </div>
              <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-secondary/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                <span className="text-primary-foreground text-xs font-bold">{String(i + 1).padStart(2, "0")}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {selectedImage !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-primary/90 backdrop-blur-xl flex items-center justify-center p-8"
          onClick={() => setSelectedImage(null)}
        >
          <motion.button
            className="absolute top-6 right-6 text-primary-foreground/70 hover:text-secondary transition-colors"
            whileHover={{ scale: 1.1, rotate: 90 }}
          >
            <X className="w-8 h-8" />
          </motion.button>
          <motion.img
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            src={gallery[selectedImage].url}
            alt={gallery[selectedImage].caption}
            className="max-w-full max-h-[80vh] rounded-2xl object-contain"
            style={{ boxShadow: "0 25px 80px -20px hsla(0,0%,0%,0.5)" }}
          />
          <p className="absolute bottom-8 text-primary-foreground font-display text-xl">
            {gallery[selectedImage].caption}
          </p>
        </motion.div>
      )}
    </section>
  );
};

export default GallerySection;
