import { useEffect, useState } from "react";

const FACEIO_APP_ID = "fioa649e"; // Public ID kamu

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
        // Tunggu dokumen siap sepenuhnya
        if (document.readyState !== "complete") {
          await new Promise((resolve) =>
            window.addEventListener("load", resolve, { once: true })
          );
        }

        // Cegah duplikasi script
        if (!document.querySelector('script[src*="faceio.net"]')) {
          const script = document.createElement("script");
          script.src = "https://cdn.faceio.net/fio.js";
          script.async = true;
          document.body.appendChild(script);

          await new Promise<void>((resolve, reject) => {
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Gagal memuat FaceIO SDK"));
          });
        }

        // Tunggu SDK benar-benar tersedia
        let attempts = 0;
        while (typeof window.faceIO === "undefined" && attempts < 40) {
          await new Promise((r) => setTimeout(r, 500));
          attempts++;
        }
        if (typeof window.faceIO === "undefined") {
          throw new Error("FaceIO SDK tidak berhasil dimuat (timeout).");
        }

        // Pastikan container modal ada
        if (!document.getElementById("faceio-modal")) {
          const modalDiv = document.createElement("div");
          modalDiv.id = "faceio-modal";
          document.body.appendChild(modalDiv);
        }

        // Validasi App ID
        if (!/^fio(app_|a)/.test(FACEIO_APP_ID)) {
          throw new Error(
            "App ID tidak valid, gunakan ID dari dashboard FaceIO."
          );
        }

        // Inisialisasi
        const fioInstance = new window.faceIO(FACEIO_APP_ID);
        setFaceio(fioInstance);
        setIsLoading(false);
        console.log("✅ FaceIO siap:", FACEIO_APP_ID);
      } catch (err: any) {
        console.error("❌ FaceIO error:", err);
        setError(err.message || "Gagal inisialisasi FaceIO.");
        setIsLoading(false);
      }
    };

    initializeFaceIO();
  }, []);

  const enrollFace = async (payload?: any) => {
    if (!faceio) throw new Error("FaceIO belum siap. Tunggu sebentar...");
    try {
      const userInfo = await faceio.enroll({ locale: "id", payload });
      return userInfo;
    } catch (err: any) {
      throw new Error(handleFaceIOError(err.code || err.errCode));
    }
  };

  const authenticateFace = async () => {
    if (!faceio) throw new Error("FaceIO belum siap. Tunggu sebentar...");
    try {
      const userData = await faceio.authenticate({ locale: "id" });
      return userData;
    } catch (err: any) {
      throw new Error(handleFaceIOError(err.code || err.errCode));
    }
  };

  const handleFaceIOError = (code: number): string => {
    const errors: Record<number, string> = {
      1: "Akses kamera ditolak.",
      2: "Kamera tidak ditemukan.",
      3: "Timeout. Coba lagi.",
      4: "Wajah tidak terdeteksi.",
      5: "Terlalu banyak wajah di frame.",
      6: "Liveness detection gagal.",
      7: "Wajah tidak terdaftar.",
      8: "Sesi timeout.",
      9: "Wajah sudah terdaftar di akun lain.",
      10: "Operasi dibatalkan.",
      11: "PIN Code salah.",
    };
    return errors[code] || `Kesalahan tidak dikenal (kode: ${code}).`;
  };

  return { faceio, isLoading, error, enrollFace, authenticateFace };
};
