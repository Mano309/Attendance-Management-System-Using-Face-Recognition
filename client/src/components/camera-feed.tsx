import { useEffect, useState } from "react";
import { useCamera } from "@/hooks/use-camera";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, Users, Clock } from "lucide-react";

interface RecognitionResult {
  recognized: boolean;
  user?: {
    id: string;
    name: string;
    type: string;
    dept: string;
  };
  confidence?: number;
  status?: string;
  time?: string;
}

interface FaceDetection {
  id: number;
  userId: string;
  userName: string;
  userType: string;
  confidence: number;
  detectedAt: string;
}

export default function CameraFeed() {
  const { isActive, error, videoRef, startCamera, stopCamera } = useCamera();
  const [scanTimer, setScanTimer] = useState(3);
  const [isScanning, setIsScanning] = useState(false);
  const queryClient = useQueryClient();

  // Fetch recent detections
  const { data: detections = [] } = useQuery<FaceDetection[]>({
    queryKey: ["/api/face/detections"],
    refetchInterval: 5000,
  });

  // Face recognition mutation
  const recognizeMutation = useMutation({
    mutationFn: async () => {
      // Capture current frame from camera
      const canvas = document.createElement('canvas');
      const video = videoRef.current;
      
      if (!video) {
        throw new Error('Camera not available');
      }
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas context not available');
      }
      
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      
      const response = await apiRequest("POST", "/api/face/recognize", { image: imageData });
      return response.json() as Promise<RecognitionResult>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/face/detections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/overview"] });
    },
  });

  // Auto-start camera on mount
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  // Face detection timer
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setScanTimer((prev) => {
        if (prev <= 1) {
          setIsScanning(true);
          recognizeMutation.mutate();
          setTimeout(() => setIsScanning(false), 1000);
          return 3;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, recognizeMutation]);

  const toggleCamera = () => {
    if (isActive) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  return (
    <div className="space-y-6">
      {/* Camera Feed Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Camera className="text-primary mr-3" size={24} />
          Live Face Detection
        </h2>

        {/* Camera Feed Area */}
        <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-[4/3]">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            muted
            playsInline
          />
          
          {/* Face Detection Overlay */}
          {isScanning && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-4 border-green-400 rounded-lg animate-pulse"></div>
            </div>
          )}

          {/* Status Indicator */}
          <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
            <span className="flex items-center">
              <span className={`w-2 h-2 ${isActive ? 'bg-green-400' : 'bg-red-400'} rounded-full mr-2 animate-pulse`}></span>
              {isActive ? 'Scanning...' : 'Camera Off'}
            </span>
          </div>

          {/* Recognition Timer */}
          <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
            Next scan: <span className="font-mono">{scanTimer}</span>s
          </div>

          {/* Error State */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
              <div className="text-white text-center">
                <CameraOff size={48} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Camera Controls */}
        <div className="flex items-center justify-between mt-4">
          <Button
            variant="outline"
            onClick={toggleCamera}
            className="flex items-center space-x-2"
          >
            {isActive ? <CameraOff size={16} /> : <Camera size={16} />}
            <span>{isActive ? 'Stop Camera' : 'Start Camera'}</span>
          </Button>
          <div className="text-sm text-gray-500">
            Resolution: <span className="font-medium">640x480</span>
          </div>
        </div>
      </div>

      {/* Detection Log */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Detections</h3>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {detections.length === 0 ? (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <Users size={16} className="text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">No faces detected</p>
                  <p className="text-xs text-gray-500">Waiting for recognition...</p>
                </div>
              </div>
              <span className="text-xs text-gray-400">Now</span>
            </div>
          ) : (
            detections.map((detection) => (
              <div key={detection.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Users size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{detection.userName}</p>
                    <p className="text-xs text-gray-500">
                      {detection.userId} - {detection.userType} ({detection.confidence}% confidence)
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(detection.detectedAt).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
