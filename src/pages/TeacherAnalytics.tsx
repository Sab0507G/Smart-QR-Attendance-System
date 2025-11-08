import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, TrendingUp, Users, BarChart3 } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts";

interface AttendanceRecord {
  id: string;
  student_id: string;
  class_id: string;
  marked_at: string;
  qr_session_id: string;
  profiles: {
    full_name: string;
    roll_number: string;
  };
  classes: {
    name: string;
  };
}

interface ClassStats {
  class_name: string;
  total_sessions: number;
  total_attendance: number;
  attendance_rate: number;
}

interface DailyTrend {
  date: string;
  count: number;
}

export default function TeacherAnalytics() {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [classes, setClasses] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [classStats, setClassStats] = useState<ClassStats[]>([]);
  const [dailyTrends, setDailyTrends] = useState<DailyTrend[]>([]);
  const [overallStats, setOverallStats] = useState({
    totalStudents: 0,
    totalSessions: 0,
    avgAttendanceRate: 0,
    totalAttendance: 0,
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setSession(session);
    };

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setSession(session);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    if (session) {
      fetchClasses();
      fetchAnalyticsData();
    }
  }, [session]);

  useEffect(() => {
    if (attendanceData.length > 0) {
      calculateStats();
    }
  }, [attendanceData, selectedClass]);

  const fetchClasses = async () => {
    const { data, error } = await (supabase as any)
      .from("classes")
      .select("*")
      .order("name");

    if (!error && data) {
      setClasses(data);
    }
  };

  const fetchAnalyticsData = async () => {
    const { data, error } = await (supabase as any)
      .from("attendance")
      .select(`
        *,
        profiles(full_name, roll_number),
        classes(name)
      `)
      .order("marked_at", { ascending: false });

    if (!error && data) {
      setAttendanceData(data);
    }
  };

  const calculateStats = () => {
    const filteredData = selectedClass === "all" 
      ? attendanceData 
      : attendanceData.filter(record => record.class_id === selectedClass);

    // Calculate overall stats
    const uniqueStudents = new Set(filteredData.map(r => r.student_id)).size;
    const uniqueSessions = new Set(filteredData.map(r => r.qr_session_id)).size;
    
    setOverallStats({
      totalStudents: uniqueStudents,
      totalSessions: uniqueSessions,
      totalAttendance: filteredData.length,
      avgAttendanceRate: uniqueSessions > 0 ? (filteredData.length / uniqueSessions) * 100 / Math.max(uniqueStudents, 1) : 0,
    });

    // Calculate class-wise stats
    const classMap = new Map<string, ClassStats>();
    
    attendanceData.forEach(record => {
      const className = record.classes.name;
      if (!classMap.has(className)) {
        classMap.set(className, {
          class_name: className,
          total_sessions: 0,
          total_attendance: 0,
          attendance_rate: 0,
        });
      }
      
      const stats = classMap.get(className)!;
      stats.total_attendance++;
    });

    // Calculate sessions per class
    const sessionsPerClass = new Map<string, Set<string>>();
    attendanceData.forEach(record => {
      const className = record.classes.name;
      if (!sessionsPerClass.has(className)) {
        sessionsPerClass.set(className, new Set());
      }
      sessionsPerClass.get(className)!.add(record.qr_session_id);
    });

    classMap.forEach((stats, className) => {
      const sessions = sessionsPerClass.get(className)?.size || 0;
      stats.total_sessions = sessions;
      stats.attendance_rate = sessions > 0 ? (stats.total_attendance / sessions) : 0;
    });

    setClassStats(Array.from(classMap.values()));

    // Calculate daily trends (last 7 days)
    const last7Days = new Map<string, number>();
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      last7Days.set(dateStr, 0);
    }

    filteredData.forEach(record => {
      const dateStr = record.marked_at.split('T')[0];
      if (last7Days.has(dateStr)) {
        last7Days.set(dateStr, (last7Days.get(dateStr) || 0) + 1);
      }
    });

    const trends = Array.from(last7Days.entries()).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count,
    }));

    setDailyTrends(trends);
  };

  const chartConfig = {
    count: {
      label: "Attendance",
      color: "hsl(var(--primary))",
    },
    attendance_rate: {
      label: "Rate",
      color: "hsl(var(--accent))",
    },
  };

  const pieColors = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--secondary))", "hsl(195 100% 60%)", "hsl(249 72% 75%)"];

  if (!session) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Analytics Dashboard</h1>
            <p className="text-muted-foreground">View attendance statistics and trends</p>
          </div>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallStats.totalStudents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallStats.totalSessions}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Attendance</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallStats.totalAttendance}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Attendance Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallStats.avgAttendanceRate.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Daily Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Attendance Trend</CardTitle>
              <CardDescription>Last 7 days attendance pattern</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Class-wise Attendance */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance by Class</CardTitle>
              <CardDescription>Total attendance per class</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="class_name" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar 
                      dataKey="total_attendance" 
                      fill="hsl(var(--accent))" 
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Class Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Class Attendance Distribution</CardTitle>
            <CardDescription>Proportion of attendance across classes</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={classStats}
                    dataKey="total_attendance"
                    nameKey="class_name"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    label={(entry) => `${entry.class_name}: ${entry.total_attendance}`}
                  >
                    {classStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
