import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import FaceCapture from "@/components/face-capture";
import DataImport from "@/components/data-import";
import Reports from "@/components/reports";
import {
  BarChart3,
  Calendar,
  Camera,
  Presentation,
  FileDown,
  FileUp,
  GraduationCap,
  LogOut,
  Plus,
  Search,
  Settings,
  Users,
  UserCheck,
  UserX,
  Edit,
  Trash2,
} from "lucide-react";
import type { Student, Faculty, StudentAttendanceLog, FacultyAttendanceLog } from "@shared/schema";

interface OverviewStats {
  totalStudents: number;
  totalFaculty: number;
  studentsPresent: number;
  facultyPresent: number;
  studentsAbsent: number;
  facultyAbsent: number;
}

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState("overview");
  const [studentSearch, setStudentSearch] = useState("");
  const [facultySearch, setFacultySearch] = useState("");
  const [studentDeptFilter, setStudentDeptFilter] = useState("all");
  const [facultyDeptFilter, setFacultyDeptFilter] = useState("all");
  const [, setLocation] = useLocation();

  // Fetch data
  const { data: stats } = useQuery<OverviewStats>({
    queryKey: ["/api/stats/overview"],
    refetchInterval: 30000,
  });

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const { data: faculty = [] } = useQuery<Faculty[]>({
    queryKey: ["/api/faculty"],
  });

  const today = new Date().toISOString().split('T')[0];
  const { data: studentAttendance = [] } = useQuery<StudentAttendanceLog[]>({
    queryKey: ["/api/attendance/students", { date: today }],
  });

  const { data: facultyAttendance = [] } = useQuery<FacultyAttendanceLog[]>({
    queryKey: ["/api/attendance/faculty", { date: today }],
  });

  // Filter functions
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                         student.rollNo.toLowerCase().includes(studentSearch.toLowerCase());
    const matchesDept = studentDeptFilter === "all" || student.dept === studentDeptFilter;
    return matchesSearch && matchesDept;
  });

  const filteredFaculty = faculty.filter(fac => {
    const matchesSearch = fac.name.toLowerCase().includes(facultySearch.toLowerCase()) ||
                         fac.staffId.toLowerCase().includes(facultySearch.toLowerCase());
    const matchesDept = facultyDeptFilter === "all" || fac.dept === facultyDeptFilter;
    return matchesSearch && matchesDept;
  });

  // Combined attendance for logs
  const combinedAttendance = [
    ...studentAttendance.map(log => ({
      ...log,
      type: 'Student' as const,
      userId: log.rollNo,
      name: students.find(s => s.rollNo === log.rollNo)?.name || 'Unknown',
      dept: students.find(s => s.rollNo === log.rollNo)?.dept || 'Unknown',
    })),
    ...facultyAttendance.map(log => ({
      ...log,
      type: 'Faculty' as const,
      userId: log.staffId,
      name: faculty.find(f => f.staffId === log.staffId)?.name || 'Unknown',
      dept: faculty.find(f => f.staffId === log.staffId)?.dept || 'Unknown',
    })),
  ].sort((a, b) => new Date(`${b.date} ${b.loginTime}`).getTime() - new Date(`${a.date} ${a.loginTime}`).getTime());

  const handleLogout = () => {
    setLocation("/");
  };

  const navigationItems = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "students", label: "Students", icon: GraduationCap },
    { id: "faculty", label: "Faculty", icon: Users },
    { id: "attendance", label: "Attendance Logs", icon: Calendar },
    { id: "faceCapture", label: "Face Capture", icon: Camera },
    { id: "reports", label: "Reports", icon: FileDown },
    { id: "import", label: "Import Data", icon: FileUp },
  ];

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-3xl font-bold text-primary">{stats?.totalStudents || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="text-primary" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Faculty</p>
                <p className="text-3xl font-bold text-green-600">{stats?.totalFaculty || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="text-green-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
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

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {combinedAttendance.slice(0, 5).length === 0 ? (
              <p className="text-center text-gray-500 py-8">No recent activity</p>
            ) : (
              combinedAttendance.slice(0, 5).map((record, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <UserCheck className="text-white" size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Attendance recorded</p>
                    <p className="text-sm text-gray-500">
                      {record.name} ({record.userId}) - {record.type}
                    </p>
                  </div>
                  <span className="text-sm text-gray-400">{record.loginTime}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStudents = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Student Management</h2>
        <Button className="bg-primary hover:bg-blue-700">
          <Plus className="mr-2" size={16} />
          Add Student
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  placeholder="Search students..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={studentDeptFilter} onValueChange={setStudentDeptFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="Computer Science">Computer Science</SelectItem>
                  <SelectItem value="Electronics">Electronics</SelectItem>
                  <SelectItem value="Mechanical">Mechanical</SelectItem>
                  <SelectItem value="Civil">Civil</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Roll No</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Face Trained</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No students found
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <GraduationCap className="text-gray-600" size={16} />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-500">{student.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{student.rollNo}</TableCell>
                    <TableCell>{student.dept}</TableCell>
                    <TableCell>{student.phone}</TableCell>
                    <TableCell>
                      <Badge variant={student.faceTrained ? "default" : "secondary"}>
                        {student.faceTrained ? "Trained" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          <Edit size={16} />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderFaculty = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Faculty Management</h2>
        <Button className="bg-primary hover:bg-blue-700">
          <Plus className="mr-2" size={16} />
          Add Faculty
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                placeholder="Search faculty..."
                value={facultySearch}
                onChange={(e) => setFacultySearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={facultyDeptFilter} onValueChange={setFacultyDeptFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="Computer Science">Computer Science</SelectItem>
                <SelectItem value="Electronics">Electronics</SelectItem>
                <SelectItem value="Mechanical">Mechanical</SelectItem>
                <SelectItem value="Civil">Civil</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Faculty</TableHead>
                <TableHead>Staff ID</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Face Trained</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFaculty.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No faculty found
                  </TableCell>
                </TableRow>
              ) : (
                filteredFaculty.map((fac) => (
                  <TableRow key={fac.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <Users className="text-gray-600" size={16} />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{fac.name}</div>
                          <div className="text-sm text-gray-500">{fac.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{fac.staffId}</TableCell>
                    <TableCell>{fac.dept}</TableCell>
                    <TableCell>{fac.phone}</TableCell>
                    <TableCell>
                      <Badge variant={fac.faceTrained ? "default" : "secondary"}>
                        {fac.faceTrained ? "Trained" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          <Edit size={16} />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderAttendanceLogs = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Attendance Logs</h2>

      <Card>
        <CardHeader>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select defaultValue="all">
              <SelectTrigger>
                <SelectValue placeholder="User Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="student">Students</SelectItem>
                <SelectItem value="faculty">Faculty</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger>
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="Computer Science">Computer Science</SelectItem>
                <SelectItem value="Electronics">Electronics</SelectItem>
                <SelectItem value="Mechanical">Mechanical</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" defaultValue={today} />
            <Select defaultValue="all">
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="on-time">On Time</SelectItem>
                <SelectItem value="delay">Delay</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Login Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {combinedAttendance.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No attendance records found for today
                  </TableCell>
                </TableRow>
              ) : (
                combinedAttendance.map((record, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          {record.type === 'Student' ? (
                            <GraduationCap className="text-gray-600" size={16} />
                          ) : (
                            <Users className="text-gray-600" size={16} />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{record.name}</div>
                          <div className="text-sm text-gray-500">{record.dept}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{record.userId}</TableCell>
                    <TableCell>
                      <Badge variant={record.type === 'Student' ? 'default' : 'secondary'}>
                        {record.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{record.date}</TableCell>
                    <TableCell>{record.loginTime}</TableCell>
                    <TableCell>
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
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return renderOverview();
      case "students":
        return renderStudents();
      case "faculty":
        return renderFaculty();
      case "attendance":
        return renderAttendanceLogs();
      case "faceCapture":
        return <FaceCapture />;
      case "reports":
        return <Reports />;
      case "import":
        return <DataImport />;
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Settings className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">Attendance Management System</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, <span className="font-medium">Admin</span>
              </span>
              <Button variant="ghost" onClick={handleLogout}>
                <LogOut size={16} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <div className="w-64 bg-white rounded-xl shadow-lg p-6 h-fit">
            <nav className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    className={`w-full justify-start px-4 py-3 ${
                      activeSection === item.id
                        ? "bg-blue-50 text-primary"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                    onClick={() => setActiveSection(item.id)}
                  >
                    <Icon className="mr-3" size={16} />
                    {item.label}
                  </Button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
}
