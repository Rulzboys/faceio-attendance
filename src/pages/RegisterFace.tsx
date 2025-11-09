import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Scan } from 'lucide-react';
import { useFaceIO } from '@/hooks/useFaceIO';
import { Alert, AlertDescription } from '@/components/ui/alert';

const RegisterFace = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { enrollFace, isLoading: faceIOLoading, error: faceIOError } = useFaceIO();
  const [isRegistering, setIsRegistering] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      checkExistingRegistration();
    }
  }, [user]);

  const checkExistingRegistration = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('face_data')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    setAlreadyRegistered(!!data);
  };

  const handleRegister = async () => {
    if (!user) return;

    setIsRegistering(true);

    try {
      // FaceIO enrollment with liveness detection
      const userInfo = await enrollFace({
        userId: user.id,
        email: user.email,
      });

      // Store FaceIO data in database
      const faceDescriptor = {
        faceId: userInfo.facialId,
        timestamp: Date.now(),
      };

      if (alreadyRegistered) {
        // Update existing face data
        const { error } = await supabase
          .from('face_data')
          .update({
            face_descriptor: faceDescriptor,
            registered_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (error) throw error;

        toast({
          title: 'Berhasil memperbarui!',
          description: 'Data wajah Anda telah diperbarui dengan FaceIO.',
        });
      } else {
        // Insert new face data
        const { error } = await supabase
          .from('face_data')
          .insert({
            user_id: user.id,
            face_descriptor: faceDescriptor,
          });

        if (error) throw error;

        toast({
          title: 'Pendaftaran berhasil!',
          description: 'Wajah Anda telah terdaftar dengan liveness detection.',
        });
      }

      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal mendaftarkan wajah. Silakan coba lagi.',
        variant: 'destructive',
      });
    } finally {
      setIsRegistering(false);
    }
  };

  if (loading || faceIOLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Memuat FaceIO SDK...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>

        <Card className="max-w-2xl mx-auto shadow-strong">
          <CardHeader>
            <CardTitle className="text-2xl">
              {alreadyRegistered ? 'Perbarui Data Wajah' : 'Daftarkan Wajah'}
            </CardTitle>
            <CardDescription>
              {alreadyRegistered
                ? 'Ambil foto baru untuk memperbarui data wajah Anda'
                : 'Ambil foto wajah Anda untuk sistem absensi'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {faceIOError && (
              <Alert variant="destructive">
                <AlertDescription>{faceIOError}</AlertDescription>
              </Alert>
            )}

            <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Scan className="w-4 h-4" />
                FaceIO Liveness Detection
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Pastikan wajah Anda terlihat jelas</li>
                <li>• Gunakan pencahayaan yang cukup</li>
                <li>• Ikuti instruksi gerakan untuk liveness detection</li>
                <li>• Lepas kacamata atau topi jika diminta</li>
                <li>• Pastikan hanya satu wajah dalam frame</li>
              </ul>
            </div>

            <div className="flex justify-center">
              <Button
                onClick={handleRegister}
                disabled={isRegistering || !!faceIOError}
                size="lg"
                className="w-full max-w-md"
              >
                {isRegistering ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                    Memproses FaceIO...
                  </>
                ) : (
                  <>
                    <Scan className="w-5 h-5 mr-2" />
                    {alreadyRegistered ? 'Update Wajah dengan FaceIO' : 'Daftar dengan FaceIO'}
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Sistem menggunakan FaceIO dengan liveness detection untuk keamanan maksimal
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterFace;
