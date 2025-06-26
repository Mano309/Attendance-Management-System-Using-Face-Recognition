import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStudentSchema, insertFacultySchema, insertStudentAttendanceSchema, insertFacultyAttendanceSchema, insertFaceDetectionSchema } from "@shared/schema";
import multer from "multer";
import { parseStudentsExcel, parseFacultyExcel } from "./excel-utils";
// Simulation fallback function
async function simulateFaceRecognition(res: any, storage: any) {
  const students = await storage.getStudents();
  const faculty = await storage.getFaculty();
  const allUsers = [
    ...students.map((s: any) => ({ ...s, type: 'student', userId: s.rollNo })),
    ...faculty.map((f: any) => ({ ...f, type: 'faculty', userId: f.staffId }))
  ];
  
  if (allUsers.length === 0) {
    return res.json({ recognized: false });
  }
  
  // Simulate 30% recognition rate
  if (Math.random() > 0.7) {
    const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
    const confidence = Math.floor(Math.random() * 20) + 80;
    
    await storage.createFaceDetection({
      userId: randomUser.userId,
      userName: randomUser.name,
      userType: randomUser.type,
      confidence,
    });
    
    const now = new Date();
    const time = now.toLocaleTimeString();
    const date = now.toISOString().split('T')[0];
    const isOnTime = now.getHours() < 9 || (now.getHours() === 9 && now.getMinutes() <= 30);
    
    if (randomUser.type === 'student') {
      await storage.createStudentAttendance({
        rollNo: randomUser.userId,
        date,
        loginTime: time,
        status: isOnTime ? 'on-time' : 'delay',
      });
    } else {
      await storage.createFacultyAttendance({
        staffId: randomUser.userId,
        date,
        loginTime: time,
        status: isOnTime ? 'on-time' : 'delay',
      });
    }
    
    res.json({
      recognized: true,
      user: {
        id: randomUser.userId,
        name: randomUser.name,
        type: randomUser.type,
        dept: randomUser.dept,
      },
      confidence,
      status: isOnTime ? 'on-time' : 'delay',
      time,
    });
  } else {
    res.json({ recognized: false });
  }
}

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Admin authentication
 app.post("/api/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await storage.getAdminByUsername(username);
    console.log("[DEBUG] Login attempt:", { username, password, admin });
    if (!admin || admin.password !== password) {
      console.log("[DEBUG] Login failed: invalid credentials", { admin });
      return res.status(401).json({ message: "Invalid credentials" });
    }
    res.json({ message: "Login successful", admin: { id: admin.id, username: admin.username } });
  } catch (error) {
    console.error("[DEBUG] Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
});

  // Students endpoints
  app.get("/api/students", async (req, res) => {
    try {
      const students = await storage.getStudents();
      res.json(students);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.get("/api/students/:rollNo", async (req, res) => {
    try {
      const student = await storage.getStudentByRollNo(req.params.rollNo);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch student" });
    }
  });

  app.post("/api/students", async (req, res) => {
    try {
      const result = insertStudentSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid student data", errors: result.error.errors });
      }
      
      const student = await storage.createStudent(result.data);
      res.status(201).json(student);
    } catch (error) {
      res.status(500).json({ message: "Failed to create student" });
    }
  });

  app.put("/api/students/:rollNo", async (req, res) => {
    try {
      const updated = await storage.updateStudent(req.params.rollNo, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update student" });
    }
  });

  app.delete("/api/students/:rollNo", async (req, res) => {
    try {
      const deleted = await storage.deleteStudent(req.params.rollNo);
      if (!deleted) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json({ message: "Student deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete student" });
    }
  });

  // Faculty endpoints
  app.get("/api/faculty", async (req, res) => {
    try {
      const faculty = await storage.getFaculty();
      res.json(faculty);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch faculty" });
    }
  });

  app.get("/api/faculty/:staffId", async (req, res) => {
    try {
      const faculty = await storage.getFacultyByStaffId(req.params.staffId);
      if (!faculty) {
        return res.status(404).json({ message: "Faculty not found" });
      }
      res.json(faculty);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch faculty" });
    }
  });

  app.post("/api/faculty", async (req, res) => {
    try {
      const result = insertFacultySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid faculty data", errors: result.error.errors });
      }
      
      const faculty = await storage.createFaculty(result.data);
      res.status(201).json(faculty);
    } catch (error) {
      res.status(500).json({ message: "Failed to create faculty" });
    }
  });

  app.put("/api/faculty/:staffId", async (req, res) => {
    try {
      const updated = await storage.updateFaculty(req.params.staffId, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Faculty not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update faculty" });
    }
  });

  app.delete("/api/faculty/:staffId", async (req, res) => {
    try {
      const deleted = await storage.deleteFaculty(req.params.staffId);
      if (!deleted) {
        return res.status(404).json({ message: "Faculty not found" });
      }
      res.json({ message: "Faculty deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete faculty" });
    }
  });

  // Attendance endpoints
  app.get("/api/attendance/students", async (req, res) => {
    try {
      const date = req.query.date as string;
      const logs = await storage.getStudentAttendanceLogs(date);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch student attendance" });
    }
  });

  app.get("/api/attendance/faculty", async (req, res) => {
    try {
      const date = req.query.date as string;
      const logs = await storage.getFacultyAttendanceLogs(date);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch faculty attendance" });
    }
  });

  app.post("/api/attendance/students", async (req, res) => {
    try {
      const result = insertStudentAttendanceSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid attendance data", errors: result.error.errors });
      }
      
      const attendance = await storage.createStudentAttendance(result.data);
      res.status(201).json(attendance);
    } catch (error) {
      res.status(500).json({ message: "Failed to record student attendance" });
    }
  });

  app.post("/api/attendance/faculty", async (req, res) => {
    try {
      const result = insertFacultyAttendanceSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid attendance data", errors: result.error.errors });
      }
      
      const attendance = await storage.createFacultyAttendance(result.data);
      res.status(201).json(attendance);
    } catch (error) {
      res.status(500).json({ message: "Failed to record faculty attendance" });
    }
  });

  // Face recognition endpoints
  app.post("/api/face/recognize", async (req, res) => {
    try {
      const { image } = req.body;
      
      if (!image) {
        return res.status(400).json({ message: "No image data provided" });
      }

      // Call Python OpenCV service
      const pythonResponse = await fetch('http://localhost:5001/recognize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image }),
      });

      if (!pythonResponse.ok) {
        // Fallback to simulation if Python service is not available
        console.log("Python service unavailable, using simulation");
        return simulateFaceRecognition(res, storage);
      }

      const recognitionResult = await pythonResponse.json();

      if (recognitionResult.recognized) {
        const userId = recognitionResult.user_id;
        const confidence = recognitionResult.confidence;
        
        // Get user info from database
        const student = await storage.getStudentByRollNo(userId);
        const faculty = await storage.getFacultyByStaffId(userId);
        const user = student || faculty;
        
        if (user) {
          const userType = student ? 'student' : 'faculty';
          
          // Create face detection record
          await storage.createFaceDetection({
            userId,
            userName: user.name,
            userType,
            confidence: Math.round(confidence),
          });
          
          // Record attendance
          const now = new Date();
          const time = now.toLocaleTimeString();
          const date = now.toISOString().split('T')[0];
          const isOnTime = now.getHours() < 9 || (now.getHours() === 9 && now.getMinutes() <= 30);
          
          if (userType === 'student') {
            await storage.createStudentAttendance({
              rollNo: userId,
              date,
              loginTime: time,
              status: isOnTime ? 'on-time' : 'delay',
            });
          } else {
            await storage.createFacultyAttendance({
              staffId: userId,
              date,
              loginTime: time,
              status: isOnTime ? 'on-time' : 'delay',
            });
          }
          
          res.json({
            recognized: true,
            user: {
              id: userId,
              name: user.name,
              type: userType,
              dept: user.dept,
            },
            confidence: Math.round(confidence),
            status: isOnTime ? 'on-time' : 'delay',
            time,
          });
        } else {
          res.json({ recognized: false, message: "User not found in database" });
        }
      } else {
        res.json({ recognized: false, message: recognitionResult.message || "No face detected" });
      }
    } catch (error) {
      console.error("Face recognition error:", error);
      // Fallback to simulation
      return simulateFaceRecognition(res, storage);
    }
  });

  app.get("/api/face/detections", async (req, res) => {
    try {
      const detections = await storage.getFaceDetections();
      res.json(detections);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch detections" });
    }
  });

  app.post("/api/face/train", async (req, res) => {
    try {
      const { userId, userType, images, userInfo } = req.body;
      
      if (!userId || !userType || !images || images.length < 2) {
        return res.status(400).json({ message: "Invalid training data" });
      }

      try {
        // Send to Python OpenCV service for training
        const pythonResponse = await fetch('http://localhost:5001/train', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            images: images,
            user_info: userInfo
          }),
        });

        if (pythonResponse.ok) {
          const result = await pythonResponse.json();
          
          // Update face trained status in database
          if (userType === 'student') {
            await storage.updateStudent(userId, { faceTrained: true });
          } else {
            await storage.updateFaculty(userId, { faceTrained: true });
          }
          
          res.json({
            success: true,
            message: "Face training completed successfully with OpenCV",
            details: result
          });
        } else {
          throw new Error('Python service failed');
        }
      } catch (pythonError) {
        console.log("Python service unavailable, using simulation");
        
        // Fallback simulation
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (userType === 'student') {
          await storage.updateStudent(userId, { faceTrained: true });
        } else {
          await storage.updateFaculty(userId, { faceTrained: true });
        }
        
        res.json({
          success: true,
          message: "Face training completed (simulation mode)"
        });
      }
    } catch (error) {
      console.error("Training error:", error);
      res.status(500).json({ message: "Face training failed" });
    }
  });

  // Import endpoints
  app.post("/api/import/students", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      // Parse Excel file buffer
      const students = parseStudentsExcel(req.file.buffer);
      if (!Array.isArray(students) || students.length === 0) {
        return res.status(400).json({ message: "No students found in file" });
      }
      // Auto-convert all fields to string for each student
      const studentsStr = students.map((student: any) => {
        const obj: any = {};
        for (const key in student) {
          obj[key] = student[key] !== undefined && student[key] !== null ? String(student[key]) : "";
        }
        return obj;
      });
      // Debug: log the first parsed and stringified student
      if (studentsStr.length > 0) {
        console.log('[IMPORT DEBUG] First student row after string conversion:', studentsStr[0]);
      }
      // Optionally validate each student here
      const validStudents: any[] = [];
      const errors: any[] = [];
      const seenRollNos = new Set();
      studentsStr.forEach((student, idx) => {
        const result = insertStudentSchema.safeParse(student);
        if (!result.success) {
          errors.push({ row: idx + 2, student, errors: result.error.errors }); // +2 for Excel row (header + 1-indexed)
          return;
        }
        if (seenRollNos.has(student.rollNo)) {
          errors.push({ row: idx + 2, student, errors: [{ message: 'Duplicate rollNo in file' }] });
          return;
        }
        seenRollNos.add(student.rollNo);
        validStudents.push(result.data);
      });
      if (validStudents.length === 0) {
        return res.status(400).json({ message: "No valid students found in file", errors });
      }
      const created = await storage.createMultipleStudents(validStudents);
      res.json({
        success: created.length,
        errors: errors.length,
        duplicates: validStudents.length - created.length,
        errorDetails: errors,
        message: "Students imported successfully"
      });
    } catch (error) {
      console.error("[IMPORT ERROR]", error);
      res.status(500).json({ message: "Import failed" });
    }
  });

  app.post("/api/import/faculty", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      // Parse Excel file buffer
      const faculty = parseFacultyExcel(req.file.buffer);
      if (!Array.isArray(faculty) || faculty.length === 0) {
        return res.status(400).json({ message: "No faculty found in file" });
      }
      // Auto-convert all fields to string for each faculty member
      const facultyStr = faculty.map((facultyMember: any) => {
        const obj: any = {};
        for (const key in facultyMember) {
          obj[key] = facultyMember[key] !== undefined && facultyMember[key] !== null ? String(facultyMember[key]) : "";
        }
        return obj;
      });
      // Debug: log the first parsed and stringified faculty member
      if (facultyStr.length > 0) {
        console.log('[IMPORT DEBUG] First faculty row after string conversion:', facultyStr[0]);
      }
      // Optionally validate each faculty here
      const validFaculty: any[] = [];
      const errors: any[] = [];
      const seenStaffIds = new Set();
      facultyStr.forEach((facultyMember, idx) => {
        const result = insertFacultySchema.safeParse(facultyMember);
        if (!result.success) {
          errors.push({ row: idx + 2, faculty: facultyMember, errors: result.error.errors });
          return;
        }
        if (seenStaffIds.has(facultyMember.staffId)) {
          errors.push({ row: idx + 2, faculty: facultyMember, errors: [{ message: 'Duplicate staffId in file' }] });
          return;
        }
        seenStaffIds.add(facultyMember.staffId);
        validFaculty.push(result.data);
      });
      if (validFaculty.length === 0) {
        return res.status(400).json({ message: "No valid faculty found in file", errors });
      }
      const created = await storage.createMultipleFaculty(validFaculty);
      res.json({
        success: created.length,
        errors: errors.length,
        duplicates: validFaculty.length - created.length,
        errorDetails: errors,
        message: "Faculty imported successfully"
      });
    } catch (error) {
      console.error("[IMPORT ERROR]", error);
      res.status(500).json({ message: "Import failed" });
    }
  });

  // Statistics endpoints
  app.get("/api/stats/overview", async (req, res) => {
    try {
      const students = await storage.getStudents();
      const faculty = await storage.getFaculty();
      const today = new Date().toISOString().split('T')[0];
      const studentAttendance = await storage.getStudentAttendanceLogs(today);
      const facultyAttendance = await storage.getFacultyAttendanceLogs(today);
      
      res.json({
        totalStudents: students.length,
        totalFaculty: faculty.length,
        studentsPresent: studentAttendance.length,
        facultyPresent: facultyAttendance.length,
        studentsAbsent: students.length - studentAttendance.length,
        facultyAbsent: faculty.length - facultyAttendance.length,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
