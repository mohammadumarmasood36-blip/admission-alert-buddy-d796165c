import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  variant?: "default" | "primary" | "secondary" | "accent" | "success";
}

const variantStyles = {
  default: "bg-card border border-border",
  primary: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  accent: "bg-accent text-accent-foreground",
  success: "bg-success text-success-foreground",
};

const iconVariantStyles = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary-foreground/20 text-primary-foreground",
  secondary: "bg-secondary-foreground/20 text-secondary-foreground",
  accent: "bg-accent-foreground/20 text-accent-foreground",
  success: "bg-success-foreground/20 text-success-foreground",
};

const descVariantStyles = {
  default: "text-muted-foreground",
  primary: "text-primary-foreground/70",
  secondary: "text-secondary-foreground/70",
  accent: "text-accent-foreground/70",
  success: "text-success-foreground/70",
};

export default function StatCard({ title, value, icon: Icon, description, variant = "default" }: StatCardProps) {
  return (
    <div className={`rounded-xl p-5 ${variantStyles[variant]} transition-all duration-200 hover:shadow-md`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium opacity-80">{title}</p>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconVariantStyles[variant]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold font-display">{value}</p>
      {description && <p className={`text-xs mt-1 ${descVariantStyles[variant]}`}>{description}</p>}
    </div>
  );
}
