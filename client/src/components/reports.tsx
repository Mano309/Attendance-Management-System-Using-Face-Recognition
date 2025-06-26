import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { exportToExcel } from "@/lib/excel-utils";
import { useToast } from "@/hooks/use-toast";
import { 
  Download, 
  GraduationCap, 
  Users, 
  BarChart3, 
  Calendar,
  Clock,
  UserX,
  UserCheck 
} from "lucide-react";
import type { Student, Faculty, StudentAttendanceLog, FacultyAttendanceLog } from "@shared/schema";

export default function Reports() {
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [selectedDept, setSelectedDept] = useState("all");
  const { toast } = useToast();

  // Fetch all data for reports
  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const { data: faculty = [] } = useQuery<Faculty[]>({
    queryKey: ["/api/faculty"],
  });

  const { data: studentAttendance = [] } = useQuery<StudentAttendanceLog[]>({
    queryKey: ["/api/attendance/students"],
  });

  const { data: facultyAttendance = [] } = useQuery<FacultyAttendanceLog[]>({
    queryKey: ["/api/attendance/faculty"],
  });

  const handleExportStudentData = () => {
    const filteredStudents = selectedDept === "all" 
      ? students 
      : students.filter(s => s.dept === selectedDept);

    exportToExcel(filteredStudents, "students_data.xlsx");
    toast({
      title: "Export Successful",
      description: "Student data has been exported to Excel.",
    });
  };

  const handleExportFacultyData = () => {
    const filteredFaculty = selectedDept === "all" 
      ? faculty 
      : faculty.filter(f => f.dept === selectedDept);

    exportToExcel(filteredFaculty, "faculty_data.xlsx");
    toast({
      title: "Export Successful",
      description: "Faculty data has been exported to Excel.",
    });
  };

  const handleExportStudentAttendance = () => {
    let filteredAttendance = studentAttendance;
    
    if (dateRange.from && dateRange.to) {
      filteredAttendance = studentAttendance.filter(log => 
        log.date >= dateRange.from && log.date <= dateRange.to
      );
    }

    exportToExcel(filteredAttendance, "student_attendance.xlsx");
    toast({
      title: "Export Successful",
      description: "Student attendance has been exported to Excel.",
    });
  };

  const handleExportFacultyAttendance = () => {
    let filteredAttendance = facultyAttendance;
    
    if (dateRange.from && dateRange.to) {
      filteredAttendance = facultyAttendance.filter(log => 
        log.date >= dateRange.from && log.date <= dateRange.to
      );
    }

    exportToExcel(filteredAttendance, "faculty_attendance.xlsx");
    toast({
      title: "Export Successful",
      description: "Faculty attendance has been exported to Excel.",
    });
  };

  const handleExportStudentAbsent = () => {
    // Generate absent list based on missing attendance records
    const today = new Date().toISOString().split('T')[0];
    const presentStudents = studentAttendance
      .filter(log => log.date === today)
      .map(log => log.rollNo);
    
    const absentStudents = students
      .filter(student => !presentStudents.includes(student.rollNo))
      .map(student => ({
        name: student.name,
        rollNo: student.rollNo,
        dept: student.dept,
        date: today,
      }));

    exportToExcel(absentStudents, "student_absent_log.xlsx");
    toast({
      title: "Export Successful",
      description: "Student absent log has been exported to Excel.",
    });
  };

  const handleExportFacultyAbsent = () => {
    // Generate absent list based on missing attendance records
    const today = new Date().toISOString().split('T')[0];
    const presentFaculty = facultyAttendance
      .filter(log => log.date === today)
      .map(log => log.staffId);
    
    const absentFaculty = faculty
      .filter(fac => !presentFaculty.includes(fac.staffId))
      .map(fac => ({
        name: fac.name,
        staffId: fac.staffId,
        dept: fac.dept,
        date: today,
      }));

    exportToExcel(absentFaculty, "faculty_absent_log.xlsx");
    toast({
      title: "Export Successful",
      description: "Faculty absent log has been exported to Excel.",
    });
  };

  const handleExportStudentDelay = () => {
    const delayedStudents = studentAttendance
      .filter(log => log.status === 'delay')
      .map(log => {
        const student = students.find(s => s.rollNo === log.rollNo);
        return {
          name: student?.name || 'Unknown',
          rollNo: log.rollNo,
          dept: student?.dept || 'Unknown',
          date: log.date,
          loginTime: log.loginTime,
        };
      });

    exportToExcel(delayedStudents, "student_delay_log.xlsx");
    toast({
      title: "Export Successful",
      description: "Student delay log has been exported to Excel.",
    });
  };

  const handleExportFacultyDelay = () => {
    const delayedFaculty = facultyAttendance
      .filter(log => log.status === 'delay')
      .map(log => {
        const fac = faculty.find(f => f.staffId === log.staffId);
        return {
          name: fac?.name || 'Unknown',
          staffId: log.staffId,
          dept: fac?.dept || 'Unknown',
          date: log.date,
          loginTime: log.loginTime,
        };
      });

    exportToExcel(delayedFaculty, "faculty_delay_log.xlsx");
    toast({
      title: "Export Successful",
      description: "Faculty delay log has been exported to Excel.",
    });
  };

  const handleGenerateCustomReport = () => {
    // Combine all data based on filters
    let reportData: any[] = [];

    if (dateRange.from && dateRange.to) {
      const filteredStudentAttendance = studentAttendance.filter(log => 
        log.date >= dateRange.from && log.date <= dateRange.to
      );
      const filteredFacultyAttendance = facultyAttendance.filter(log => 
        log.date >= dateRange.from && log.date <= dateRange.to
      );

      reportData = [
        ...filteredStudentAttendance.map(log => ({
          ...log,
          type: 'Student',
          name: students.find(s => s.rollNo === log.rollNo)?.name || 'Unknown',
        })),
        ...filteredFacultyAttendance.map(log => ({
          ...log,
          type: 'Faculty',
          name: faculty.find(f => f.staffId === log.staffId)?.name || 'Unknown',
        })),
      ];
    } else {
      reportData = [
        ...studentAttendance.map(log => ({
          ...log,
          type: 'Student',
          name: students.find(s => s.rollNo === log.rollNo)?.name || 'Unknown',
        })),
        ...facultyAttendance.map(log => ({
          ...log,
          type: 'Faculty',
          name: faculty.find(f => f.staffId === log.staffId)?.name || 'Unknown',
        })),
      ];
    }

    if (selectedDept !== "all") {
      reportData = reportData.filter(item => {
        if (item.type === 'Student') {
          const student = students.find(s => s.rollNo === item.rollNo);
          return student?.dept === selectedDept;
        } else {
          const fac = faculty.find(f => f.staffId === item.staffId);
          return fac?.dept === selectedDept;
        }
      });
    }

    exportToExcel(reportData, "custom_report.xlsx");
    toast({
      title: "Export Successful",
      description: "Custom report has been generated and exported.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Download Reports</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Student Reports */}
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="text-primary" size={24} />
              </div>
              <div className="ml-4">
                <CardTitle className="text-lg">Student Reports</CardTitle>
                <p className="text-sm text-gray-500">Attendance and data reports</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleExportStudentAttendance}
            >
              <UserCheck className="text-green-600 mr-3" size={16} />
              Student Attendance Log
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleExportStudentAbsent}
            >
              <UserX className="text-red-600 mr-3" size={16} />
              Student Absent Log
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleExportStudentDelay}
            >
              <Clock className="text-yellow-600 mr-3" size={16} />
              Student Delay Log
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleExportStudentData}
            >
              <Users className="text-primary mr-3" size={16} />
              Complete Student Data
            </Button>
          </CardContent>
        </Card>

        {/* Faculty Reports */}
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="text-green-600" size={24} />
              </div>
              <div className="ml-4">
                <CardTitle className="text-lg">Faculty Reports</CardTitle>
                <p className="text-sm text-gray-500">Faculty attendance and data</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleExportFacultyAttendance}
            >
              <UserCheck className="text-green-600 mr-3" size={16} />
              Faculty Attendance Log
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleExportFacultyAbsent}
            >
              <UserX className="text-red-600 mr-3" size={16} />
              Faculty Absent Log
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleExportFacultyDelay}
            >
              <Clock className="text-yellow-600 mr-3" size={16} />
              Faculty Delay Log
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleExportFacultyData}
            >
              <Users className="text-green-600 mr-3" size={16} />
              Complete Faculty Data
            </Button>
          </CardContent>
        </Card>

        {/* Custom Reports */}
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="text-purple-600" size={24} />
              </div>
              <div className="ml-4">
                <CardTitle className="text-lg">Custom Reports</CardTitle>
                <p className="text-sm text-gray-500">Date range and filtered reports</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2">Date Range</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  className="text-sm"
                />
                <Input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  className="text-sm"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2">Department</Label>
              <Select value={selectedDept} onValueChange={setSelectedDept}>
                <SelectTrigger className="text-sm">
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
            <Button
              onClick={handleGenerateCustomReport}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <Download className="mr-2" size={16} />
              Generate Report
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
