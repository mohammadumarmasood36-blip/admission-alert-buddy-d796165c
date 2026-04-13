import { useState, useEffect } from "react";
import DashboardLayout from "@/components/portal/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Image, IndianRupee, Users, Info, Pencil, Save, Loader2, UserCircle, CalendarDays } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface GalleryItem {
  url: string;
  caption: string;
}

interface FeeRow {
  class: string;
  admissionFee: string;
  tuitionFee: string;
  annualCharges: string;
  total: string;
}

interface SchoolInfo {
  schoolName: string;
  address: string;
  phone: string;
  email: string;
  aboutText: string;
  admissionOpen: string;
}

const DEFAULT_GALLERY: GalleryItem[] = [
  { url: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600&h=400&fit=crop", caption: "Modern Classrooms" },
  { url: "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=600&h=400&fit=crop", caption: "Science Lab" },
  { url: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&h=400&fit=crop", caption: "Campus Life" },
  { url: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=600&h=400&fit=crop", caption: "Sports Day" },
  { url: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600&h=400&fit=crop", caption: "Library" },
  { url: "https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=600&h=400&fit=crop", caption: "Cultural Events" },
];

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

const DEFAULT_INFO: SchoolInfo = {
  schoolName: "Universal Public School",
  address: "",
  phone: "",
  email: "",
  aboutText: "",
  admissionOpen: "Admissions Open for 2026-27",
};

async function loadSetting(key: string) {
  const { data } = await supabase.from("app_settings").select("value").eq("key", key).maybeSingle();
  return data?.value ? JSON.parse(data.value) : null;
}

async function saveSetting(key: string, value: any) {
  const jsonValue = JSON.stringify(value);
  const { data: existing } = await supabase.from("app_settings").select("key").eq("key", key).maybeSingle();
  if (existing) {
    // Use upsert since we can't UPDATE via RLS insert-only
    const { error } = await supabase.from("app_settings").upsert({ key, value: jsonValue });
    if (error) throw error;
  } else {
    const { error } = await supabase.from("app_settings").insert({ key, value: jsonValue });
    if (error) throw error;
  }
}

// ─── Gallery Tab ───
function GalleryTab() {
  const [gallery, setGallery] = useState<GalleryItem[]>(DEFAULT_GALLERY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newCaption, setNewCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState<"file" | "url">("file");
  const fileInputRef = useState<HTMLInputElement | null>(null);

  useEffect(() => {
    loadSetting("gallery_images").then((data) => {
      if (data) setGallery(data);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSetting("gallery_images", gallery);
      toast.success("Gallery updated successfully!");
    } catch {
      toast.error("Failed to save gallery");
    }
    setSaving(false);
  };

  const uploadFileToStorage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `gallery_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

    // Try uploading to Supabase Storage
    const { data, error } = await supabase.storage
      .from('gallery')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (error) {
      console.error("Storage upload error:", error);
      // Fallback: convert to base64 data URL
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from('gallery').getPublicUrl(data.path);
    return urlData.publicUrl;
  };

  const addImage = async () => {
    if (uploadMode === "file") {
      if (!selectedFile) { toast.error("Please select an image file"); return; }
      setUploading(true);
      try {
        const url = await uploadFileToStorage(selectedFile);
        if (!url) { toast.error("Failed to process image"); setUploading(false); return; }
        setGallery([...gallery, { url, caption: newCaption.trim() || "Untitled" }]);
        setSelectedFile(null);
        setNewCaption("");
        setAddOpen(false);
        toast.success("Image added! Click Save to publish changes.");
      } catch {
        toast.error("Failed to upload image");
      }
      setUploading(false);
    } else {
      if (!newUrl.trim()) { toast.error("Enter image URL"); return; }
      setGallery([...gallery, { url: newUrl.trim(), caption: newCaption.trim() || "Untitled" }]);
      setNewUrl(""); setNewCaption(""); setAddOpen(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const removeImage = (index: number) => setGallery(gallery.filter((_, i) => i !== index));

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Manage gallery images displayed on the website.</p>
        <div className="flex gap-2">
          <Dialog open={addOpen} onOpenChange={(open) => { setAddOpen(open); if (!open) { setSelectedFile(null); setNewUrl(""); setNewCaption(""); } }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Add Image</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Gallery Image</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="flex gap-2">
                  <Button size="sm" variant={uploadMode === "file" ? "default" : "outline"} onClick={() => setUploadMode("file")} className="flex-1">
                    <Image className="w-4 h-4 mr-1" /> Upload File
                  </Button>
                  <Button size="sm" variant={uploadMode === "url" ? "default" : "outline"} onClick={() => setUploadMode("url")} className="flex-1">
                    Image URL
                  </Button>
                </div>
                {uploadMode === "file" ? (
                  <div>
                    <Label>Select Image from PC *</Label>
                    <Input type="file" accept="image/*" onChange={handleFileSelect} className="mt-1.5 cursor-pointer" />
                    {selectedFile && (
                      <p className="text-xs text-muted-foreground mt-1">Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)</p>
                    )}
                  </div>
                ) : (
                  <div><Label>Image URL *</Label><Input placeholder="https://..." value={newUrl} onChange={(e) => setNewUrl(e.target.value)} className="mt-1.5" /></div>
                )}
                <div><Label>Caption</Label><Input placeholder="e.g. Sports Day" value={newCaption} onChange={(e) => setNewCaption(e.target.value)} className="mt-1.5" /></div>
                <Button onClick={addImage} className="w-full" disabled={uploading}>
                  {uploading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Uploading...</> : "Add Image"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button size="sm" variant="outline" className="gap-2" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {gallery.map((item, i) => (
          <div key={i} className="relative group rounded-xl overflow-hidden aspect-[3/2] bg-muted">
            <img src={item.url} alt={item.caption} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
              <p className="text-primary-foreground text-sm font-medium">{item.caption}</p>
              <Button size="sm" variant="destructive" onClick={() => removeImage(i)} className="gap-1">
                <Trash2 className="w-3 h-3" /> Remove
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Fee Structure Tab ───
function FeeStructureTab() {
  const [fees, setFees] = useState<FeeRow[]>(DEFAULT_FEES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  useEffect(() => {
    loadSetting("fee_structure").then((data) => {
      if (data) setFees(data);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSetting("fee_structure", fees);
      toast.success("Fee structure updated!");
    } catch {
      toast.error("Failed to save fee structure");
    }
    setSaving(false);
  };

  const updateFee = (index: number, field: keyof FeeRow, value: string) => {
    setFees(fees.map((f, i) => i === index ? { ...f, [field]: value } : f));
  };

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Update fee structure shown on the website.</p>
        <Button size="sm" variant="outline" className="gap-2" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted text-xs font-semibold text-muted-foreground uppercase">
                <th className="text-left px-4 py-3">Class</th>
                <th className="text-center px-4 py-3">Admission Fee</th>
                <th className="text-center px-4 py-3">Tuition (Monthly)</th>
                <th className="text-center px-4 py-3">Annual Charges</th>
                <th className="text-center px-4 py-3">Total</th>
                <th className="text-center px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {fees.map((row, i) => (
                <tr key={i} className="border-t border-border">
                  {editIndex === i ? (
                    <>
                      <td className="px-4 py-2"><Input value={row.class} onChange={(e) => updateFee(i, "class", e.target.value)} className="h-8 text-sm" /></td>
                      <td className="px-4 py-2"><Input value={row.admissionFee} onChange={(e) => updateFee(i, "admissionFee", e.target.value)} className="h-8 text-sm text-center" /></td>
                      <td className="px-4 py-2"><Input value={row.tuitionFee} onChange={(e) => updateFee(i, "tuitionFee", e.target.value)} className="h-8 text-sm text-center" /></td>
                      <td className="px-4 py-2"><Input value={row.annualCharges} onChange={(e) => updateFee(i, "annualCharges", e.target.value)} className="h-8 text-sm text-center" /></td>
                      <td className="px-4 py-2"><Input value={row.total} onChange={(e) => updateFee(i, "total", e.target.value)} className="h-8 text-sm text-center" /></td>
                      <td className="px-4 py-2 text-center">
                        <Button size="sm" variant="ghost" onClick={() => setEditIndex(null)}><Save className="w-4 h-4 text-success" /></Button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium">{row.class}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">₹{row.admissionFee}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">₹{row.tuitionFee}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">₹{row.annualCharges}</td>
                      <td className="px-4 py-3 text-center font-bold text-secondary">₹{row.total}</td>
                      <td className="px-4 py-3 text-center">
                        <Button size="sm" variant="ghost" onClick={() => setEditIndex(i)}><Pencil className="w-4 h-4 text-muted-foreground" /></Button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Teacher Profiles Tab ───
function TeacherProfilesTab() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("staff")
        .select('id, "Full Name", Photo, Role, teaching_classes')
        .eq("Role", "teacher");
      if (data) setTeachers(data);
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Teacher profiles shown on the website's "Our Team" page. To add/edit teachers, go to <strong>Staff Management</strong>.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {teachers.length === 0 ? (
          <p className="text-muted-foreground col-span-full text-center py-10">No teachers found. Add teachers from Staff Management.</p>
        ) : teachers.map((t) => (
          <div key={t.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            {t.Photo ? (
              <img src={t.Photo} alt={t["Full Name"]} className="w-14 h-14 rounded-full object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                {t["Full Name"]?.charAt(0)}
              </div>
            )}
            <div>
              <p className="font-medium text-sm">{t["Full Name"]}</p>
              <p className="text-xs text-muted-foreground capitalize">{t.Role}</p>
              {t.teaching_classes?.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">Classes: {t.teaching_classes.join(", ")}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── School Info Tab ───
function SchoolInfoTab() {
  const [info, setInfo] = useState<SchoolInfo>(DEFAULT_INFO);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSetting("school_info").then((data) => {
      if (data) setInfo({ ...DEFAULT_INFO, ...data });
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSetting("school_info", info);
      toast.success("School info updated!");
    } catch {
      toast.error("Failed to save school info");
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Update general school information displayed on the website.</p>
        <Button size="sm" variant="outline" className="gap-2" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card border border-border rounded-xl p-6">
        <div><Label>School Name</Label><Input value={info.schoolName} onChange={(e) => setInfo({ ...info, schoolName: e.target.value })} className="mt-1.5" /></div>
        <div><Label>Phone Number</Label><Input value={info.phone} onChange={(e) => setInfo({ ...info, phone: e.target.value })} className="mt-1.5" placeholder="+91 ..." /></div>
        <div><Label>Email</Label><Input value={info.email} onChange={(e) => setInfo({ ...info, email: e.target.value })} className="mt-1.5" placeholder="school@example.com" /></div>
        <div><Label>Admission Ticker Text</Label><Input value={info.admissionOpen} onChange={(e) => setInfo({ ...info, admissionOpen: e.target.value })} className="mt-1.5" /></div>
        <div className="md:col-span-2"><Label>Address</Label><Input value={info.address} onChange={(e) => setInfo({ ...info, address: e.target.value })} className="mt-1.5" placeholder="Full school address" /></div>
        <div className="md:col-span-2"><Label>About Section Text</Label><Textarea value={info.aboutText} onChange={(e) => setInfo({ ...info, aboutText: e.target.value })} className="mt-1.5 min-h-[120px]" placeholder="Describe your school..." /></div>
      </div>
    </div>
  );
}

// ─── Leadership Profiles Tab ───
function LeadershipTab() {
  const { user } = useAuth();
  const [principalName, setPrincipalName] = useState("Mr. Rafi Sir");
  const [principalPhoto, setPrincipalPhoto] = useState("");
  const [principalSignature, setPrincipalSignature] = useState("");
  const [directorName, setDirectorName] = useState("The Director");
  const [directorPhoto, setDirectorPhoto] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      loadSetting("principal_profile"),
      loadSetting("director_profile"),
    ]).then(([principal, director]) => {
      if (principal) {
        setPrincipalName(principal.name || "Mr. Rafi Sir");
        setPrincipalPhoto(principal.photo || "");
        setPrincipalSignature(principal.signature || "");
      }
      if (director) {
        setDirectorName(director.name || "The Director");
        setDirectorPhoto(director.photo || "");
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        saveSetting("principal_profile", { name: principalName, photo: principalPhoto, signature: principalSignature }),
        saveSetting("director_profile", { name: directorName, photo: directorPhoto }),
      ]);
      toast.success("Leadership profiles updated!");
    } catch {
      toast.error("Failed to save");
    }
    setSaving(false);
  };

  const handleFileUpload = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setter(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Update Principal and Director profiles shown on the website.</p>
        <Button size="sm" variant="outline" className="gap-2" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Principal */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h3 className="font-bold text-lg">Principal</h3>
          <div className="flex items-center gap-4">
            {principalPhoto ? (
              <img src={principalPhoto} alt="Principal" className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">P</div>
            )}
            <div className="flex-1 space-y-2">
              <div><Label>Name</Label><Input value={principalName} onChange={(e) => setPrincipalName(e.target.value)} className="mt-1" /></div>
              <div><Label>Photo (JPG/PNG)</Label><Input type="file" accept="image/*" onChange={handleFileUpload(setPrincipalPhoto)} className="mt-1" /></div>
            </div>
          </div>
          <div className="space-y-2 pt-2 border-t border-border">
            <Label className="font-semibold">Principal Signature (for ID Cards)</Label>
            <div className="flex items-center gap-4">
              {principalSignature ? (
                <img src={principalSignature} alt="Signature" className="h-12 object-contain border border-border rounded p-1 bg-white" />
              ) : (
                <div className="h-12 w-32 border border-dashed border-border rounded flex items-center justify-center text-xs text-muted-foreground">No signature</div>
              )}
              <Input type="file" accept="image/*" onChange={handleFileUpload(setPrincipalSignature)} className="flex-1" />
            </div>
            <p className="text-xs text-muted-foreground">Upload a transparent PNG of the principal's signature for student ID cards.</p>
          </div>
        </div>

        {/* Director / Manager */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h3 className="font-bold text-lg">Director / Manager</h3>
          <div className="flex items-center gap-4">
            {directorPhoto ? (
              <img src={directorPhoto} alt="Director" className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">D</div>
            )}
            <div className="flex-1 space-y-2">
              <div><Label>Name</Label><Input value={directorName} onChange={(e) => setDirectorName(e.target.value)} className="mt-1" /></div>
              <div><Label>Photo (JPG/PNG)</Label><Input type="file" accept="image/*" onChange={handleFileUpload(setDirectorPhoto)} className="mt-1" /></div>
            </div>
          </div>
        </div>
      </div>

      {/* UPI Settings - Manager only */}
      {user?.role === "manager" && <UpiSettingsSection />}
    </div>
  );
}

// ─── UPI Settings ───
function UpiSettingsSection() {
  const [upiId, setUpiId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSetting("director_upi").then((data) => {
      if (data) setUpiId(data);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSetting("director_upi", upiId);
      toast.success("UPI ID saved!");
    } catch {
      toast.error("Failed to save UPI ID");
    }
    setSaving(false);
  };

  if (loading) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4 mt-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg">UPI Payment Settings</h3>
          <p className="text-sm text-muted-foreground">QR code will be generated for online fee payments using this UPI ID.</p>
        </div>
        <Button size="sm" variant="outline" className="gap-2" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
        </Button>
      </div>
      <div className="max-w-md">
        <Label>Director UPI ID</Label>
        <Input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="e.g. director@upi" className="mt-1.5" />
      </div>
    </div>
  );
}

// ─── Academic Sessions Tab ───
function SessionsTab() {
  const { loadSessions } = useAuth();
  const [sessions, setSessions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSession, setNewSession] = useState("");

  useEffect(() => {
    loadSetting("academic_sessions").then((data) => {
      if (data && Array.isArray(data)) setSessions(data);
      else setSessions(["2024-25", "2025-26", "2026-27"]);
      setLoading(false);
    });
  }, []);

  const handleSave = async (updatedSessions: string[]) => {
    setSaving(true);
    try {
      await saveSetting("academic_sessions", updatedSessions);
      setSessions(updatedSessions);
      await loadSessions();
      toast.success("Sessions updated!");
    } catch {
      toast.error("Failed to save sessions");
    }
    setSaving(false);
  };

  const addSession = () => {
    const trimmed = newSession.trim();
    if (!trimmed) { toast.error("Enter a session name"); return; }
    if (sessions.includes(trimmed)) { toast.error("Session already exists"); return; }
    const updated = [...sessions, trimmed].sort();
    handleSave(updated);
    setNewSession("");
  };

  const removeSession = (s: string) => {
    if (sessions.length <= 1) { toast.error("At least one session is required"); return; }
    handleSave(sessions.filter((sess) => sess !== s));
  };

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">Create or delete academic sessions. These sessions appear on the login page and sidebar for all roles.</p>

      <div className="flex flex-wrap gap-2">
        {sessions.map((s) => (
          <div key={s} className="flex items-center gap-2 bg-card border border-border rounded-lg px-4 py-2.5">
            <CalendarDays className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">{s}</span>
            <button onClick={() => removeSession(s)} className="text-destructive hover:text-destructive/80 ml-1" title="Delete session">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2 max-w-sm">
        <Input
          placeholder="e.g. 2027-28"
          value={newSession}
          onChange={(e) => setNewSession(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addSession()}
        />
        <Button onClick={addSession} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Add
        </Button>
      </div>
    </div>
  );
}

// ─── Main Page ───
export default function WebsiteManagePage() {
  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display">Website Management</h1>
        <p className="text-muted-foreground mt-1">Update gallery, fees, teacher profiles, leadership, sessions, and school information displayed on the website.</p>
      </div>

      <Tabs defaultValue="gallery" className="space-y-6">
        <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full">
          <TabsTrigger value="gallery" className="gap-2"><Image className="w-4 h-4" /> Gallery</TabsTrigger>
          <TabsTrigger value="fees" className="gap-2"><IndianRupee className="w-4 h-4" /> Fees</TabsTrigger>
          <TabsTrigger value="teachers" className="gap-2"><Users className="w-4 h-4" /> Teachers</TabsTrigger>
          <TabsTrigger value="leadership" className="gap-2"><UserCircle className="w-4 h-4" /> Leadership</TabsTrigger>
          <TabsTrigger value="sessions" className="gap-2"><CalendarDays className="w-4 h-4" /> Sessions</TabsTrigger>
          <TabsTrigger value="info" className="gap-2"><Info className="w-4 h-4" /> School Info</TabsTrigger>
        </TabsList>

        <TabsContent value="gallery"><GalleryTab /></TabsContent>
        <TabsContent value="fees"><FeeStructureTab /></TabsContent>
        <TabsContent value="teachers"><TeacherProfilesTab /></TabsContent>
        <TabsContent value="leadership"><LeadershipTab /></TabsContent>
        <TabsContent value="sessions"><SessionsTab /></TabsContent>
        <TabsContent value="info"><SchoolInfoTab /></TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
