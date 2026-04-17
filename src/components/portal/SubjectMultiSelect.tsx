import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Loader2, BookOpen } from "lucide-react";

interface Props {
  className: string;
  selected: string[];
  onChange: (subjects: string[]) => void;
  required?: boolean;
}

export default function SubjectMultiSelect({ className, selected, onChange, required }: Props) {
  const [available, setAvailable] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!className) return;
    setLoading(true);
    supabase
      .from("class_subjects")
      .select("subject_name")
      .eq("class_name", className)
      .order("subject_name")
      .then(({ data }) => {
        setAvailable((data || []).map((r: any) => r.subject_name));
        setLoading(false);
      });
  }, [className]);

  const toggle = (subject: string) => {
    if (selected.includes(subject)) {
      onChange(selected.filter((s) => s !== subject));
    } else {
      onChange([...selected, subject]);
    }
  };

  return (
    <div>
      <Label className="text-sm font-semibold flex items-center gap-2">
        <BookOpen className="w-4 h-4" />
        Subjects {required && <span className="text-destructive">*</span>}
      </Label>
      <div className="mt-2">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading subjects…
          </div>
        ) : available.length === 0 ? (
          <p className="text-sm text-destructive">
            No subjects defined for Class {className}. An admin must add subjects first in the Subjects page.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {available.map((subject) => {
              const isActive = selected.includes(subject);
              return (
                <button
                  key={subject}
                  type="button"
                  onClick={() => toggle(subject)}
                  className="focus:outline-none"
                >
                  <Badge
                    variant={isActive ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/80 transition-colors"
                  >
                    {subject}
                  </Badge>
                </button>
              );
            })}
          </div>
        )}
        {selected.length > 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            {selected.length} subject{selected.length !== 1 ? "s" : ""} selected
          </p>
        )}
      </div>
    </div>
  );
}
