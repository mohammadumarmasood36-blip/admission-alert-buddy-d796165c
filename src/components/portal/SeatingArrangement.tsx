import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, MapPin, ArrowLeft, Eye, Loader2, LayoutGrid } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface RoomConfig {
  id: string;
  examination_id: string;
  room_number: string;
  benches_per_row: number;
  num_rows: number;
  bench_capacity: number;
}

interface StudentInfo {
  name: string;
  roll_number: number | null;
  class_name: string;
  admission_number: string;
}

interface SeatAssignment {
  student: StudentInfo;
  room: string;
  row: number;
  bench: number;
  position: number; // 0=left, 1=right, etc.
}

interface SeatingArrangementProps {
  examId: string;
  examClasses: string[];
}

// Interleave students from different classes so no two adjacent are same class
function interleaveStudents(studentsByClass: Map<string, StudentInfo[]>): StudentInfo[] {
  const classes = Array.from(studentsByClass.keys());
  const queues = new Map<string, StudentInfo[]>();
  classes.forEach(cls => {
    const students = [...(studentsByClass.get(cls) || [])];
    students.sort((a, b) => (a.roll_number || 0) - (b.roll_number || 0));
    queues.set(cls, students);
  });

  // Sort classes by student count descending for better distribution
  classes.sort((a, b) => (queues.get(b)?.length || 0) - (queues.get(a)?.length || 0));

  const result: StudentInfo[] = [];
  let lastClass = "";
  let totalRemaining = Array.from(queues.values()).reduce((s, q) => s + q.length, 0);

  while (totalRemaining > 0) {
    let placed = false;
    for (const cls of classes) {
      const queue = queues.get(cls)!;
      if (queue.length > 0 && cls !== lastClass) {
        result.push(queue.shift()!);
        lastClass = cls;
        totalRemaining--;
        placed = true;
        break;
      }
    }
    if (!placed) {
      // If we can't avoid same class adjacent, just pick the largest remaining queue
      for (const cls of classes) {
        const queue = queues.get(cls)!;
        if (queue.length > 0) {
          result.push(queue.shift()!);
          lastClass = cls;
          totalRemaining--;
          break;
        }
      }
    }
    // Re-sort classes by remaining count
    classes.sort((a, b) => (queues.get(b)?.length || 0) - (queues.get(a)?.length || 0));
  }

  return result;
}

function generateSeatingPlan(
  rooms: RoomConfig[],
  studentsByClass: Map<string, StudentInfo[]>
): SeatAssignment[] {
  const interleaved = interleaveStudents(studentsByClass);
  const assignments: SeatAssignment[] = [];
  let studentIdx = 0;

  for (const room of rooms) {
    const totalSeats = room.benches_per_row * room.num_rows * room.bench_capacity;
    for (let row = 0; row < room.num_rows && studentIdx < interleaved.length; row++) {
      for (let bench = 0; bench < room.benches_per_row && studentIdx < interleaved.length; bench++) {
        for (let pos = 0; pos < room.bench_capacity && studentIdx < interleaved.length; pos++) {
          assignments.push({
            student: interleaved[studentIdx],
            room: room.room_number,
            row: row + 1,
            bench: bench + 1,
            position: pos,
          });
          studentIdx++;
        }
      }
    }
  }

  return assignments;
}

// Color map for classes
const classColors: Record<string, string> = {};
const colorPalette = [
  "bg-blue-100 text-blue-800 border-blue-300",
  "bg-green-100 text-green-800 border-green-300",
  "bg-purple-100 text-purple-800 border-purple-300",
  "bg-orange-100 text-orange-800 border-orange-300",
  "bg-pink-100 text-pink-800 border-pink-300",
  "bg-teal-100 text-teal-800 border-teal-300",
  "bg-yellow-100 text-yellow-800 border-yellow-300",
  "bg-red-100 text-red-800 border-red-300",
  "bg-indigo-100 text-indigo-800 border-indigo-300",
  "bg-cyan-100 text-cyan-800 border-cyan-300",
];

function getClassColor(cls: string): string {
  if (!classColors[cls]) {
    classColors[cls] = colorPalette[Object.keys(classColors).length % colorPalette.length];
  }
  return classColors[cls];
}

export default function SeatingArrangement({ examId, examClasses }: SeatingArrangementProps) {
  const [roomConfigs, setRoomConfigs] = useState<RoomConfig[]>([]);
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [assignments, setAssignments] = useState<SeatAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [roomForms, setRoomForms] = useState<Array<{
    room_number: string;
    benches_per_row: string;
    num_rows: string;
    bench_capacity: string;
  }>>([{ room_number: "", benches_per_row: "4", num_rows: "5", bench_capacity: "2" }]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [configRes, studentRes] = await Promise.all([
      supabase.from("exam_room_configs").select("*").eq("examination_id", examId),
      supabase.from("students").select("name, roll_number, class_name, admission_number").in("class_name", examClasses),
    ]);

    const configs = (configRes.data || []) as unknown as RoomConfig[];
    const studs = (studentRes.data || []) as unknown as StudentInfo[];

    setRoomConfigs(configs);
    setStudents(studs);

    // Generate seating if configs exist
    if (configs.length > 0 && studs.length > 0) {
      const byClass = new Map<string, StudentInfo[]>();
      studs.forEach(s => {
        if (!byClass.has(s.class_name)) byClass.set(s.class_name, []);
        byClass.get(s.class_name)!.push(s);
      });
      const plan = generateSeatingPlan(configs, byClass);
      setAssignments(plan);
    } else {
      setAssignments([]);
    }

    setLoading(false);
  }, [examId, examClasses]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addRoomForm = () => {
    setRoomForms(prev => [...prev, { room_number: "", benches_per_row: "4", num_rows: "5", bench_capacity: "2" }]);
  };

  const removeRoomForm = (idx: number) => {
    setRoomForms(prev => prev.filter((_, i) => i !== idx));
  };

  const updateRoomForm = (idx: number, field: string, value: string) => {
    setRoomForms(prev => prev.map((f, i) => i === idx ? { ...f, [field]: value } : f));
  };

  const handleSaveRooms = async () => {
    const valid = roomForms.every(f => f.room_number && Number(f.benches_per_row) > 0 && Number(f.num_rows) > 0 && Number(f.bench_capacity) > 0);
    if (!valid) {
      toast.error("Please fill all room details correctly");
      return;
    }

    // Delete existing configs for this exam
    await supabase.from("exam_room_configs").delete().eq("examination_id", examId);

    const rows = roomForms.map(f => ({
      examination_id: examId,
      room_number: f.room_number,
      benches_per_row: Number(f.benches_per_row),
      num_rows: Number(f.num_rows),
      bench_capacity: Number(f.bench_capacity),
    }));

    const { error } = await supabase.from("exam_room_configs").insert(rows);
    if (error) {
      toast.error("Failed to save room configurations");
      console.error(error);
      return;
    }

    toast.success("Room configurations saved! Seating plan generated.");
    setConfigDialogOpen(false);
    fetchData();
  };

  const handleDeleteAllConfigs = async () => {
    await supabase.from("exam_room_configs").delete().eq("examination_id", examId);
    toast.success("Room configurations cleared");
    fetchData();
  };

  const openConfigDialog = () => {
    if (roomConfigs.length > 0) {
      setRoomForms(roomConfigs.map(r => ({
        room_number: r.room_number,
        benches_per_row: String(r.benches_per_row),
        num_rows: String(r.num_rows),
        bench_capacity: String(r.bench_capacity),
      })));
    } else {
      setRoomForms([{ room_number: "", benches_per_row: "4", num_rows: "5", bench_capacity: "2" }]);
    }
    setConfigDialogOpen(true);
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }

  // Get assignments for a specific room
  const getRoomAssignments = (roomNumber: string) => assignments.filter(a => a.room === roomNumber);
  const getRoomConfig = (roomNumber: string) => roomConfigs.find(r => r.room_number === roomNumber);

  // Get unique classes in assignments
  const assignedClasses = Array.from(new Set(assignments.map(a => a.student.class_name)));

  // DETAIL VIEW: Show specific room seating map
  if (selectedRoom) {
    const roomAssignments = getRoomAssignments(selectedRoom);
    const config = getRoomConfig(selectedRoom);

    if (!config) return null;

    // Build a grid: rows x benches x positions
    const grid: (SeatAssignment | null)[][][] = [];
    for (let r = 0; r < config.num_rows; r++) {
      const row: (SeatAssignment | null)[][] = [];
      for (let b = 0; b < config.benches_per_row; b++) {
        const bench: (SeatAssignment | null)[] = [];
        for (let p = 0; p < config.bench_capacity; p++) {
          const seat = roomAssignments.find(a => a.row === r + 1 && a.bench === b + 1 && a.position === p);
          bench.push(seat || null);
        }
        row.push(bench);
      }
      grid.push(row);
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedRoom(null)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h3 className="text-lg font-semibold">Room {selectedRoom} — Seating Map</h3>
            <p className="text-sm text-muted-foreground">
              {config.num_rows} rows × {config.benches_per_row} benches × {config.bench_capacity} seats/bench = {config.num_rows * config.benches_per_row * config.bench_capacity} total seats
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2">
          {assignedClasses.map(cls => (
            <Badge key={cls} className={`${getClassColor(cls)} border`}>{cls}</Badge>
          ))}
        </div>

        {/* Room Layout */}
        <Card>
          <CardContent className="p-4">
            <div className="text-center text-xs text-muted-foreground mb-4 font-semibold uppercase tracking-wider">
              — Board / Front —
            </div>
            <div className="space-y-3">
              {grid.map((row, rowIdx) => (
                <div key={rowIdx} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-12 shrink-0">Row {rowIdx + 1}</span>
                  <div className="flex gap-4 flex-wrap flex-1">
                    {row.map((bench, benchIdx) => (
                      <div key={benchIdx} className="flex border rounded-lg overflow-hidden">
                        {bench.map((seat, posIdx) => (
                          <div
                            key={posIdx}
                            className={`px-2 py-1.5 min-w-[80px] text-center text-xs ${
                              seat ? getClassColor(seat.student.class_name) : "bg-muted text-muted-foreground"
                            } ${posIdx > 0 ? "border-l" : ""}`}
                          >
                            {seat ? (
                              <div>
                                <div className="font-semibold text-[10px]">{seat.student.name}</div>
                                <div className="text-[9px]">{seat.student.class_name} | Roll {seat.student.roll_number ?? "—"}</div>
                              </div>
                            ) : (
                              <span className="text-[10px]">Empty</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center text-xs text-muted-foreground mt-4 font-semibold uppercase tracking-wider">
              — Back —
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // MAIN DASHBOARD VIEW
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h3 className="text-lg font-semibold">Seating Arrangements</h3>
        <div className="flex gap-2">
          {roomConfigs.length > 0 && (
            <Button size="sm" variant="outline" onClick={handleDeleteAllConfigs}>
              <Trash2 className="w-4 h-4 mr-1" /> Clear All
            </Button>
          )}
          <Button size="sm" onClick={openConfigDialog}>
            <Plus className="w-4 h-4 mr-1" /> {roomConfigs.length > 0 ? "Edit Rooms" : "Configure Rooms"}
          </Button>
        </div>
      </div>

      {/* Room Config Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Exam Rooms</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Enter details for each room. Students will be automatically allocated with no same-class students sitting adjacent (left-right on the same bench).
            </p>
            {roomForms.map((form, idx) => (
              <Card key={idx}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-semibold">Room #{idx + 1}</h4>
                    {roomForms.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeRoomForm(idx)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Room Number</Label>
                      <Input
                        value={form.room_number}
                        onChange={e => updateRoomForm(idx, "room_number", e.target.value)}
                        placeholder="e.g. 101"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Benches Per Row</Label>
                      <Input
                        type="number"
                        min="1"
                        value={form.benches_per_row}
                        onChange={e => updateRoomForm(idx, "benches_per_row", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Number of Rows</Label>
                      <Input
                        type="number"
                        min="1"
                        value={form.num_rows}
                        onChange={e => updateRoomForm(idx, "num_rows", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Seats Per Bench</Label>
                      <Input
                        type="number"
                        min="1"
                        value={form.bench_capacity}
                        onChange={e => updateRoomForm(idx, "bench_capacity", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total seats: {Number(form.benches_per_row || 0) * Number(form.num_rows || 0) * Number(form.bench_capacity || 0)}
                  </p>
                </CardContent>
              </Card>
            ))}
            <Button variant="outline" onClick={addRoomForm} className="w-full">
              <Plus className="w-4 h-4 mr-1" /> Add Another Room
            </Button>
            <div className="bg-muted rounded-lg p-3">
              <p className="text-sm font-medium">
                Total students: {students.length} | Total seats: {roomForms.reduce((s, f) =>
                  s + Number(f.benches_per_row || 0) * Number(f.num_rows || 0) * Number(f.bench_capacity || 0), 0
                )}
              </p>
            </div>
            <Button onClick={handleSaveRooms} className="w-full">
              Save & Generate Seating Plan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {roomConfigs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <MapPin className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No room configurations yet.</p>
            <p className="text-sm mt-1">Click "Configure Rooms" to set up rooms and auto-generate seating.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Room Cards Dashboard */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {roomConfigs.map(room => {
              const roomAssignments = getRoomAssignments(room.room_number);
              const totalSeats = room.benches_per_row * room.num_rows * room.bench_capacity;
              const classCounts = new Map<string, number>();
              roomAssignments.forEach(a => {
                classCounts.set(a.student.class_name, (classCounts.get(a.student.class_name) || 0) + 1);
              });

              return (
                <Card
                  key={room.id}
                  className="cursor-pointer hover:border-primary/40 transition-colors"
                  onClick={() => setSelectedRoom(room.room_number)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base flex items-center gap-2">
                        <LayoutGrid className="w-4 h-4 text-primary" />
                        Room {room.room_number}
                      </CardTitle>
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <div className="bg-muted rounded p-1.5 text-center">
                        <span className="font-bold text-sm">{room.num_rows}</span> rows
                      </div>
                      <div className="bg-muted rounded p-1.5 text-center">
                        <span className="font-bold text-sm">{room.benches_per_row}</span> benches/row
                      </div>
                      <div className="bg-muted rounded p-1.5 text-center">
                        <span className="font-bold text-sm">{room.bench_capacity}</span> seats/bench
                      </div>
                      <div className="bg-muted rounded p-1.5 text-center">
                        <span className="font-bold text-sm">{roomAssignments.length}/{totalSeats}</span> filled
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {Array.from(classCounts.entries()).map(([cls, count]) => (
                        <Badge key={cls} variant="secondary" className={`text-[10px] ${getClassColor(cls)} border`}>
                          {cls}: {count}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Summary Table: Rooms × Classes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Seating Summary — Class × Room</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Class</TableHead>
                    {roomConfigs.map(r => (
                      <TableHead key={r.id} className="text-center font-semibold">Room {r.room_number}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignedClasses.map(cls => (
                    <TableRow key={cls}>
                      <TableCell className="font-medium">
                        <Badge className={`${getClassColor(cls)} border`}>{cls}</Badge>
                      </TableCell>
                      {roomConfigs.map(r => {
                        const studs = assignments
                          .filter(a => a.room === r.room_number && a.student.class_name === cls)
                          .map(a => `${a.student.roll_number ?? "—"} (${a.student.name})`)
                          .join(", ");
                        return (
                          <TableCell key={r.id} className="text-center text-xs">
                            {studs || "—"}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
