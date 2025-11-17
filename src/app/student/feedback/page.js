// 'use client'

// import { useState, useEffect } from 'react'
// import { useRouter } from 'next/navigation'
// import { useAuth } from '../../../context/AuthContext'
// import { supabase } from '../../../lib/supabase'
// import { Star, ChevronRight, AlertCircle } from 'lucide-react'
// import Button from '../../../components/ui/Button'
// import Card from '../../../components/ui/Card'

// export default function StudentFeedbackPage() {
//   const router = useRouter()
//   const { user, logout } = useAuth()
//   const [faculty, setFaculty] = useState([])
//   const [questions, setQuestions] = useState([])
//   const [currentFacultyIndex, setCurrentFacultyIndex] = useState(0)
//   const [responses, setResponses] = useState({})
//   const [loading, setLoading] = useState(true)
//   const [submitting, setSubmitting] = useState(false)

//   useEffect(() => {
//     if (!user || user.role !== 'student') {
//       router.push('/student/login')
//       return
//     }
//     fetchData()
//   }, [user])

//   async function fetchData() {
//     try {
//       // Fetch faculty from student's department
//       const { data: facultyData, error: facultyError } = await supabase
//         .from('faculty')
//         .select(`
//           *,
//           faculty_departments!inner (
//             department_id
//           )
//         `)
//         .eq('faculty_departments.department_id', user.departmentId)

//       if (facultyError) throw facultyError

//       // Fetch questions
//       const { data: questionsData, error: questionsError } = await supabase
//         .from('questions')
//         .select('*')
//         .order('order_index')

//       if (questionsError) throw questionsError

//       setFaculty(facultyData || [])
//       setQuestions(questionsData || [])

//       // Initialize responses object
//       const initialResponses = {}
//       facultyData.forEach(f => {
//         initialResponses[f.id] = {}
//       })
//       setResponses(initialResponses)

//     } catch (error) {
//       console.error('Error fetching data:', error)
//       alert('Failed to load feedback form')
//     } finally {
//       setLoading(false)
//     }
//   }

//   function handleAnswerChange(facultyId, questionId, value) {
//     setResponses(prev => ({
//       ...prev,
//       [facultyId]: {
//         ...prev[facultyId],
//         [questionId]: value
//       }
//     }))
//   }

//   function validateCurrentFaculty() {
//     const currentFaculty = faculty[currentFacultyIndex]
//     const facultyResponses = responses[currentFaculty.id] || {}

//     for (const question of questions) {
//       if (question.required && !facultyResponses[question.id]) {
//         alert(`Please answer: ${question.text}`)
//         return false
//       }
//     }
//     return true
//   }

//   function handleNext() {
//     if (!validateCurrentFaculty()) return

//     if (currentFacultyIndex < faculty.length - 1) {
//       setCurrentFacultyIndex(prev => prev + 1)
//       window.scrollTo(0, 0)
//     } else {
//       handleSubmit()
//     }
//   }

//   function handlePrevious() {
//     if (currentFacultyIndex > 0) {
//       setCurrentFacultyIndex(prev => prev - 1)
//       window.scrollTo(0, 0)
//     }
//   }

//   async function handleSubmit() {
//     if (!confirm('Submit all feedback? You cannot change answers after submission.')) return

//     setSubmitting(true)
//     try {
//       // Save all responses
//       for (const fac of faculty) {
//         const facultyResponses = responses[fac.id]

//         // Create feedback response record
//         const { data: responseData, error: responseError } = await supabase
//           .from('feedback_responses')
//           .insert([{
//             token: user.token,
//             student_id: user.id,
//             faculty_id: fac.id,
//             session_id: null
//           }])
//           .select()
//           .single()

//         if (responseError) throw responseError

//         // Save answers
//         for (const question of questions) {
//           const answer = facultyResponses[question.id]
//           if (answer !== undefined && answer !== null && answer !== '') {
//             await supabase.from('answers').insert([{
//               response_id: responseData.id,
//               question_id: question.id,
//               answer: { value: answer }
//             }])
//           }
//         }
//       }

//       // Mark token as used
//       await supabase
//         .from('access_tokens')
//         .update({ is_used: true })
//         .eq('token', user.token)

//       alert('Feedback submitted successfully!')
//       logout()
//       router.push('/student/confirmation')
//     } catch (error) {
//       console.error('Error submitting feedback:', error)
//       alert('Failed to submit feedback')
//     } finally {
//       setSubmitting(false)
//     }
//   }

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="text-center">
//           <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
//           <p className="text-gray-600">Loading feedback form...</p>
//         </div>
//       </div>
//     )
//   }

//   if (faculty.length === 0) {
//     return (
//       <div className="min-h-screen flex items-center justify-center px-4">
//         <Card className="max-w-md text-center">
//           <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
//           <h2 className="text-xl font-bold text-gray-900 mb-2">No Faculty Found</h2>
//           <p className="text-gray-600">
//             There are no faculty members assigned to your department yet.
//           </p>
//         </Card>
//       </div>
//     )
//   }

//   if (questions.length === 0) {
//     return (
//       <div className="min-h-screen flex items-center justify-center px-4">
//         <Card className="max-w-md text-center">
//           <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
//           <h2 className="text-xl font-bold text-gray-900 mb-2">No Questions Available</h2>
//           <p className="text-gray-600">
//             Your college hasn't created feedback questions yet.
//           </p>
//         </Card>
//       </div>
//     )
//   }

//   const currentFaculty = faculty[currentFacultyIndex]
//   const progress = ((currentFacultyIndex + 1) / faculty.length) * 100

//   return (
//     <div className="min-h-screen bg-gray-50 py-8 px-4">
//       <div className="max-w-3xl mx-auto">
//         {/* Header */}
//         <div className="bg-white rounded-lg shadow-md p-6 mb-6">
//           <div className="flex justify-between items-center mb-4">
//             <div>
//               <h1 className="text-2xl font-bold text-gray-900">Faculty Feedback</h1>
//               <p className="text-gray-600">
//                 {user.name} • {user.departmentName}
//               </p>
//             </div>
//             <div className="text-right">
//               <p className="text-sm text-gray-600">Progress</p>
//               <p className="text-2xl font-bold text-green-600">
//                 {currentFacultyIndex + 1}/{faculty.length}
//               </p>
//             </div>
//           </div>

//           {/* Progress Bar */}
//           <div className="w-full bg-gray-200 rounded-full h-3">
//             <div
//               className="bg-green-600 h-3 rounded-full transition-all duration-300"
//               style={{ width: `${progress}%` }}
//             />
//           </div>
//         </div>

//         {/* Faculty Card */}
//         <Card className="mb-6">
//           <div className="flex items-center gap-4 mb-6">
//             <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
//               <span className="text-2xl font-bold text-blue-600">
//                 {currentFaculty.name.charAt(0)}
//               </span>
//             </div>
//             <div>
//               <h2 className="text-xl font-bold text-gray-900">{currentFaculty.name}</h2>
//               <p className="text-gray-600">{currentFaculty.subjects}</p>
//             </div>
//           </div>

//           {/* Questions */}
//           <div className="space-y-6">
//             {questions.map((question, index) => (
//               <div key={question.id} className="border-b pb-6 last:border-0">
//                 <label className="block text-gray-900 font-medium mb-3">
//                   {index + 1}. {question.text}
//                   {question.required && <span className="text-red-500 ml-1">*</span>}
//                 </label>

//                 {question.type === 'star_rating' && (
//                   <div className="flex gap-2">
//                     {[1, 2, 3, 4, 5].map(star => (
//                       <button
//                         key={star}
//                         type="button"
//                         onClick={() => handleAnswerChange(currentFaculty.id, question.id, star)}
//                         className="focus:outline-none"
//                       >
//                         <Star
//                           className={`w-8 h-8 transition-colors ${
//                             (responses[currentFaculty.id]?.[question.id] || 0) >= star
//                               ? 'fill-yellow-400 text-yellow-400'
//                               : 'text-gray-300'
//                           }`}
//                         />
//                       </button>
//                     ))}
//                   </div>
//                 )}

//                 {question.type === 'short_text' && (
//                   <input
//                     type="text"
//                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
//                     value={responses[currentFaculty.id]?.[question.id] || ''}
//                     onChange={(e) => handleAnswerChange(currentFaculty.id, question.id, e.target.value)}
//                   />
//                 )}

//                 {question.type === 'long_text' && (
//                   <textarea
//                     rows={4}
//                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
//                     value={responses[currentFaculty.id]?.[question.id] || ''}
//                     onChange={(e) => handleAnswerChange(currentFaculty.id, question.id, e.target.value)}
//                   />
//                 )}

//                 {question.type === 'multiple_choice' && question.options && (
//                   <div className="space-y-2">
//                     {question.options.map((option, i) => (
//                       <label key={i} className="flex items-center gap-2 cursor-pointer">
//                         <input
//                           type="radio"
//                           name={`question-${question.id}`}
//                           value={option}
//                           checked={responses[currentFaculty.id]?.[question.id] === option}
//                           onChange={(e) => handleAnswerChange(currentFaculty.id, question.id, e.target.value)}
//                           className="w-4 h-4"
//                         />
//                         <span>{option}</span>
//                       </label>
//                     ))}
//                   </div>
//                 )}

//                 {question.type === 'checkbox' && question.options && (
//                   <div className="space-y-2">
//                     {question.options.map((option, i) => (
//                       <label key={i} className="flex items-center gap-2 cursor-pointer">
//                         <input
//                           type="checkbox"
//                           value={option}
//                           checked={(responses[currentFaculty.id]?.[question.id] || []).includes(option)}
//                           onChange={(e) => {
//                             const current = responses[currentFaculty.id]?.[question.id] || []
//                             const updated = e.target.checked
//                               ? [...current, option]
//                               : current.filter(o => o !== option)
//                             handleAnswerChange(currentFaculty.id, question.id, updated)
//                           }}
//                           className="w-4 h-4 rounded"
//                         />
//                         <span>{option}</span>
//                       </label>
//                     ))}
//                   </div>
//                 )}

//                 {question.type === 'scale' && (
//                   <div>
//                     <input
//                       type="range"
//                       min="1"
//                       max="10"
//                       className="w-full"
//                       value={responses[currentFaculty.id]?.[question.id] || 5}
//                       onChange={(e) => handleAnswerChange(currentFaculty.id, question.id, e.target.value)}
//                     />
//                     <div className="flex justify-between text-sm text-gray-600 mt-1">
//                       <span>1</span>
//                       <span className="font-semibold text-green-600">
//                         {responses[currentFaculty.id]?.[question.id] || 5}
//                       </span>
//                       <span>10</span>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//         </Card>

//         {/* Navigation */}
//         <div className="flex justify-between">
//           <Button
//             variant="secondary"
//             disabled={currentFacultyIndex === 0}
//             onClick={handlePrevious}
//           >
//             ← Previous
//           </Button>
//           <Button
//             onClick={handleNext}
//             disabled={submitting}
//           >
//             {currentFacultyIndex === faculty.length - 1 ? (
//               submitting ? 'Submitting...' : 'Submit All Feedback ✓'
//             ) : (
//               <>
//                 Next Faculty
//                 <ChevronRight className="w-5 h-5 ml-2" />
//               </>
//             )}
//           </Button>
//         </div>
//       </div>
//     </div>
//   )
// }
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { supabase } from "../../../lib/supabase";
import { Star, ChevronRight, AlertCircle } from "lucide-react";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";

export default function StudentFeedbackPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [faculty, setFaculty] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [currentFacultyIndex, setCurrentFacultyIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "student") {
      router.push("/student/login");
      return;
    }
    fetchData();
  }, [user]);

  // Add null check for user
  if (!user) {
    return null;
  }

  async function fetchData() {
    try {
      const { data: facultyData, error: facultyError } = await supabase
        .from("faculty")
        .select(
          `
          *,
          faculty_departments!inner (
            department_id
          )
        `
        )
        .eq("faculty_departments.department_id", user.departmentId);

      if (facultyError) throw facultyError;

      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select("*")
        .order("order_index");

      if (questionsError) throw questionsError;

      setFaculty(facultyData || []);
      setQuestions(questionsData || []);

      const initialResponses = {};
      facultyData.forEach((f) => {
        initialResponses[f.id] = {};
      });
      setResponses(initialResponses);
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Failed to load feedback form");
    } finally {
      setLoading(false);
    }
  }

  function handleAnswerChange(facultyId, questionId, value) {
    setResponses((prev) => ({
      ...prev,
      [facultyId]: {
        ...prev[facultyId],
        [questionId]: value,
      },
    }));
  }

  function validateCurrentFaculty() {
    const currentFaculty = faculty[currentFacultyIndex];
    const facultyResponses = responses[currentFaculty.id] || {};

    for (const question of questions) {
      if (question.required && !facultyResponses[question.id]) {
        alert(`Please answer: ${question.text}`);
        return false;
      }
    }
    return true;
  }

  function handleNext() {
    if (!validateCurrentFaculty()) return;

    if (currentFacultyIndex < faculty.length - 1) {
      setCurrentFacultyIndex((prev) => prev + 1);
      window.scrollTo(0, 0);
    } else {
      handleSubmit();
    }
  }

  function handlePrevious() {
    if (currentFacultyIndex > 0) {
      setCurrentFacultyIndex((prev) => prev - 1);
      window.scrollTo(0, 0);
    }
  }

  async function handleSubmit() {
    if (
      !confirm(
        "Submit all feedback? You cannot change answers after submission."
      )
    )
      return;

    setSubmitting(true);
    try {
      for (const fac of faculty) {
        const facultyResponses = responses[fac.id];

        const { data: responseData, error: responseError } = await supabase
          .from("feedback_responses")
          .insert([
            {
              token: user.token,
              student_id: user.id,
              faculty_id: fac.id,
              session_id: null,
            },
          ])
          .select()
          .single();

        if (responseError) throw responseError;

        for (const question of questions) {
          const answer = facultyResponses[question.id];
          if (answer !== undefined && answer !== null && answer !== "") {
            await supabase.from("answers").insert([
              {
                response_id: responseData.id,
                question_id: question.id,
                answer: { value: answer },
              },
            ]);
          }
        }
      }

      await supabase
        .from("access_tokens")
        .update({ is_used: true })
        .eq("token", user.token);

      alert("Feedback submitted successfully!");
      logout();
      router.push("/student/confirmation");
    } catch (error) {
      console.error("Error submitting feedback:", error);
      alert("Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading feedback form...</p>
        </div>
      </div>
    );
  }

  if (faculty.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            No Faculty Found
          </h2>
          <p className="text-gray-600">
            There are no faculty members assigned to your department yet.
          </p>
        </Card>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            No Questions Available
          </h2>
          <p className="text-gray-600">
            Your college hasn&apos;t created feedback questions yet.
          </p>
        </Card>
      </div>
    );
  }

  const currentFaculty = faculty[currentFacultyIndex];
  const progress = ((currentFacultyIndex + 1) / faculty.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Faculty Feedback
              </h1>
              <p className="text-gray-600">
                {user?.name || "Student"} •{" "}
                {user?.departmentName || "Department"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Progress</p>
              <p className="text-2xl font-bold text-green-600">
                {currentFacultyIndex + 1}/{faculty.length}
              </p>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-green-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <Card className="mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-blue-600">
                {currentFaculty.name.charAt(0)}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {currentFaculty.name}
              </h2>
              <p className="text-gray-600">{currentFaculty.subjects}</p>
            </div>
          </div>

          <div className="space-y-6">
            {questions.map((question, index) => (
              <div key={question.id} className="border-b pb-6 last:border-0">
                <label className="block text-gray-900 font-medium mb-3">
                  {index + 1}. {question.text}
                  {question.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>

                {question.type === "star_rating" && (
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() =>
                          handleAnswerChange(
                            currentFaculty.id,
                            question.id,
                            star
                          )
                        }
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-8 h-8 transition-colors ${
                            (responses[currentFaculty.id]?.[question.id] ||
                              0) >= star
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                )}

                {question.type === "short_text" && (
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    value={responses[currentFaculty.id]?.[question.id] || ""}
                    onChange={(e) =>
                      handleAnswerChange(
                        currentFaculty.id,
                        question.id,
                        e.target.value
                      )
                    }
                  />
                )}

                {question.type === "long_text" && (
                  <textarea
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    value={responses[currentFaculty.id]?.[question.id] || ""}
                    onChange={(e) =>
                      handleAnswerChange(
                        currentFaculty.id,
                        question.id,
                        e.target.value
                      )
                    }
                  />
                )}

                {question.type === "multiple_choice" && question.options && (
                  <div className="space-y-2">
                    {question.options.map((option, i) => (
                      <label
                        key={i}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          value={option}
                          checked={
                            responses[currentFaculty.id]?.[question.id] ===
                            option
                          }
                          onChange={(e) =>
                            handleAnswerChange(
                              currentFaculty.id,
                              question.id,
                              e.target.value
                            )
                          }
                          className="w-4 h-4"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {question.type === "checkbox" && question.options && (
                  <div className="space-y-2">
                    {question.options.map((option, i) => (
                      <label
                        key={i}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          value={option}
                          checked={(
                            responses[currentFaculty.id]?.[question.id] || []
                          ).includes(option)}
                          onChange={(e) => {
                            const current =
                              responses[currentFaculty.id]?.[question.id] || [];
                            const updated = e.target.checked
                              ? [...current, option]
                              : current.filter((o) => o !== option);
                            handleAnswerChange(
                              currentFaculty.id,
                              question.id,
                              updated
                            );
                          }}
                          className="w-4 h-4 rounded"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {question.type === "scale" && (
                  <div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      className="w-full"
                      value={responses[currentFaculty.id]?.[question.id] || 5}
                      onChange={(e) =>
                        handleAnswerChange(
                          currentFaculty.id,
                          question.id,
                          e.target.value
                        )
                      }
                    />
                    <div className="flex justify-between text-sm text-gray-600 mt-1">
                      <span>1</span>
                      <span className="font-semibold text-green-600">
                        {responses[currentFaculty.id]?.[question.id] || 5}
                      </span>
                      <span>10</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        <div className="flex justify-between">
          <Button
            variant="secondary"
            disabled={currentFacultyIndex === 0}
            onClick={handlePrevious}
          >
            ← Previous
          </Button>
          <Button onClick={handleNext} disabled={submitting}>
            {currentFacultyIndex === faculty.length - 1 ? (
              submitting ? (
                "Submitting..."
              ) : (
                "Submit All Feedback ✓"
              )
            ) : (
              <>
                Next Faculty
                <ChevronRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
