import { useEffect, useState } from "react";

const FACEIO_APP_ID = "fioa649e";

interface FaceIOInstance {
  enroll: (options?: any) => Promise<any>;
  authenticate: (options?: any) => Promise<any>;
  restartSession: () => void;
}

declare global {
  interface Window {
    faceIO: any;
  }
}

export const useFaceIO = () => {
  const [faceio, setFaceio] = useState<FaceIOInstance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeFaceIO = async () => {
      try {
        // Tunggu hingga fio.js tersedia (sudah di-load via HTML)
        let attempts = 0;
        const maxAttempts = 20; // 10 detik maksimal

        while (typeof window.faceIO === "undefined" && attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          attempts++;
        }

        if (typeof window.faceIO === "undefined") {
          throw new Error(
            "FaceIO SDK tidak tersedia. Pastikan fio.js sudah di-load di HTML."
          );
        }

        // Validasi modal container
        const modalContainer = document.getElementById("faceio-modal");
        if (!modalContainer) {
          console.warn(
            "Element #faceio-modal tidak ditemukan. FaceIO mungkin tidak berfungsi optimal."
          );
        }

        // Validasi format App ID (sesuai dokumentasi)
        if (
          !FACEIO_APP_ID.startsWith("fioapp_") &&
          !FACEIO_APP_ID.startsWith("fioa")
        ) {
          throw new Error(
            "App ID tidak valid! Pastikan menggunakan format: fioapp_xxx atau fioaxxx"
          );
        }

        // Instantiate FaceIO dengan App ID
        const fioInstance = new window.faceIO(FACEIO_APP_ID);
        setFaceio(fioInstance);
        setIsLoading(false);

        console.log(
          "✅ FaceIO berhasil diinisialisasi dengan ID:",
          FACEIO_APP_ID
        );
      } catch (err: any) {
        console.error("❌ FaceIO initialization error:", err);
        setError(
          err.message || "Gagal initialize FaceIO. Cek koneksi internet Anda."
        );
        setIsLoading(false);
      }
    };

    initializeFaceIO();
  }, []);

  const enrollFace = async (payload?: any) => {
    if (!faceio) {
      throw new Error("FaceIO belum diinisialisasi. Tunggu beberapa saat.");
    }

    try {
      const userInfo = await faceio.enroll({
        locale: "id", // Bahasa Indonesia
        payload: payload || {}, // Data tambahan pengguna
      });
      return userInfo;
    } catch (err: any) {
      const errorMessage = handleFaceIOError(err.code || err.errCode);
      console.error("Enroll error:", errorMessage, err);
      throw new Error(errorMessage);
    }
  };

  const authenticateFace = async () => {
    if (!faceio) {
      throw new Error("FaceIO belum diinisialisasi. Tunggu beberapa saat.");
    }

    try {
      const userData = await faceio.authenticate({
        locale: "id", // Bahasa Indonesia
      });
      return userData;
    } catch (err: any) {
      const errorMessage = handleFaceIOError(err.code || err.errCode);
      console.error("Authenticate error:", errorMessage, err);
      throw new Error(errorMessage);
    }
  };

  const handleFaceIOError = (code: number): string => {
    switch (code) {
      case 1:
        return "Akses kamera ditolak. Mohon izinkan akses kamera.";
      case 2:
        return "Kamera tidak tersedia atau tidak terdeteksi.";
      case 3:
        return "Timeout. Mohon coba lagi.";
      case 4:
        return "Wajah tidak terdeteksi. Pastikan wajah Anda terlihat jelas.";
      case 5:
        return "Terlalu banyak wajah terdeteksi. Pastikan hanya satu orang di frame.";
      case 6:
        return "Liveness detection gagal. Pastikan Anda melakukan gerakan sesuai instruksi.";
      case 7:
        return "Wajah tidak terdaftar. Silakan lakukan registrasi terlebih dahulu.";
      case 8:
        return "Sesi timeout. Mohon coba lagi.";
      case 9:
        return "Wajah sudah terdaftar dengan pengguna lain.";
      case 10:
        return "Operasi dibatalkan oleh pengguna.";
      case 11:
        return "PIN Code tidak valid atau tidak sesuai.";
      default:
        return `Terjadi kesalahan (kode: ${code}). Silakan coba lagi.`;
    }
  };

  return {
    faceio,
    isLoading,
    error,
    enrollFace,
    authenticateFace,
  };
};
