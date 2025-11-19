"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";
import { CheckCircle, BookOpen, User, Building2 } from "lucide-react";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";

export default function StudentFeedbackPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [questionnaire, setQuestionnaire] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submittedAssignments, setSubmittedAssignments] = useState([]);
  const [allCompleted, setAllCompleted] = useState(false);

  useEffect(() => {
    if (user) {
      fetchFeedbackData();
    }
  }, [user]);

  async function fetchFeedbackData() {
    try {
      // Get token info with questionnaire
      const { data: tokenData, error: tokenError } = await supabase
        .from("access_tokens")
        .select(
          `
          *,
          questionnaires (
            id,
            name,
            description,
            is_active
          )
        `
        )
        .eq("token", user.token)
        .single();

      if (tokenError) throw tokenError;

      if (!tokenData.questionnaires.is_active) {
        alert("This questionnaire is no longer active");
        return;
      }

      setQuestionnaire(tokenData.questionnaires);

      // Get questions for this questionnaire
      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select("*")
        .eq("questionnaire_id", tokenData.questionnaire_id)
        .order("order_index", { ascending: true });

      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);

      // Get active faculty-subject assignments for student's department
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("faculty_subject_assignments")
        .select(
          `
          id,
          faculty_id,
          subject_id,
          department_id,
          academic_year,
          semester,
          faculty (
            id,
            name,
            email
          ),
          subjects (
            id,
            code,
            name
          ),
          departments (
            id,
            name
          )
        `
        )
        .eq("department_id", user.departmentId)
        .eq("is_active", true);

      if (assignmentsError) throw assignmentsError;
      setAssignments(assignmentsData || []);

      // Check which assignments already have feedback
      const { data: responsesData, error: responsesError } = await supabase
        .from("feedback_responses")
        .select("faculty_subject_assignment_id")
        .eq("student_id", user.id)
        .eq("questionnaire_id", tokenData.questionnaire_id);

      if (responsesError) throw responsesError;

      const submitted = responsesData.map(
        (r) => r.faculty_subject_assignment_id
      );
      setSubmittedAssignments(submitted);

      // Check if all completed
      if (
        assignmentsData.length > 0 &&
        submitted.length === assignmentsData.length
      ) {
        setAllCompleted(true);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to load feedback form");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitFeedback() {
    if (!currentAssignment) return;

    // Validate all required questions
    const unanswered = questions
      .filter((q) => q.required)
      .find((q) => !answers[q.id] || answers[q.id] === "");

    if (unanswered) {
      alert("Please answer all required questions");
      return;
    }

    try {
      // Create feedback response
      const { data: responseData, error: responseError } = await supabase
        .from("feedback_responses")
        .insert([
          {
            token: user.token,
            student_id: user.id,
            faculty_subject_assignment_id: currentAssignment.id,
            questionnaire_id: questionnaire.id,
            subject_id: currentAssignment.subject_id,
            feedback_type: "student_to_faculty",
            responder_type: "student",
            responder_id: user.id,
            department_id: user.departmentId,
            is_anonymous: false,
          },
        ])
        .select()
        .single();

      if (responseError) throw responseError;

      // Save answers
      const answerInserts = questions.map((question) => ({
        response_id: responseData.id,
        question_id: question.id,
        answer: answers[question.id] || null,
      }));

      const { error: answersError } = await supabase
        .from("answers")
        .insert(answerInserts);

      if (answersError) throw answersError;

      // Mark token as used if this is the last assignment
      const newSubmittedCount = submittedAssignments.length + 1;
      if (newSubmittedCount === assignments.length) {
        await supabase
          .from("access_tokens")
          .update({ is_used: true })
          .eq("token", user.token);

        setAllCompleted(true);
      }

      // Update state
      setSubmittedAssignments([...submittedAssignments, currentAssignment.id]);
      setCurrentAssignment(null);
      setAnswers({});

      alert("Feedback submitted successfully!");
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to submit feedback: " + error.message);
    }
  }

  function renderQuestionInput(question) {
    const value = answers[question.id] || "";

    switch (question.type) {
      case "rating":
        return (
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                onClick={() =>
                  setAnswers({ ...answers, [question.id]: rating })
                }
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  value === rating
                    ? "border-blue-600 bg-blue-50 text-blue-600 font-semibold"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                {rating}
              </button>
            ))}
          </div>
        );

      case "text":
        return (
          <textarea
            value={value}
            onChange={(e) =>
              setAnswers({ ...answers, [question.id]: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[100px]"
            placeholder="Enter your feedback..."
          />
        );

      case "multiple_choice":
        const options = question.options || [];
        return (
          <div className="space-y-2">
            {options.map((option, idx) => (
              <label
                key={idx}
                className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) =>
                    setAnswers({ ...answers, [question.id]: e.target.value })
                  }
                  className="w-4 h-4"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) =>
              setAnswers({ ...answers, [question.id]: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        );
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading feedback form...</p>
        </div>
      </div>
    );
  }

  if (allCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            All Feedback Submitted!
          </h2>
          <p className="text-gray-600 mb-6">
            Thank you for completing all feedback forms for{" "}
            {questionnaire?.name}
          </p>
          <Button onClick={() => router.push("/student/confirmation")}>
            View Confirmation
          </Button>
        </Card>
      </div>
    );
  }

  if (currentAssignment) {
    const progress = submittedAssignments.length;
    const total = assignments.length;

    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Progress Bar */}
          <Card className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Progress: {progress + 1} of {total}
              </span>
              <span className="text-sm text-gray-600">
                {Math.round(((progress + 1) / total) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${((progress + 1) / total) * 100}%` }}
              />
            </div>
          </Card>

          {/* Faculty-Subject Header */}
          <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-600 rounded-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  {currentAssignment.faculty.name}
                </h2>
                <div className="flex flex-wrap gap-3 text-sm">
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span className="font-mono font-medium text-blue-600">
                      {currentAssignment.subjects.code}
                    </span>
                    <span className="text-gray-600">
                      - {currentAssignment.subjects.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Building2 className="w-4 h-4 text-purple-600" />
                    <span className="text-gray-600">
                      {currentAssignment.departments.name}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {currentAssignment.academic_year} • Semester{" "}
                  {currentAssignment.semester}
                </p>
              </div>
            </div>
          </Card>

          {/* Questions */}
          <Card className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              {questionnaire?.name}
            </h3>
            <div className="space-y-6">
              {questions.map((question, idx) => (
                <div
                  key={question.id}
                  className="pb-6 border-b last:border-b-0"
                >
                  <label className="block mb-3">
                    <span className="text-gray-900 font-medium">
                      {idx + 1}. {question.text}
                      {question.required && (
                        <span className="text-red-600 ml-1">*</span>
                      )}
                    </span>
                  </label>
                  {renderQuestionInput(question)}
                </div>
              ))}
            </div>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setCurrentAssignment(null);
                setAnswers({});
              }}
              className="flex-1"
            >
              Back to List
            </Button>
            <Button onClick={handleSubmitFeedback} className="flex-1">
              Submit Feedback
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Faculty-Subject List View
  const pendingAssignments = assignments.filter(
    (a) => !submittedAssignments.includes(a.id)
  );
  const completedAssignments = assignments.filter((a) =>
    submittedAssignments.includes(a.id)
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {questionnaire?.name}
          </h1>
          <p className="text-gray-600">{questionnaire?.description}</p>
          <div className="mt-4 flex items-center gap-4">
            <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {user.departmentName}
            </div>
            <span className="text-sm text-gray-600">
              {submittedAssignments.length} of {assignments.length} completed
            </span>
          </div>
        </div>

        {/* Progress Overview */}
        <Card className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-900">Overall Progress</h3>
            <span className="text-2xl font-bold text-blue-600">
              {Math.round(
                (submittedAssignments.length / assignments.length) * 100
              )}
              %
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all"
              style={{
                width: `${
                  (submittedAssignments.length / assignments.length) * 100
                }%`,
              }}
            />
          </div>
        </Card>

        {/* Pending Assignments */}
        {pendingAssignments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Pending Feedback ({pendingAssignments.length})
            </h2>
            <div className="space-y-3">
              {pendingAssignments.map((assignment) => (
                <Card
                  key={assignment.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-blue-200"
                  onClick={() => setCurrentAssignment(assignment)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {assignment.faculty.name}
                      </h3>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded font-mono">
                          {assignment.subjects.code}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                          {assignment.subjects.name}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {assignment.departments.name} • Semester{" "}
                        {assignment.semester}
                      </p>
                    </div>
                    <Button size="sm">Start →</Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Completed Assignments */}
        {completedAssignments.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Completed Feedback ({completedAssignments.length})
            </h2>
            <div className="space-y-3">
              {completedAssignments.map((assignment) => (
                <Card
                  key={assignment.id}
                  className="bg-green-50 border-2 border-green-200"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {assignment.faculty.name}
                      </h3>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded font-mono">
                          {assignment.subjects.code}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                          {assignment.subjects.name}
                        </span>
                      </div>
                    </div>
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
