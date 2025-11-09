import { useRef, useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Camera, Check } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  isCapturing: boolean;
}

const CameraCapture = ({ onCapture, isCapturing }: CameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
      setError('');
    } catch (err: any) {
      setError('Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan.');
      console.error('Camera error:', err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      onCapture(imageData);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative bg-card rounded-lg overflow-hidden shadow-medium">
        {error ? (
          <div className="aspect-video flex items-center justify-center bg-destructive/10 text-destructive p-8 text-center">
            <p>{error}</p>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full aspect-video object-cover"
          />
        )}
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Face detection overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="border-4 border-accent rounded-full w-64 h-64 opacity-50"></div>
        </div>
      </div>

      <Button
        onClick={captureImage}
        disabled={isCapturing || !!error}
        className="w-full"
        size="lg"
      >
        {isCapturing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
            Memproses...
          </>
        ) : (
          <>
            <Camera className="w-5 h-5 mr-2" />
            Ambil Foto
          </>
        )}
      </Button>
    </div>
  );
};

export default CameraCapture;
