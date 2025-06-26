import {
  Student,
  Faculty,
  StudentAttendanceLog,
  FacultyAttendanceLog,
  StudentAbsentLog,
  FacultyAbsentLog,
  StudentDelayLog,
  FacultyDelayLog,
  FaceDetection,
  AdminUser,
  InsertStudent,
  InsertFaculty,
  InsertStudentAttendance,
  InsertFacultyAttendance,
  InsertFaceDetection,
  InsertAdminUser,
} from "@shared/schema";
import { connectToDatabase } from "./mongo";
import { ObjectId } from "mongodb";

function mapId<T extends { _id?: any }>(doc: T | null): any {
  if (!doc) return undefined;
  const { _id, ...rest } = doc;
  return { ...rest, id: _id?.toString() };
}

export interface IStorage {
  // Students
  getStudents(): Promise<Student[]>;
  getStudentByRollNo(rollNo: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(rollNo: string, student: Partial<Student>): Promise<Student | undefined>;
  deleteStudent(rollNo: string): Promise<boolean>;
  
  // Faculty
  getFaculty(): Promise<Faculty[]>;
  getFacultyByStaffId(staffId: string): Promise<Faculty | undefined>;
  createFaculty(faculty: InsertFaculty): Promise<Faculty>;
  updateFaculty(staffId: string, faculty: Partial<Faculty>): Promise<Faculty | undefined>;
  deleteFaculty(staffId: string): Promise<boolean>;
  
  // Student Attendance
  getStudentAttendanceLogs(date?: string): Promise<StudentAttendanceLog[]>;
  createStudentAttendance(attendance: InsertStudentAttendance): Promise<StudentAttendanceLog>;
  
  // Faculty Attendance
  getFacultyAttendanceLogs(date?: string): Promise<FacultyAttendanceLog[]>;
  createFacultyAttendance(attendance: InsertFacultyAttendance): Promise<FacultyAttendanceLog>;
  
  // Absent logs
  getStudentAbsentLogs(date?: string): Promise<StudentAbsentLog[]>;
  getFacultyAbsentLogs(date?: string): Promise<FacultyAbsentLog[]>;
  
  // Delay logs
  getStudentDelayLogs(date?: string): Promise<StudentDelayLog[]>;
  getFacultyDelayLogs(date?: string): Promise<FacultyDelayLog[]>;
  
  // Face detections
  getFaceDetections(): Promise<FaceDetection[]>;
  createFaceDetection(detection: InsertFaceDetection): Promise<FaceDetection>;
  
  // Admin
  getAdminByUsername(username: string): Promise<AdminUser | undefined>;
  createAdmin(admin: InsertAdminUser): Promise<AdminUser>;
  
  // Bulk operations
  createMultipleStudents(students: InsertStudent[]): Promise<Student[]>;
  createMultipleFaculty(faculty: InsertFaculty[]): Promise<Faculty[]>;
}

class MongoStorage implements IStorage {
  // Students
  async getStudents(): Promise<Student[]> {
    const db = await connectToDatabase();
    const docs = await db.collection("students").find().toArray();
    return docs.map(mapId);
  }

  async getStudentByRollNo(rollNo: string): Promise<Student | undefined> {
    const db = await connectToDatabase();
    const doc = await db.collection("students").findOne({ rollNo });
    return mapId(doc);
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const db = await connectToDatabase();
    const doc = {
      ...student,

      faceTrained: false,
      createdAt: new Date(),
    };
    const result = await db.collection("students").insertOne(doc);
    return mapId({ ...doc, _id: result.insertedId });
  }

  async updateStudent(rollNo: string, student: Partial<Student>): Promise<Student | undefined> {
    const db = await connectToDatabase();
    const result = await db.collection("students").findOneAndUpdate(
      { rollNo },
      { $set: student },
      { returnDocument: "after" }
    );
    return result ? mapId(result.value) : undefined;
  }

  async deleteStudent(rollNo: string): Promise<boolean> {
    const db = await connectToDatabase();
    const result = await db.collection("students").deleteOne({ rollNo });
    return result.deletedCount === 1;
  }

  // Faculty
  async getFaculty(): Promise<Faculty[]> {
    const db = await connectToDatabase();
    const docs = await db.collection("faculty").find().toArray();
    return docs.map(mapId);
  }

  async getFacultyByStaffId(staffId: string): Promise<Faculty | undefined> {
    const db = await connectToDatabase();
    const doc = await db.collection("faculty").findOne({ staffId });
    return mapId(doc);
  }

  async createFaculty(faculty: InsertFaculty): Promise<Faculty> {
    const db = await connectToDatabase();
    const doc = {
      ...faculty,

      faceTrained: false,
      createdAt: new Date(),
    };
    const result = await db.collection("faculty").insertOne(doc);
    return mapId({ ...doc, _id: result.insertedId });
  }

  async updateFaculty(staffId: string, faculty: Partial<Faculty>): Promise<Faculty | undefined> {
    const db = await connectToDatabase();
    const result = await db.collection("faculty").findOneAndUpdate(
      { staffId },
      { $set: faculty },
      { returnDocument: "after" }
    );
    return result && result.value ? mapId(result.value) : undefined;
  }

  async deleteFaculty(staffId: string): Promise<boolean> {
    const db = await connectToDatabase();
    const result = await db.collection("faculty").deleteOne({ staffId });
    return result.deletedCount === 1;
  }

  // Student Attendance
  async getStudentAttendanceLogs(date?: string): Promise<StudentAttendanceLog[]> {
    const db = await connectToDatabase();
    const docs = !date
      ? await db.collection("studentAttendance").find().toArray()
      : await db.collection("studentAttendance").find({ date }).toArray();
    return docs.map(mapId);
  }

  async createStudentAttendance(attendance: InsertStudentAttendance): Promise<StudentAttendanceLog> {
    const db = await connectToDatabase();
    const doc = {
      ...attendance,

      createdAt: new Date(),
    };
    const result = await db.collection("studentAttendance").insertOne(doc);
    return mapId({ ...doc, _id: result.insertedId });
  }

  // Faculty Attendance
  async getFacultyAttendanceLogs(date?: string): Promise<FacultyAttendanceLog[]> {
    const db = await connectToDatabase();
    const docs = !date
      ? await db.collection("facultyAttendance").find().toArray()
      : await db.collection("facultyAttendance").find({ date }).toArray();
    return docs.map(mapId);
  }

  async createFacultyAttendance(attendance: InsertFacultyAttendance): Promise<FacultyAttendanceLog> {
    const db = await connectToDatabase();
    const doc = {
      ...attendance,

      createdAt: new Date(),
    };
    const result = await db.collection("facultyAttendance").insertOne(doc);
    return mapId({ ...doc, _id: result.insertedId });
  }

  // Absent logs
  async getStudentAbsentLogs(date?: string): Promise<StudentAbsentLog[]> {
    const db = await connectToDatabase();
    const docs = !date
      ? await db.collection("studentAbsent").find().toArray()
      : await db.collection("studentAbsent").find({ date }).toArray();
    return docs.map(mapId);
  }

  async getFacultyAbsentLogs(date?: string): Promise<FacultyAbsentLog[]> {
    const db = await connectToDatabase();
    const docs = !date
      ? await db.collection("facultyAbsent").find().toArray()
      : await db.collection("facultyAbsent").find({ date }).toArray();
    return docs.map(mapId);
  }

  // Delay logs
  async getStudentDelayLogs(date?: string): Promise<StudentDelayLog[]> {
    const db = await connectToDatabase();
    const docs = !date
      ? await db.collection("studentDelay").find().toArray()
      : await db.collection("studentDelay").find({ date }).toArray();
    return docs.map(mapId);
  }

  async getFacultyDelayLogs(date?: string): Promise<FacultyDelayLog[]> {
    const db = await connectToDatabase();
    const docs = !date
      ? await db.collection("facultyDelay").find().toArray()
      : await db.collection("facultyDelay").find({ date }).toArray();
    return docs.map(mapId);
  }

  // Face detections
  async getFaceDetections(): Promise<FaceDetection[]> {
    const db = await connectToDatabase();
    const docs = await db.collection("faceDetections").find().sort({ detectedAt: -1 }).limit(10).toArray();
    return docs.map(mapId);
  }

  async createFaceDetection(detection: InsertFaceDetection): Promise<FaceDetection> {
    const db = await connectToDatabase();
    const doc = {
      ...detection,

      detectedAt: new Date(),
    };
    const result = await db.collection("faceDetections").insertOne(doc);
    return mapId({ ...doc, _id: result.insertedId });
  }

  // Admin
  async getAdminByUsername(username: string): Promise<AdminUser | undefined> {
    const db = await connectToDatabase();
    const doc = await db.collection("admin_users").findOne({ username });
    return mapId(doc);
  }

  async createAdmin(admin: InsertAdminUser): Promise<AdminUser> {
    const db = await connectToDatabase();
    const doc = { ...admin };
    try {
      // Use upsert to avoid duplicate admin creation
      const result = await db.collection("admin_users").updateOne(
        { username: doc.username },
        { $setOnInsert: doc },
        { upsert: true }
      );
      if (result.upsertedCount > 0) {
        console.log("Admin created:", doc);
      } else {
        console.log("Admin already exists:", doc.username);
      }
      // Always return the admin document
      const createdDoc = await db.collection("admin_users").findOne({ username: doc.username });
      return mapId(createdDoc);
    } catch (err) {
      console.error("Failed to create admin:", err);
      throw err;
    }
  }

  async ensureDefaultAdmin() {
    const db = await connectToDatabase();
    const existing = await db.collection("admin_users").findOne({ username: "admin" });
    if (!existing) {
      console.log("Creating default admin user...");
      await this.createAdmin({ username: "admin", password: "admin123" });
    } else {
      console.log("Default admin user already exists.");
    }
  }

  // Bulk operations
  async createMultipleStudents(students: InsertStudent[]): Promise<Student[]> {
    const db = await connectToDatabase();
    const docs = students.map(s => ({ ...s, faceTrained: false, createdAt: new Date() }));
    const result = await db.collection("students").insertMany(docs, { ordered: false });
    const ids = Object.values(result.insertedIds);
    return docs.map((doc, i) => mapId({ ...doc, _id: ids[i] }));
  }
  
  async createMultipleFaculty(faculty: InsertFaculty[]): Promise<Faculty[]> {
    const db = await connectToDatabase();
    const docs = faculty.map(f => ({ ...f, faceTrained: false, createdAt: new Date() }));
    const result = await db.collection("faculty").insertMany(docs, { ordered: false });
    const ids = Object.values(result.insertedIds);
    return docs.map((doc, i) => mapId({ ...doc, _id: ids[i] }));
  }
}

export const storage = new MongoStorage();
