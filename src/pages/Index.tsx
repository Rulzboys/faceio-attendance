import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Scan, Shield, Clock, TrendingUp, CheckCircle } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-hero text-primary-foreground py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-primary-foreground/10 backdrop-blur-sm p-4">
              <Scan className="w-16 h-16" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Sistem Absensi Face Recognition
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-primary-foreground/90 max-w-2xl mx-auto">
            Absensi modern dengan teknologi pengenalan wajah dan liveness detection untuk keamanan maksimal
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/auth">
              <Button size="lg" variant="secondary" className="shadow-medium">
                Mulai Sekarang
              </Button>
            </Link>
            <a href="https://wa.me/6283102655384" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20">
                Pelajari Lebih Lanjut
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Fitur Unggulan
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Sistem absensi yang aman, cepat, dan mudah digunakan dengan teknologi terkini
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="shadow-medium hover:shadow-strong transition-shadow">
              <CardHeader>
                <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                  <Scan className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Face Recognition</CardTitle>
                <CardDescription>
                  Teknologi pengenalan wajah yang akurat untuk identifikasi cepat dan aman
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-medium hover:shadow-strong transition-shadow">
              <CardHeader>
                <div className="rounded-full bg-success/10 w-12 h-12 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-success" />
                </div>
                <CardTitle>Liveness Detection</CardTitle>
                <CardDescription>
                  Deteksi keaslian wajah untuk mencegah pemalsuan menggunakan foto atau video
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-medium hover:shadow-strong transition-shadow">
              <CardHeader>
                <div className="rounded-full bg-accent/10 w-12 h-12 flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-accent" />
                </div>
                <CardTitle>Real-time Tracking</CardTitle>
                <CardDescription>
                  Pantau kehadiran secara real-time dengan dashboard yang interaktif
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-medium hover:shadow-strong transition-shadow">
              <CardHeader>
                <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Laporan & Analitik</CardTitle>
                <CardDescription>
                  Dashboard admin dengan statistik lengkap dan export data ke CSV
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-medium hover:shadow-strong transition-shadow">
              <CardHeader>
                <div className="rounded-full bg-success/10 w-12 h-12 flex items-center justify-center mb-4">
                  <CheckCircle className="w-6 h-6 text-success" />
                </div>
                <CardTitle>Mudah Digunakan</CardTitle>
                <CardDescription>
                  Interface yang intuitif dan mudah dipahami untuk semua pengguna
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-medium hover:shadow-strong transition-shadow">
              <CardHeader>
                <div className="rounded-full bg-accent/10 w-12 h-12 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-accent" />
                </div>
                <CardTitle>Aman & Terpercaya</CardTitle>
                <CardDescription>
                  Data tersimpan dengan enkripsi dan keamanan tingkat tinggi
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-secondary/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Cara Kerja
            </h2>
            <p className="text-muted-foreground text-lg">
              Tiga langkah mudah untuk mulai menggunakan sistem absensi
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="rounded-full bg-primary w-16 h-16 flex items-center justify-center text-2xl font-bold text-primary-foreground mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Daftar Akun</h3>
              <p className="text-muted-foreground">
                Buat akun dengan email dan password Anda
              </p>
            </div>

            <div className="text-center">
              <div className="rounded-full bg-primary w-16 h-16 flex items-center justify-center text-2xl font-bold text-primary-foreground mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Daftarkan Wajah</h3>
              <p className="text-muted-foreground">
                Ambil foto wajah Anda untuk sistem absensi
              </p>
            </div>

            <div className="text-center">
              <div className="rounded-full bg-primary w-16 h-16 flex items-center justify-center text-2xl font-bold text-primary-foreground mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Mulai Absen</h3>
              <p className="text-muted-foreground">
                Scan wajah untuk check-in dan check-out
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-hero text-primary-foreground">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Siap Memulai?
          </h2>
          <p className="text-xl mb-8 text-primary-foreground/90 max-w-2xl mx-auto">
            Bergabunglah dengan sistem absensi modern dan tingkatkan efisiensi pencatatan kehadiran
          </p>
          <Link to="/auth">
            <Button size="lg" variant="secondary" className="shadow-medium">
              Daftar Gratis Sekarang
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-background border-t">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>&copy; 2025 Face Recognition Attendance System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
