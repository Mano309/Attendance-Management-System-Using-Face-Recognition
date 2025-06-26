import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CameraFeed from "@/components/camera-feed";
import AdminLoginModal from "@/components/admin-login-modal";
import { GraduationCap, Shield, Users, UserCheck, UserX, Clock } from "lucide-react";

interface OverviewStats {
  totalStudents: number;
  totalFaculty: number;
  studentsPresent: number;
  facultyPresent: number;
  studentsAbsent: number;
  facultyAbsent: number;
}

interface AttendanceRecord {
  id: number;
  rollNo?: string;
  staffId?: string;
  date: string;
  loginTime: string;
  status: string;
}

export default function HomePage() {
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Fetch overview statistics
  const { data: stats } = useQuery<OverviewStats>({
    queryKey: ["/api/stats/overview"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch recent attendance
  const today = new Date().toISOString().split('T')[0];
  const { data: studentAttendance = [] } = useQuery<AttendanceRecord[]>({
    queryKey: ["/api/attendance/students", { date: today }],
    refetchInterval: 30000,
  });

  const { data: facultyAttendance = [] } = useQuery<AttendanceRecord[]>({
    queryKey: ["/api/attendance/faculty", { date: today }],
    refetchInterval: 30000,
  });

  // Combine and sort recent attendance
  const recentAttendance = [
    ...studentAttendance.map(record => ({ ...record, type: 'student' })),
    ...facultyAttendance.map(record => ({ ...record, type: 'faculty' }))
  ]
    .sort((a, b) => new Date(`${a.date} ${a.loginTime}`).getTime() - new Date(`${b.date} ${b.loginTime}`).getTime())
    .reverse()
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">MEC Attendance System</h1>
                <p className="text-sm text-gray-500">Face Recognition Based Attendance</p>
              </div>
            </div>
            <Button
              onClick={() => setShowLoginModal(true)}
              className="bg-primary hover:bg-blue-700"
            >
              <Shield className="mr-2" size={16} />
              Admin Login
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Live Camera Feed */}
          <CameraFeed />

          {/* Right Side - Attendance Status */}
          <div className="space-y-6">
            {/* Today's Statistics */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Present Today</p>
                      <p className="text-3xl font-bold text-green-600">
                        {(stats?.studentsPresent || 0) + (stats?.facultyPresent || 0)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <UserCheck className="text-green-600" size={24} />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Absent Today</p>
                      <p className="text-3xl font-bold text-red-600">
                        {(stats?.studentsAbsent || 0) + (stats?.facultyAbsent || 0)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <UserX className="text-red-600" size={24} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Attendance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Today's Attendance Log</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentAttendance.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      No attendance records for today yet.
                    </p>
                  ) : (
                    recentAttendance.map((record, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            {record.type === 'student' ? (
                              <GraduationCap className="text-gray-600" size={20} />
                            ) : (
                              <Users className="text-gray-600" size={20} />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {record.type === 'student' ? `Student ${record.rollNo}` : `Faculty ${record.staffId}`}
                            </p>
                            <p className="text-sm text-gray-500">
                              {record.type === 'student' ? `Roll No: ${record.rollNo}` : `Staff ID: ${record.staffId}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={record.status === 'on-time' ? 'default' : 'secondary'}
                            className={
                              record.status === 'on-time'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }
                          >
                            {record.status === 'on-time' ? 'On Time' : 'Delay'}
                          </Badge>
                          <p className="text-sm text-gray-500 mt-1">{record.loginTime}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-primary">{stats?.totalStudents || 0}</p>
                    <p className="text-sm text-gray-600">Total Students</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{stats?.totalFaculty || 0}</p>
                    <p className="text-sm text-gray-600">Total Faculty</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Admin Login Modal */}
      <AdminLoginModal 
        open={showLoginModal} 
        onOpenChange={setShowLoginModal} 
      />
    </div>
  );
}
