import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Scan, User, LogOut, Camera, Clock, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [faceRegistered, setFaceRegistered] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Check face registration
      const { data: faceData } = await supabase
        .from('face_data')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      setFaceRegistered(!!faceData);

      // Check if user is admin
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      setIsAdmin(!!roleData);

      // Load recent attendance
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(5);

      setRecentAttendance(attendanceData || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Gagal memuat data. Silakan refresh halaman.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
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
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Selamat datang, {profile?.full_name || 'User'}
            </p>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-medium hover:shadow-strong transition-shadow cursor-pointer" onClick={() => navigate('/register-face')}>
            <CardHeader>
              <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-2">
                <Camera className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Daftarkan Wajah</CardTitle>
              <CardDescription>
                {faceRegistered
                  ? 'Update data wajah Anda'
                  : 'Daftarkan wajah untuk absensi'}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-medium hover:shadow-strong transition-shadow cursor-pointer" onClick={() => navigate('/attendance')}>
            <CardHeader>
              <div className="rounded-full bg-accent/10 w-12 h-12 flex items-center justify-center mb-2">
                <Scan className="w-6 h-6 text-accent" />
              </div>
              <CardTitle>Absen Sekarang</CardTitle>
              <CardDescription>
                Scan wajah untuk absensi
              </CardDescription>
            </CardHeader>
          </Card>

          {isAdmin && (
            <Card className="shadow-medium hover:shadow-strong transition-shadow cursor-pointer" onClick={() => navigate('/admin')}>
              <CardHeader>
                <div className="rounded-full bg-success/10 w-12 h-12 flex items-center justify-center mb-2">
                  <Shield className="w-6 h-6 text-success" />
                </div>
                <CardTitle>Dashboard Admin</CardTitle>
                <CardDescription>
                  Kelola data absensi
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>

        {/* Recent Attendance */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Riwayat Absensi Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentAttendance.length > 0 ? (
              <div className="space-y-3">
                {recentAttendance.map((record) => (
                  <div
                    key={record.id}
                    className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium capitalize">{record.status}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(record.timestamp).toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      record.status === 'check-in' 
                        ? 'bg-success/10 text-success' 
                        : 'bg-destructive/10 text-destructive'
                    }`}>
                      {record.status === 'check-in' ? 'Masuk' : 'Keluar'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Belum ada riwayat absensi
              </p>
            )}
          </CardContent>
        </Card>

        {!faceRegistered && (
          <Card className="mt-6 bg-accent/5 border-accent">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-accent/10 p-2 mt-1">
                  <Camera className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Daftarkan Wajah Anda</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Untuk menggunakan fitur absensi, Anda perlu mendaftarkan wajah terlebih dahulu.
                  </p>
                  <Button size="sm" onClick={() => navigate('/register-face')}>
                    Daftar Sekarang
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
