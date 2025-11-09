import { useState, useEffect, useCallback } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, AlertCircle, Scan } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useFaceIO } from "@/hooks/useFaceIO";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Type definitions untuk mencegah undefined
interface FaceDescriptor {
  faceId?: string;
  [key: string]: any;
}

interface FaceData {
  face_descriptor: FaceDescriptor | null;
}

const Attendance = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    authenticateFace,
    isLoading: faceIOLoading,
    error: faceIOError,
  } = useFaceIO();
  const [isProcessing, setIsProcessing] = useState(false);
  const [faceRegistered, setFaceRegistered] = useState<boolean | null>(null);
  const [attendanceType, setAttendanceType] = useState<
    "check-in" | "check-out"
  >("check-in");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Gunakan useCallback untuk mencegah re-creation di setiap render
  const checkFaceRegistration = useCallback(async () => {
    if (!user?.id) return; // Safe check untuk user.id

    try {
      const { data, error } = await supabase
        .from("face_data")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error checking face registration:", error);
        setFaceRegistered(false);
        return;
      }

      setFaceRegistered(!!data);
    } catch (err) {
      console.error("Unexpected error:", err);
      setFaceRegistered(false);
    }
  }, [user?.id]); // Dependency yang aman

  useEffect(() => {
    if (user?.id) {
      checkFaceRegistration();
    }
  }, [user?.id, checkFaceRegistration]);

  const handleAttendance = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User tidak ditemukan. Silakan login kembali.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // FaceIO authentication dengan error handling
      const userData = await authenticateFace();

      // Safe check untuk userData
      if (!userData || !userData.facialId) {
        throw new Error("Data wajah tidak valid dari FaceIO");
      }

      // Verify the facialId matches our stored data
      const { data: faceData, error: fetchError } = await supabase
        .from("face_data")
        .select("face_descriptor")
        .eq("user_id", user.id)
        .single();

      // Safe check untuk fetchError
      if (fetchError) {
        throw new Error("Gagal mengambil data wajah dari database");
      }

      // Type-safe check dengan multiple validations
      const typedFaceData = faceData as FaceData | null;

      if (!typedFaceData) {
        throw new Error("Data wajah tidak ditemukan");
      }

      if (!typedFaceData.face_descriptor) {
        throw new Error("Descriptor wajah tidak valid");
      }

      const storedFaceId = typedFaceData.face_descriptor.faceId;

      if (!storedFaceId) {
        throw new Error("Face ID tidak ditemukan dalam database");
      }

      // Safe comparison
      if (storedFaceId !== userData.facialId) {
        toast({
          title: "Wajah tidak cocok",
          description:
            "Wajah yang terdeteksi tidak cocok dengan data yang terdaftar.",
          variant: "destructive",
        });
        return;
      }

      // Record attendance
      const { error: insertError } = await supabase.from("attendance").insert({
        user_id: user.id,
        status: attendanceType,
        timestamp: new Date().toISOString(),
      });

      if (insertError) throw insertError;

      toast({
        title: "Absensi berhasil!",
        description: `${
          attendanceType === "check-in" ? "Check-in" : "Check-out"
        } telah tercatat dengan FaceIO.`,
      });

      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (error: any) {
      console.error("Attendance error:", error);
      toast({
        title: "Error",
        description:
          error?.message || "Gagal mencatat absensi. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Loading state dengan safe checks
  if (loading || faceRegistered === null || faceIOLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Memuat FaceIO SDK...</p>
        </div>
      </div>
    );
  }

  if (!faceRegistered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background flex items-center justify-center p-4">
        <Card className="max-w-md shadow-strong">
          <CardHeader>
            <div className="rounded-full bg-destructive/10 w-12 h-12 flex items-center justify-center mb-2 mx-auto">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle className="text-center">Wajah Belum Terdaftar</CardTitle>
            <CardDescription className="text-center">
              Anda perlu mendaftarkan wajah terlebih dahulu sebelum melakukan
              absensi.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full"
              onClick={() => navigate("/register-face")}
            >
              Daftar Wajah Sekarang
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/dashboard")}
            >
              Kembali ke Dashboard
            </Button>
          </CardContent>
        </Card>
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

        <Card className="max-w-2xl mx-auto shadow-strong">
          <CardHeader>
            <CardTitle className="text-2xl">Absen Sekarang</CardTitle>
            <CardDescription>
              Scan wajah Anda untuk mencatat kehadiran
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {faceIOError && (
              <Alert variant="destructive">
                <AlertDescription>{faceIOError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <Label>Jenis Absensi</Label>
              <RadioGroup
                value={attendanceType}
                onValueChange={(value) =>
                  setAttendanceType(value as "check-in" | "check-out")
                }
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2 flex-1">
                  <RadioGroupItem value="check-in" id="check-in" />
                  <Label
                    htmlFor="check-in"
                    className="cursor-pointer flex-1 p-3 border rounded-lg"
                  >
                    Check-in (Masuk)
                  </Label>
                </div>
                <div className="flex items-center space-x-2 flex-1">
                  <RadioGroupItem value="check-out" id="check-out" />
                  <Label
                    htmlFor="check-out"
                    className="cursor-pointer flex-1 p-3 border rounded-lg"
                  >
                    Check-out (Keluar)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Scan className="w-4 h-4" />
                FaceIO Authentication
              </h3>
              <p className="text-sm text-muted-foreground">
                Klik tombol di bawah untuk memulai scan wajah dengan liveness
                detection
              </p>
            </div>

            <div className="flex justify-center">
              <Button
                onClick={handleAttendance}
                disabled={isProcessing || !!faceIOError}
                size="lg"
                className="w-full max-w-md"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                    Memproses FaceIO...
                  </>
                ) : (
                  <>
                    <Scan className="w-5 h-5 mr-2" />
                    Scan Wajah untuk Absensi
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Sistem menggunakan FaceIO dengan liveness detection untuk
              verifikasi keamanan
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Attendance;
