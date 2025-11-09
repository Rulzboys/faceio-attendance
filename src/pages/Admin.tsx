import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Download, Users, Clock, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Admin = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [stats, setStats] = useState({
    totalCheckIns: 0,
    totalCheckOuts: 0,
    totalUsers: 0,
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  useEffect(() => {
    filterRecords();
  }, [searchTerm, filterDate, attendanceRecords]);

  const checkAdminStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (error) {
        console.error("Error checking admin status:", error);
        toast({
          title: "Error",
          description: `Gagal memeriksa status admin: ${error.message}`,
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      if (!data) {
        toast({
          title: "Akses ditolak",
          description: "Anda tidak memiliki akses ke halaman admin.",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      setIsAdmin(true);
      // Load data setelah konfirmasi admin
      await loadAttendanceData();
    } catch (error: any) {
      console.error("Unexpected error:", error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan yang tidak terduga.",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  };

  const loadAttendanceData = async () => {
    setIsLoadingData(true);
    try {
      console.log("Loading attendance data...");

      // Coba query pertama dengan join
      const { data: attendanceData, error } = await supabase
        .from("attendance")
        .select(
          `
          *,
          profiles (
            full_name,
            email
          )
        `
        )
        .order("timestamp", { ascending: false });

      if (error) {
        console.error("Error loading attendance:", error);

        // Jika error, coba query alternatif tanpa join
        const { data: altData, error: altError } = await supabase
          .from("attendance")
          .select("*")
          .order("timestamp", { ascending: false });

        if (altError) {
          throw altError;
        }

        // Fetch profiles secara terpisah
        const userIds = [...new Set(altData?.map((r) => r.user_id) || [])];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds);

        // Gabungkan data manual
        const profileMap = new Map(profilesData?.map((p) => [p.id, p]) || []);
        const combinedData = altData?.map((record) => ({
          ...record,
          profiles: profileMap.get(record.user_id) || null,
        }));

        setAttendanceRecords(combinedData || []);
        calculateStats(combinedData || []);

        toast({
          title: "Peringatan",
          description:
            "Data dimuat dengan metode alternatif. Periksa konfigurasi RLS Supabase.",
          variant: "default",
        });

        return;
      }

      console.log("Loaded records:", attendanceData?.length || 0);
      setAttendanceRecords(attendanceData || []);
      calculateStats(attendanceData || []);
    } catch (error: any) {
      console.error("Error in loadAttendanceData:", error);
      toast({
        title: "Error",
        description: `Gagal memuat data absensi: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  const calculateStats = (data: any[]) => {
    const checkIns = data.filter((r) => r.status === "check-in").length;
    const checkOuts = data.filter((r) => r.status === "check-out").length;
    const uniqueUsers = new Set(data.map((r) => r.user_id)).size;

    setStats({
      totalCheckIns: checkIns,
      totalCheckOuts: checkOuts,
      totalUsers: uniqueUsers,
    });
  };

  const filterRecords = () => {
    let filtered = [...attendanceRecords];

    if (searchTerm) {
      filtered = filtered.filter(
        (record) =>
          record.profiles?.full_name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          record.profiles?.email
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    if (filterDate) {
      filtered = filtered.filter((record) => {
        const recordDate = new Date(record.timestamp)
          .toISOString()
          .split("T")[0];
        return recordDate === filterDate;
      });
    }

    setFilteredRecords(filtered);
  };

  const exportToCSV = () => {
    if (filteredRecords.length === 0) {
      toast({
        title: "Peringatan",
        description: "Tidak ada data untuk diekspor.",
        variant: "default",
      });
      return;
    }

    const csvData = filteredRecords.map((record) => ({
      Nama: record.profiles?.full_name || "N/A",
      Email: record.profiles?.email || "N/A",
      Status: record.status,
      Waktu: new Date(record.timestamp).toLocaleString("id-ID"),
    }));

    const csv = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map((row) =>
        Object.values(row)
          .map((val) => `"${val}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Berhasil",
      description: "Data berhasil diekspor ke CSV.",
    });
  };

  if (loading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-2">
            Dashboard Admin
          </h1>
          <p className="text-muted-foreground">
            Kelola dan pantau data absensi karyawan
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-medium">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Check-in
              </CardTitle>
              <Clock className="w-4 h-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCheckIns}</div>
            </CardContent>
          </Card>

          <Card className="shadow-medium">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Check-out
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCheckOuts}</div>
            </CardContent>
          </Card>

          <Card className="shadow-medium">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Pengguna
              </CardTitle>
              <Users className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Export */}
        <Card className="shadow-medium mb-6">
          <CardHeader>
            <CardTitle>Data Absensi</CardTitle>
            <CardDescription>
              Lihat dan filter data kehadiran karyawan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <Input
                placeholder="Cari nama atau email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="md:w-48"
              />
              <Button
                onClick={exportToCSV}
                variant="outline"
                disabled={isLoadingData}
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>

            {isLoadingData ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Memuat data...</p>
              </div>
            ) : (
              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Waktu</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.length > 0 ? (
                      filteredRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">
                            {record.profiles?.full_name || "N/A"}
                          </TableCell>
                          <TableCell>
                            {record.profiles?.email || "N/A"}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                record.status === "check-in"
                                  ? "bg-success/10 text-success"
                                  : "bg-destructive/10 text-destructive"
                              }`}
                            >
                              {record.status === "check-in"
                                ? "Check-in"
                                : "Check-out"}
                            </span>
                          </TableCell>
                          <TableCell>
                            {new Date(record.timestamp).toLocaleString("id-ID")}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center text-muted-foreground py-8"
                        >
                          Tidak ada data yang ditemukan
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
