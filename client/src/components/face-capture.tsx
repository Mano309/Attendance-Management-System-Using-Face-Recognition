import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useCamera } from "@/hooks/use-camera";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Camera, Search, Edit, Settings, CheckCircle } from "lucide-react";
import type { Student, Faculty } from "@shared/schema";

export default function FaceCapture() {
  const [userType, setUserType] = useState<"student" | "faculty">("student");
  const [userId, setUserId] = useState("");
  const [selectedUser, setSelectedUser] = useState<Student | Faculty | null>(null);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const { isActive, videoRef, startCamera, captureImage } = useCamera();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user by ID
  const fetchUserMutation = useMutation({
    mutationFn: async () => {
      const endpoint = userType === "student" ? `/api/students/${userId}` : `/api/faculty/${userId}`;
      const response = await apiRequest("GET", endpoint);
      return response.json();
    },
    onSuccess: (user) => {
      setSelectedUser(user);
      toast({
        title: "User Found",
        description: `${user.name} details loaded successfully.`,
      });
    },
    onError: () => {
      setSelectedUser(null);
      toast({
        title: "User Not Found",
        description: "Please check the ID and try again.",
        variant: "destructive",
      });
    },
  });

  // Train face mutation
  const trainFaceMutation = useMutation({
    mutationFn: async () => {
      // Send to Python OpenCV service for training
      const userInfo = selectedUser ? {
        name: selectedUser.name,
        type: userType,
        dept: selectedUser.dept,
      } : {};
      
      const response = await apiRequest("POST", "/api/face/train", {
        userId,
        userType,
        images: capturedImages,
        userInfo,
      });
      return response.json();
    },
    onSuccess: () => {
      setIsTraining(false);
      toast({
        title: "Training Complete",
        description: "Face recognition model updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/${userType === "student" ? "students" : "faculty"}`] });
      // Reset form
      setSelectedUser(null);
      setUserId("");
      setCapturedImages([]);
    },
    onError: () => {
      setIsTraining(false);
      toast({
        title: "Training Failed",
        description: "Failed to train face recognition model.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    startCamera();
  }, []);

  const handleFetchUser = () => {
    if (!userId.trim()) {
      toast({
        title: "Missing ID",
        description: "Please enter a Roll No or Staff ID.",
        variant: "destructive",
      });
      return;
    }
    fetchUserMutation.mutate();
  };

  const handleCaptureImage = () => {
    const imageData = captureImage();
    if (imageData && capturedImages.length < 3) {
      setCapturedImages(prev => [...prev, imageData]);
      toast({
        title: "Image Captured",
        description: `Image ${capturedImages.length + 1}/3 captured successfully.`,
      });
    }
  };

  const handleStartTraining = () => {
    if (capturedImages.length < 3) {
      toast({
        title: "Insufficient Images",
        description: "Please capture 3 images before starting training.",
        variant: "destructive",
      });
      return;
    }
    setIsTraining(true);
    trainFaceMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Face Capture & Training</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="mr-2" size={20} />
              Enter ID/Roll Number
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="userType">User Type</Label>
              <Select value={userType} onValueChange={(value: "student" | "faculty") => setUserType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="faculty">Faculty</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="userId">ID/Roll Number</Label>
              <Input
                id="userId"
                placeholder="Enter Roll No or Staff ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
            </div>

            <Button
              onClick={handleFetchUser}
              disabled={fetchUserMutation.isPending}
              className="w-full"
            >
              <Search className="mr-2" size={16} />
              {fetchUserMutation.isPending ? "Searching..." : "Fetch User Details"}
            </Button>

            {/* User Details Display */}
            {selectedUser && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">User Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{selectedUser.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ID:</span>
                    <span className="font-medium">
                      {"rollNo" in selectedUser ? selectedUser.rollNo : selectedUser.staffId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Department:</span>
                    <span className="font-medium">{selectedUser.dept}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{selectedUser.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Face Trained:</span>
                    <Badge variant={selectedUser.faceTrained ? "default" : "secondary"}>
                      {selectedUser.faceTrained ? "Yes" : "No"}
                    </Badge>
                  </div>
                </div>
                <div className="mt-4 flex space-x-2">
                  <Button variant="outline" className="flex-1">
                    <Edit className="mr-2" size={16} />
                    Edit Details
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Face Capture */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Camera className="mr-2" size={20} />
              Face Capture
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Camera Preview */}
            <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-[4/3]">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                muted
                playsInline
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-4 border-white border-dashed rounded-lg opacity-50"></div>
              </div>
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                Images captured: <span className="font-mono">{capturedImages.length}</span>/3
              </div>
            </div>

            {/* Capture Controls */}
            <Button
              onClick={handleCaptureImage}
              disabled={!selectedUser || !isActive || capturedImages.length >= 3}
              className="w-full"
            >
              <Camera className="mr-2" size={16} />
              Capture Image
            </Button>

            {capturedImages.length === 3 && (
              <Button
                onClick={handleStartTraining}
                disabled={isTraining}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isTraining ? (
                  <>
                    <Settings className="mr-2 animate-spin" size={16} />
                    Training in Progress...
                  </>
                ) : (
                  <>
                    <Settings className="mr-2" size={16} />
                    Start Training
                  </>
                )}
              </Button>
            )}

            {/* Captured Images Preview */}
            {capturedImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {capturedImages.map((image, index) => (
                  <div key={index} className="relative aspect-square bg-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={image}
                      alt={`Captured ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1 right-1 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      <CheckCircle size={12} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Training Status */}
            {isTraining && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <Settings className="animate-spin text-primary mr-3" size={20} />
                  <span className="text-primary font-medium">Training in progress...</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  This may take a few minutes. Please wait...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
