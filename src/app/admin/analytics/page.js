// 'use client'

// import { useState, useEffect } from 'react'
// import { BarChart3, TrendingUp, Users, Star, Download, Filter } from 'lucide-react'
// import { supabase } from '../../../lib/supabase'
// import { useAuth } from '../../../context/AuthContext'
// import Card from '../../../components/ui/Card'
// import Button from '../../../components/ui/Button'

// export default function AnalyticsPage() {
//   const { user } = useAuth()
//   const [questionnaires, setQuestionnaires] = useState([])
//   const [selectedQuestionnaire, setSelectedQuestionnaire] = useState('')
//   const [loading, setLoading] = useState(true)
//   const [analytics, setAnalytics] = useState({
//     facultyRatings: [],
//     totalResponses: 0,
//     averageRating: 0,
//     departmentStats: [],
//     questionStats: []
//   })

//   useEffect(() => {
//     fetchQuestionnaires()
//   }, [user])

//   useEffect(() => {
//     if (selectedQuestionnaire) {
//       fetchAnalytics()
//     }
//   }, [selectedQuestionnaire])

//   async function fetchQuestionnaires() {
//     try {
//       const { data, error } = await supabase
//         .from('questionnaires')
//         .select('*')
//         .eq('college_id', user.id)
//         .order('created_at', { ascending: false })

//       if (error) throw error
//       setQuestionnaires(data || [])

//       // Auto-select active questionnaire
//       const active = data?.find(q => q.is_active)
//       if (active) {
//         setSelectedQuestionnaire(active.id)
//       }
//     } catch (error) {
//       console.error('Error:', error)
//     } finally {
//       setLoading(false)
//     }
//   }

//   async function fetchAnalytics() {
//     try {
//       const { data: responses, error } = await supabase
//         .from('feedback_responses')
//         .select(`
//           *,
//           faculty (id, name, subjects, faculty_departments(departments(name))),
//           answers (
//             question_id,
//             answer,
//             questions (type, text)
//           )
//         `)
//         .eq('questionnaire_id', selectedQuestionnaire)

//       if (error) throw error

//       // Calculate faculty-wise ratings
//       const facultyMap = {}

//       responses?.forEach(response => {
//         const facultyId = response.faculty.id
//         if (!facultyMap[facultyId]) {
//           facultyMap[facultyId] = {
//             faculty: response.faculty,
//             ratings: [],
//             responseCount: 0,
//             departments: response.faculty.faculty_departments.map(fd => fd.departments.name)
//           }
//         }

//         facultyMap[facultyId].responseCount++

//         // Extract star ratings
//         response.answers?.forEach(answer => {
//           if (answer.questions?.type === 'star_rating' && answer.answer?.value) {
//             facultyMap[facultyId].ratings.push(Number(answer.answer.value))
//           }
//         })
//       })

//       // Calculate averages
//       const facultyRatings = Object.values(facultyMap).map(item => ({
//         name: item.faculty.name,
//         subjects: item.faculty.subjects,
//         departments: item.departments,
//         averageRating: item.ratings.length > 0
//           ? (item.ratings.reduce((a, b) => a + b, 0) / item.ratings.length).toFixed(1)
//           : 0,
//         responseCount: item.responseCount,
//         totalRatings: item.ratings.length
//       }))

//       // Calculate overall average
//       const allRatings = Object.values(facultyMap).flatMap(f => f.ratings)
//       const averageRating = allRatings.length > 0
//         ? (allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1)
//         : 0

//       // Question-wise statistics
//       const questionMap = {}
//       responses?.forEach(response => {
//         response.answers?.forEach(answer => {
//           const qId = answer.question_id
//           if (!questionMap[qId]) {
//             questionMap[qId] = {
//               question: answer.questions,
//               ratings: [],
//               textResponses: []
//             }
//           }

//           if (answer.questions?.type === 'star_rating' && answer.answer?.value) {
//             questionMap[qId].ratings.push(Number(answer.answer.value))
//           } else if (['short_text', 'long_text'].includes(answer.questions?.type)) {
//             questionMap[qId].textResponses.push(answer.answer?.value)
//           }
//         })
//       })

//       const questionStats = Object.values(questionMap).map(item => ({
//         question: item.question?.text,
//         type: item.question?.type,
//         averageRating: item.ratings.length > 0
//           ? (item.ratings.reduce((a, b) => a + b, 0) / item.ratings.length).toFixed(1)
//           : null,
//         responseCount: item.ratings.length + item.textResponses.length,
//         textResponses: item.textResponses.slice(0, 5) // Show first 5
//       }))

//       setAnalytics({
//         facultyRatings,
//         totalResponses: responses?.length || 0,
//         averageRating,
//         questionStats
//       })
//     } catch (error) {
//       console.error('Error:', error)
//       alert('Failed to load analytics')
//     }
//   }

//   function exportCSV() {
//     const csv = [
//       'Faculty Name,Subjects,Departments,Average Rating,Response Count',
//       ...analytics.facultyRatings.map(f =>
//         `${f.name},${f.subjects},${f.departments.join('; ')},${f.averageRating},${f.responseCount}`
//       )
//     ].join('\n')

//     const blob = new Blob([csv], { type: 'text/csv' })
//     const url = window.URL.createObjectURL(blob)
//     const a = document.createElement('a')
//     a.href = url
//     a.download = 'analytics.csv'
//     a.click()
//   }

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div>Loading analytics...</div>
//       </div>
//     )
//   }

//   const activeQuestionnaire = questionnaires.find(q => q.id === selectedQuestionnaire)

//   return (
//     <div>
//       <div className="flex justify-between items-center mb-6">
//         <div>
//           <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
//           <p className="text-gray-600 mt-1">Faculty performance insights</p>
//         </div>
//         {analytics.facultyRatings.length > 0 && (
//           <Button onClick={exportCSV}>
//             <Download className="w-5 h-5 mr-2" />
//             Export Report
//           </Button>
//         )}
//       </div>

//       {/* Questionnaire Selector */}
//       <Card className="mb-6">
//         <div className="flex items-center gap-4">
//           <Filter className="w-5 h-5 text-gray-400" />
//           <label className="text-sm font-medium text-gray-700">
//             Select Questionnaire:
//           </label>
//           <select
//             value={selectedQuestionnaire}
//             onChange={(e) => setSelectedQuestionnaire(e.target.value)}
//             className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
//           >
//             <option value="">-- Select Questionnaire --</option>
//             {questionnaires.map(q => (
//               <option key={q.id} value={q.id}>
//                 {q.name} {q.is_active ? '(Active)' : ''}
//               </option>
//             ))}
//           </select>
//         </div>
//       </Card>

//       {!selectedQuestionnaire ? (
//         <Card className="text-center py-12">
//           <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
//           <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Questionnaire</h3>
//           <p className="text-gray-600">
//             Choose a questionnaire above to view analytics
//           </p>
//         </Card>
//       ) : (
//         <>
//           {/* Summary Cards */}
//           <div className="grid md:grid-cols-3 gap-6 mb-8">
//             <Card>
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm text-gray-600 mb-1">Total Responses</p>
//                   <p className="text-3xl font-bold text-gray-900">{analytics.totalResponses}</p>
//                 </div>
//                 <div className="p-3 bg-blue-100 rounded-lg">
//                   <Users className="w-6 h-6 text-blue-600" />
//                 </div>
//               </div>
//             </Card>

//             <Card>
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm text-gray-600 mb-1">Average Rating</p>
//                   <p className="text-3xl font-bold text-gray-900">{analytics.averageRating}/5</p>
//                 </div>
//                 <div className="p-3 bg-yellow-100 rounded-lg">
//                   <Star className="w-6 h-6 text-yellow-600" />
//                 </div>
//               </div>
//             </Card>

//             <Card>
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm text-gray-600 mb-1">Faculty Members</p>
//                   <p className="text-3xl font-bold text-gray-900">{analytics.facultyRatings.length}</p>
//                 </div>
//                 <div className="p-3 bg-green-100 rounded-lg">
//                   <TrendingUp className="w-6 h-6 text-green-600" />
//                 </div>
//               </div>
//             </Card>
//           </div>

//           {/* Faculty Performance Table */}
//           {analytics.facultyRatings.length === 0 ? (
//             <Card className="text-center py-12">
//               <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
//               <h3 className="text-lg font-semibold text-gray-900 mb-2">No data yet</h3>
//               <p className="text-gray-600">
//                 Analytics will appear here once students submit feedback for {activeQuestionnaire?.name}
//               </p>
//             </Card>
//           ) : (
//             <>
//               <Card className="mb-8">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-4">Faculty Performance</h3>
//                 <div className="space-y-4">
//                   {analytics.facultyRatings
//                     .sort((a, b) => b.averageRating - a.averageRating)
//                     .map((faculty, index) => (
//                       <div key={index} className="border-b pb-4 last:border-0">
//                         <div className="flex justify-between items-start mb-2">
//                           <div className="flex-1">
//                             <div className="flex items-center gap-2">
//                               <h4 className="font-semibold text-gray-900">{faculty.name}</h4>
//                               {index === 0 && faculty.averageRating >= 4.5 && (
//                                 <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
//                                   ⭐ Top Rated
//                                 </span>
//                               )}
//                             </div>
//                             <p className="text-sm text-gray-600">{faculty.subjects}</p>
//                             <div className="flex flex-wrap gap-1 mt-1">
//                               {faculty.departments.map((dept, i) => (
//                                 <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
//                                   {dept}
//                                 </span>
//                               ))}
//                             </div>
//                           </div>
//                           <div className="text-right ml-4">
//                             <div className="flex items-center gap-2">
//                               <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
//                               <span className="text-2xl font-bold text-gray-900">
//                                 {faculty.averageRating}
//                               </span>
//                               <span className="text-gray-500">/5</span>
//                             </div>
//                             <p className="text-sm text-gray-600 mt-1">
//                               {faculty.responseCount} responses
//                             </p>
//                           </div>
//                         </div>

//                         {/* Rating Bar */}
//                         <div className="mt-3">
//                           <div className="w-full bg-gray-200 rounded-full h-2">
//                             <div
//                               className={`h-2 rounded-full transition-all ${
//                                 faculty.averageRating >= 4.5 ? 'bg-green-500' :
//                                 faculty.averageRating >= 3.5 ? 'bg-blue-500' :
//                                 faculty.averageRating >= 2.5 ? 'bg-yellow-500' : 'bg-red-500'
//                               }`}
//                               style={{ width: `${(faculty.averageRating / 5) * 100}%` }}
//                             />
//                           </div>
//                         </div>
//                       </div>
//                     ))}
//                 </div>
//               </Card>

//               {/* Question-wise Analysis */}
//               {analytics.questionStats.length > 0 && (
//                 <Card>
//                   <h3 className="text-lg font-semibold text-gray-900 mb-4">Question-wise Analysis</h3>
//                   <div className="space-y-4">
//                     {analytics.questionStats.map((stat, index) => (
//                       <div key={index} className="border-b pb-4 last:border-0">
//                         <p className="font-medium text-gray-900 mb-2">{stat.question}</p>
//                         {stat.averageRating && (
//                           <div className="flex items-center gap-2">
//                             <span className="text-lg font-bold text-gray-900">{stat.averageRating}/5</span>
//                             <div className="flex-1 bg-gray-200 rounded-full h-2">
//                               <div
//                                 className="bg-blue-500 h-2 rounded-full"
//                                 style={{ width: `${(stat.averageRating / 5) * 100}%` }}
//                               />
//                             </div>
//                             <span className="text-sm text-gray-600">{stat.responseCount} responses</span>
//                           </div>
//                         )}
//                         {stat.textResponses && stat.textResponses.length > 0 && (
//                           <div className="mt-2 space-y-1">
//                             <p className="text-sm font-medium text-gray-700">Sample Responses:</p>
//                             {stat.textResponses.map((response, i) => (
//                               <p key={i} className="text-sm text-gray-600 italic pl-4">
//                                 "{response}"
//                               </p>
//                             ))}
//                           </div>
//                         )}
//                       </div>
//                     ))}
//                   </div>
//                 </Card>
//               )}
//             </>
//           )}
//         </>
//       )}
//     </div>
//   )
// }
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { supabase } from "../../../lib/supabase";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Search,
  TrendingUp,
  TrendingDown,
  Users,
  BookOpen,
  Filter,
  Download,
  Eye,
} from "lucide-react";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [questionnaires, setQuestionnaires] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [facultyAnalytics, setFacultyAnalytics] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [detailedAnalytics, setDetailedAnalytics] = useState(null);
  const [overallStats, setOverallStats] = useState(null);

  useEffect(() => {
    if (user) {
      fetchInitialData();
    }
  }, [user]);

  useEffect(() => {
    if (selectedQuestionnaire) {
      fetchAnalytics();
    }
  }, [selectedQuestionnaire, selectedDepartment]);

  async function fetchInitialData() {
    try {
      const [qData, dData, fData] = await Promise.all([
        supabase
          .from("questionnaires")
          .select("*")
          .eq("college_id", user.id)
          .order("created_at", { ascending: false }),
        supabase.from("departments").select("*").eq("college_id", user.id),
        supabase.from("faculty").select("*").eq("college_id", user.id),
      ]);

      setQuestionnaires(qData.data || []);
      setDepartments(dData.data || []);
      setFaculty(fData.data || []);

      // Auto-select active questionnaire
      const active = qData.data?.find((q) => q.is_active);
      if (active) setSelectedQuestionnaire(active.id);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAnalytics() {
    try {
      setLoading(true);

      // Build query
      let query = supabase
        .from("faculty_subject_assignments")
        .select(
          `
          id,
          faculty_id,
          subject_id,
          department_id,
          academic_year,
          semester,
          faculty (id, name, email),
          subjects (id, code, name),
          departments (id, name)
        `
        )
        .eq("is_active", true);

      if (selectedDepartment) {
        query = query.eq("department_id", selectedDepartment);
      }

      const { data: assignments, error: assignError } = await query;

      if (assignError) throw assignError;

      // Get feedback responses for these assignments
      const assignmentIds = assignments.map((a) => a.id);

      const { data: responses, error: respError } = await supabase
        .from("feedback_responses")
        .select(
          `
          id,
          faculty_subject_assignment_id,
          student_id,
          questionnaire_id,
          submitted_at
        `
        )
        .eq("questionnaire_id", selectedQuestionnaire)
        .in("faculty_subject_assignment_id", assignmentIds);

      if (respError) throw respError;

      // Get all answers with question details
      const responseIds = responses.map((r) => r.id);

      const { data: answers, error: ansError } = await supabase
        .from("answers")
        .select(
          `
          id,
          response_id,
          question_id,
          answer,
          questions (id, text, type)
        `
        )
        .in("response_id", responseIds);

      if (ansError) throw ansError;

      // Calculate analytics for each assignment
      const analyticsData = assignments.map((assignment) => {
        const assignmentResponses = responses.filter(
          (r) => r.faculty_subject_assignment_id === assignment.id
        );
        const responseCount = assignmentResponses.length;

        // Calculate average ratings
        const assignmentAnswers = answers.filter((a) =>
          assignmentResponses.some((r) => r.id === a.response_id)
        );

        const ratingAnswers = assignmentAnswers.filter(
          (a) => a.questions.type === "rating"
        );
        const avgRating =
          ratingAnswers.length > 0
            ? ratingAnswers.reduce(
                (sum, a) => sum + (parseFloat(a.answer) || 0),
                0
              ) / ratingAnswers.length
            : 0;

        return {
          assignmentId: assignment.id,
          facultyId: assignment.faculty_id,
          facultyName: assignment.faculty.name,
          facultyEmail: assignment.faculty.email,
          subjectCode: assignment.subjects.code,
          subjectName: assignment.subjects.name,
          departmentName: assignment.departments.name,
          departmentId: assignment.department_id,
          semester: assignment.semester,
          academicYear: assignment.academic_year,
          responseCount,
          averageRating: parseFloat(avgRating.toFixed(2)),
          totalQuestions: [
            ...new Set(assignmentAnswers.map((a) => a.question_id)),
          ].length,
        };
      });

      // Group by faculty
      const facultyGroups = {};
      analyticsData.forEach((item) => {
        if (!facultyGroups[item.facultyId]) {
          facultyGroups[item.facultyId] = {
            facultyId: item.facultyId,
            facultyName: item.facultyName,
            facultyEmail: item.facultyEmail,
            subjects: [],
            totalResponses: 0,
            overallRating: 0,
          };
        }

        facultyGroups[item.facultyId].subjects.push(item);
        facultyGroups[item.facultyId].totalResponses += item.responseCount;
      });

      // Calculate overall ratings
      Object.values(facultyGroups).forEach((group) => {
        const totalRating = group.subjects.reduce(
          (sum, s) => sum + s.averageRating * s.responseCount,
          0
        );
        group.overallRating =
          group.totalResponses > 0
            ? parseFloat((totalRating / group.totalResponses).toFixed(2))
            : 0;
      });

      setFacultyAnalytics(Object.values(facultyGroups));

      // Calculate overall stats
      const totalResponses = responses.length;
      const totalFaculty = Object.keys(facultyGroups).length;
      const avgOverallRating =
        totalResponses > 0
          ? Object.values(facultyGroups).reduce(
              (sum, g) => sum + g.overallRating * g.totalResponses,
              0
            ) / totalResponses
          : 0;

      setOverallStats({
        totalFaculty,
        totalResponses,
        avgRating: parseFloat(avgOverallRating.toFixed(2)),
        totalSubjects: analyticsData.length,
      });
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }

  async function fetchDetailedAnalytics(facultyData) {
    try {
      setLoading(true);

      // Get all assignment IDs for this faculty
      const assignmentIds = facultyData.subjects.map((s) => s.assignmentId);

      // Get responses
      const { data: responses, error: respError } = await supabase
        .from("feedback_responses")
        .select("id, faculty_subject_assignment_id, submitted_at")
        .eq("questionnaire_id", selectedQuestionnaire)
        .in("faculty_subject_assignment_id", assignmentIds);

      if (respError) throw respError;

      // Get answers with questions
      const responseIds = responses.map((r) => r.id);
      const { data: answers, error: ansError } = await supabase
        .from("answers")
        .select(
          `
          id,
          response_id,
          question_id,
          answer,
          questions (id, text, type, order_index)
        `
        )
        .in("response_id", responseIds);

      if (ansError) throw ansError;

      // Subject-wise breakdown
      const subjectAnalytics = facultyData.subjects.map((subject) => {
        const subjectResponses = responses.filter(
          (r) => r.faculty_subject_assignment_id === subject.assignmentId
        );
        const subjectAnswers = answers.filter((a) =>
          subjectResponses.some((r) => r.id === a.response_id)
        );

        // Question-wise analysis
        const questionMap = {};
        subjectAnswers.forEach((ans) => {
          if (!questionMap[ans.question_id]) {
            questionMap[ans.question_id] = {
              questionId: ans.question_id,
              questionText: ans.questions.text,
              questionType: ans.questions.type,
              answers: [],
            };
          }
          questionMap[ans.question_id].answers.push(ans.answer);
        });

        const questionAnalysis = Object.values(questionMap).map((q) => {
          if (q.questionType === "rating") {
            const ratings = q.answers.map((a) => parseFloat(a) || 0);
            const avg =
              ratings.length > 0
                ? ratings.reduce((a, b) => a + b, 0) / ratings.length
                : 0;

            // Rating distribution
            const distribution = [1, 2, 3, 4, 5].map((rating) => ({
              rating,
              count: ratings.filter((r) => r === rating).length,
            }));

            return {
              ...q,
              average: parseFloat(avg.toFixed(2)),
              distribution,
            };
          } else {
            return {
              ...q,
              responses: q.answers,
            };
          }
        });

        return {
          ...subject,
          questionAnalysis,
        };
      });

      // Get department average for comparison
      const deptFaculty = facultyAnalytics.filter((f) =>
        f.subjects.some(
          (s) => s.departmentId === facultyData.subjects[0]?.departmentId
        )
      );
      const deptAvgRating =
        deptFaculty.length > 0
          ? deptFaculty.reduce((sum, f) => sum + f.overallRating, 0) /
            deptFaculty.length
          : 0;

      setDetailedAnalytics({
        faculty: facultyData,
        subjectAnalytics,
        departmentAverage: parseFloat(deptAvgRating.toFixed(2)),
      });

      setSelectedFaculty(facultyData);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to load detailed analytics");
    } finally {
      setLoading(false);
    }
  }

  const filteredFaculty = facultyAnalytics.filter(
    (f) =>
      f.facultyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.subjects.some(
        (s) =>
          s.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.subjectCode.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  // Chart colors
  const COLORS = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
  ];

  if (loading && !selectedQuestionnaire) {
    return <div className="p-8">Loading...</div>;
  }

  // Detailed Faculty View
  if (selectedFaculty && detailedAnalytics) {
    const { faculty, subjectAnalytics, departmentAverage } = detailedAnalytics;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" onClick={() => setSelectedFaculty(null)}>
              ← Back to Overview
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">
              {faculty.facultyName}
            </h1>
            <p className="text-gray-600">{faculty.facultyEmail}</p>
          </div>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Overall Performance Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="grid md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Overall Rating</p>
              <p className="text-4xl font-bold text-blue-600">
                {faculty.overallRating}
              </p>
              <p className="text-xs text-gray-500">out of 5.0</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Department Average</p>
              <p className="text-4xl font-bold text-gray-700">
                {departmentAverage}
              </p>
              <p className="text-xs text-gray-500">comparison</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Responses</p>
              <p className="text-4xl font-bold text-green-600">
                {faculty.totalResponses}
              </p>
              <p className="text-xs text-gray-500">feedback received</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Subjects Teaching</p>
              <p className="text-4xl font-bold text-purple-600">
                {faculty.subjects.length}
              </p>
              <p className="text-xs text-gray-500">active subjects</p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            {faculty.overallRating > departmentAverage ? (
              <>
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-600 font-medium">
                  {((faculty.overallRating - departmentAverage) * 20).toFixed(
                    1
                  )}
                  % above department average
                </span>
              </>
            ) : faculty.overallRating < departmentAverage ? (
              <>
                <TrendingDown className="w-5 h-5 text-red-600" />
                <span className="text-sm text-red-600 font-medium">
                  {((departmentAverage - faculty.overallRating) * 20).toFixed(
                    1
                  )}
                  % below department average
                </span>
              </>
            ) : (
              <span className="text-sm text-gray-600">
                At department average
              </span>
            )}
          </div>
        </Card>

        {/* Subject-wise Performance */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Subject-wise Performance
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={subjectAnalytics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="subjectCode" />
              <YAxis domain={[0, 5]} />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="averageRating"
                fill="#3B82F6"
                name="Average Rating"
              />
              <Bar
                dataKey="responseCount"
                fill="#10B981"
                name="Response Count"
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Subject Details */}
        {subjectAnalytics.map((subject, idx) => (
          <Card key={idx}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {subject.subjectCode} - {subject.subjectName}
                </h3>
                <p className="text-sm text-gray-600">
                  {subject.departmentName} • Semester {subject.semester}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-blue-600">
                  {subject.averageRating}
                </p>
                <p className="text-sm text-gray-500">
                  {subject.responseCount} responses
                </p>
              </div>
            </div>

            {/* Question-wise Analysis */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">
                Question-wise Breakdown
              </h4>
              {subject.questionAnalysis.map((q, qIdx) => (
                <div key={qIdx} className="border-l-4 border-blue-500 pl-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">
                    {q.questionText}
                  </p>

                  {q.questionType === "rating" && (
                    <>
                      <div className="flex items-center gap-4 mb-2">
                        <span className="text-2xl font-bold text-blue-600">
                          {q.average}
                        </span>
                        <span className="text-sm text-gray-600">
                          Average Rating
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {q.distribution.map((d) => (
                          <div key={d.rating} className="flex-1">
                            <div className="text-xs text-center mb-1">
                              {d.rating}★
                            </div>
                            <div className="bg-gray-200 rounded h-2">
                              <div
                                className="bg-blue-600 rounded h-2"
                                style={{
                                  width: `${
                                    subject.responseCount > 0
                                      ? (d.count / subject.responseCount) * 100
                                      : 0
                                  }%`,
                                }}
                              />
                            </div>
                            <div className="text-xs text-center mt-1">
                              {d.count}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {q.questionType === "text" && (
                    <div className="text-sm text-gray-600">
                      {q.responses.length} text responses received
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // Main Overview
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Faculty Analytics
          </h1>
          <p className="text-gray-600 mt-1">
            Subject-wise performance analysis
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Questionnaire
            </label>
            <select
              value={selectedQuestionnaire}
              onChange={(e) => setSelectedQuestionnaire(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select Questionnaire</option>
              {questionnaires.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.name} {q.is_active ? "(Active)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search faculty or subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Overall Stats */}
      {overallStats && (
        <div className="grid md:grid-cols-4 gap-6">
          <Card>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Faculty</p>
                <p className="text-3xl font-bold text-gray-900">
                  {overallStats.totalFaculty}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </Card>

          <Card>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Subjects</p>
                <p className="text-3xl font-bold text-gray-900">
                  {overallStats.totalSubjects}
                </p>
              </div>
              <BookOpen className="w-8 h-8 text-purple-600" />
            </div>
          </Card>

          <Card>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Responses</p>
                <p className="text-3xl font-bold text-gray-900">
                  {overallStats.totalResponses}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </Card>

          <Card>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Average Rating</p>
                <p className="text-3xl font-bold text-gray-900">
                  {overallStats.avgRating}
                </p>
              </div>
              <div className="text-2xl">⭐</div>
            </div>
          </Card>
        </div>
      )}

      {/* Faculty List */}
      {filteredFaculty.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-600">No analytics data available</p>
          <p className="text-sm text-gray-500 mt-2">
            Generate tokens and collect feedback to see analytics
          </p>
        </Card>
      ) : (
        <Card>
          <div className="space-y-4">
            {filteredFaculty.map((fac, idx) => (
              <div
                key={idx}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => fetchDetailedAnalytics(fac)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {fac.facultyName}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {fac.facultyEmail}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {fac.subjects.map((sub, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-medium"
                        >
                          {sub.subjectCode} - {sub.subjectName}
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-6 text-sm">
                      <span className="text-gray-600">
                        <strong>{fac.subjects.length}</strong> subjects
                      </span>
                      <span className="text-gray-600">
                        <strong>{fac.totalResponses}</strong> responses
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-3xl font-bold text-blue-600">
                      {fac.overallRating}
                    </p>
                    <p className="text-sm text-gray-500">Overall</p>
                    <Button size="sm" className="mt-2">
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
