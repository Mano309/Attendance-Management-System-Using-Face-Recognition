import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Students table
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  rollNo: varchar("roll_no", { length: 50 }).notNull().unique(),
  role: text("role").notNull().default("Student"),
  dept: text("dept").notNull(),
  dob: text("dob").notNull(),
  gender: text("gender").notNull(),
  phone: varchar("phone", { length: 15 }).notNull(),
  email: text("email").notNull(),
  faceTrained: boolean("face_trained").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Faculty table
export const faculty = pgTable("faculty", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  staffId: varchar("staff_id", { length: 50 }).notNull().unique(),
  role: text("role").notNull().default("Faculty"),
  dept: text("dept").notNull(),
  dob: text("dob").notNull(),
  gender: text("gender").notNull(),
  phone: varchar("phone", { length: 15 }).notNull(),
  email: text("email").notNull(),
  faceTrained: boolean("face_trained").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Student attendance logs
export const studentAttendanceLogs = pgTable("student_attendance_logs", {
  id: serial("id").primaryKey(),
  rollNo: varchar("roll_no", { length: 50 }).notNull(),
  date: text("date").notNull(),
  loginTime: text("login_time").notNull(),
  status: text("status").notNull(), // 'on-time' | 'delay'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Faculty attendance logs
export const facultyAttendanceLogs = pgTable("faculty_attendance_logs", {
  id: serial("id").primaryKey(),
  staffId: varchar("staff_id", { length: 50 }).notNull(),
  date: text("date").notNull(),
  loginTime: text("login_time").notNull(),
  status: text("status").notNull(), // 'on-time' | 'delay'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Student absent logs
export const studentAbsentLogs = pgTable("student_absent_logs", {
  id: serial("id").primaryKey(),
  rollNo: varchar("roll_no", { length: 50 }).notNull(),
  date: text("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Faculty absent logs
export const facultyAbsentLogs = pgTable("faculty_absent_logs", {
  id: serial("id").primaryKey(),
  staffId: varchar("staff_id", { length: 50 }).notNull(),
  date: text("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Student delay logs
export const studentDelayLogs = pgTable("student_delay_logs", {
  id: serial("id").primaryKey(),
  rollNo: varchar("roll_no", { length: 50 }).notNull(),
  date: text("date").notNull(),
  delayDuration: integer("delay_duration").notNull(), // in minutes
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Faculty delay logs
export const facultyDelayLogs = pgTable("faculty_delay_logs", {
  id: serial("id").primaryKey(),
  staffId: varchar("staff_id", { length: 50 }).notNull(),
  date: text("date").notNull(),
  delayDuration: integer("delay_duration").notNull(), // in minutes
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Face recognition detections (for homepage)
export const faceDetections = pgTable("face_detections", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 50 }).notNull(),
  userName: text("user_name").notNull(),
  userType: text("user_type").notNull(), // 'student' | 'faculty'
  confidence: integer("confidence").notNull(), // percentage
  detectedAt: timestamp("detected_at").defaultNow().notNull(),
});

// Admin users
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Insert schemas
export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  faceTrained: true,
  createdAt: true,
});

export const insertFacultySchema = createInsertSchema(faculty).omit({
  id: true,
  faceTrained: true,
  createdAt: true,
});

export const insertStudentAttendanceSchema = createInsertSchema(studentAttendanceLogs).omit({
  id: true,
  createdAt: true,
});

export const insertFacultyAttendanceSchema = createInsertSchema(facultyAttendanceLogs).omit({
  id: true,
  createdAt: true,
});

export const insertFaceDetectionSchema = createInsertSchema(faceDetections).omit({
  id: true,
  detectedAt: true,
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
});

// Types
export type Student = Omit<typeof students.$inferSelect, 'id'> & { id: string };
export type InsertStudent = z.infer<typeof insertStudentSchema>;

export type Faculty = Omit<typeof faculty.$inferSelect, 'id'> & { id: string };
export type InsertFaculty = z.infer<typeof insertFacultySchema>;

export type StudentAttendanceLog = Omit<typeof studentAttendanceLogs.$inferSelect, 'id'> & { id: string };
export type InsertStudentAttendance = z.infer<typeof insertStudentAttendanceSchema>;

export type FacultyAttendanceLog = Omit<typeof facultyAttendanceLogs.$inferSelect, 'id'> & { id: string };
export type InsertFacultyAttendance = z.infer<typeof insertFacultyAttendanceSchema>;

export type StudentAbsentLog = Omit<typeof studentAbsentLogs.$inferSelect, 'id'> & { id: string };
export type FacultyAbsentLog = Omit<typeof facultyAbsentLogs.$inferSelect, 'id'> & { id: string };

export type StudentDelayLog = Omit<typeof studentDelayLogs.$inferSelect, 'id'> & { id: string };
export type FacultyDelayLog = Omit<typeof facultyDelayLogs.$inferSelect, 'id'> & { id: string };

export type FaceDetection = Omit<typeof faceDetections.$inferSelect, 'id'> & { id: string };
export type InsertFaceDetection = z.infer<typeof insertFaceDetectionSchema>;

export type AdminUser = Omit<typeof adminUsers.$inferSelect, 'id'> & { id: string };
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
