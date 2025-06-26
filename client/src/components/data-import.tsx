import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileSpreadsheet, Users, GraduationCap, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface ImportResult {
  success: number;
  errors: number;
  duplicates: number;
  message: string;
}

export default function DataImport() {
  const [studentFile, setStudentFile] = useState<File | null>(null);
  const [facultyFile, setFacultyFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const studentFileRef = useRef<HTMLInputElement>(null);
  const facultyFileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const importStudentsMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/import/students", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const error = new Error("Import failed");
        (error as any).response = response;
        throw error;
      }
      return response.json() as Promise<ImportResult>;
    },
    onSuccess: (result) => {
      setImportResult(result);
      toast({
        title: "Import Complete",
        description: `Successfully imported ${result.success} students.`,
      });
      setStudentFile(null);
      if (studentFileRef.current) {
        studentFileRef.current.value = "";
      }
    },
    onError: async (error: any) => {
      let errorMsg = "Failed to import students. Please check the file format.";
      if (error instanceof Error && (error as any).response) {
        try {
          const data = await (error as any).response.json();
          if (data && data.message) errorMsg = data.message;
          if (data && data.errors && Array.isArray(data.errors)) {
            errorMsg += ": " + data.errors.map((e: any) =>
              e.errors ? e.errors.map((err: any) => err.message).join(", ") : ""
            ).join("; ");
          }
        } catch {}
      }
      toast({
        title: "Import Failed",
        description: errorMsg,
        variant: "destructive",
      });
    },
  });

  const importFacultyMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      // Ensure correct headers for FormData (let browser set Content-Type)
      const response = await fetch("/api/import/faculty", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Import failed");
      }
      return response.json() as Promise<ImportResult>;
    },
    onSuccess: (result) => {
      setImportResult(result);
      toast({
        title: "Import Complete",
        description: `Successfully imported ${result.success} faculty members.`,
      });
      setFacultyFile(null);
      if (facultyFileRef.current) {
        facultyFileRef.current.value = "";
      }
    },
    onError: () => {
      toast({
        title: "Import Failed",
        description: "Failed to import faculty. Please check the file format.",
        variant: "destructive",
      });
    },
  });

  const handleStudentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.match(/\.(xlsx|xls)$/)) {
        toast({
          title: "Invalid File",
          description: "Please select an Excel file (.xlsx or .xls).",
          variant: "destructive",
        });
        return;
      }
      setStudentFile(file);
    }
  };

  const handleFacultyFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.match(/\.(xlsx|xls)$/)) {
        toast({
          title: "Invalid File",
          description: "Please select an Excel file (.xlsx or .xls).",
          variant: "destructive",
        });
        return;
      }
      setFacultyFile(file);
    }
  };

  const handleImportStudents = () => {
    if (!studentFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to import.",
        variant: "destructive",
      });
      return;
    }
    importStudentsMutation.mutate(studentFile);
  };

  const handleImportFaculty = () => {
    if (!facultyFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to import.",
        variant: "destructive",
      });
      return;
    }
    importFacultyMutation.mutate(facultyFile);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Import Data from Excel</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Student Import */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-primary">
              <GraduationCap className="mr-2" size={20} />
              Import Students
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Sample Format */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Required Excel Format:</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• Name, RollNo, Role, Dept, DOB, Gender, Phone, Email</p>
                <p>• Date format: DD/MM/YYYY</p>
                <p>• Gender: Male/Female/Other</p>
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Excel File
              </label>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer"
                onClick={() => studentFileRef.current?.click()}
              >
                <input
                  ref={studentFileRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleStudentFileChange}
                />
                <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                <p className="text-gray-600">
                  {studentFile ? studentFile.name : "Click to upload or drag and drop"}
                </p>
                <p className="text-sm text-gray-500">Excel files only</p>
              </div>
            </div>

            <Button
              onClick={handleImportStudents}
              disabled={!studentFile || importStudentsMutation.isPending}
              className="w-full"
            >
              <Upload className="mr-2" size={16} />
              {importStudentsMutation.isPending ? "Importing..." : "Import Students"}
            </Button>
          </CardContent>
        </Card>

        {/* Faculty Import */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-green-600">
              <Users className="mr-2" size={20} />
              Import Faculty
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Sample Format */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Required Excel Format:</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• Name, StaffID, Role, Dept, DOB, Gender, Phone, Email</p>
                <p>• Date format: DD/MM/YYYY</p>
                <p>• Gender: Male/Female/Other</p>
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Excel File
              </label>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer"
                onClick={() => facultyFileRef.current?.click()}
              >
                <input
                  ref={facultyFileRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleFacultyFileChange}
                />
                <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                <p className="text-gray-600">
                  {facultyFile ? facultyFile.name : "Click to upload or drag and drop"}
                </p>
                <p className="text-sm text-gray-500">Excel files only</p>
              </div>
            </div>

            <Button
              onClick={handleImportFaculty}
              disabled={!facultyFile || importFacultyMutation.isPending}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Upload className="mr-2" size={16} />
              {importFacultyMutation.isPending ? "Importing..." : "Import Faculty"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Import Results */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileSpreadsheet className="mr-2" size={20} />
              Import Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <CheckCircle className="text-green-600 mr-2" size={20} />
                  <p className="text-2xl font-bold text-green-600">{importResult.success}</p>
                </div>
                <p className="text-sm text-gray-600">Successfully Imported</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <XCircle className="text-red-600 mr-2" size={20} />
                  <p className="text-2xl font-bold text-red-600">{importResult.errors}</p>
                </div>
                <p className="text-sm text-gray-600">Errors</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <AlertCircle className="text-yellow-600 mr-2" size={20} />
                  <p className="text-2xl font-bold text-yellow-600">{importResult.duplicates}</p>
                </div>
                <p className="text-sm text-gray-600">Duplicates Skipped</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
