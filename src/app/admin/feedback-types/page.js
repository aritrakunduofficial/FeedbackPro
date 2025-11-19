"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Users, Globe, Settings, Plus } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../context/AuthContext";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import Modal from "../../../components/ui/Modal";

export default function FeedbackTypesPage() {
  const { user } = useAuth();
  const [feedbackTypes, setFeedbackTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState(null);

  useEffect(() => {
    if (user) {
      fetchFeedbackTypes();
    }
  }, [user]);

  async function fetchFeedbackTypes() {
    try {
      const { data, error } = await supabase
        .from("feedback_types")
        .select("*")
        .eq("college_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // If no types exist, create defaults
      if (!data || data.length === 0) {
        await createDefaultTypes();
        fetchFeedbackTypes();
        return;
      }

      setFeedbackTypes(data || []);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to load feedback types");
    } finally {
      setLoading(false);
    }
  }

  async function createDefaultTypes() {
    try {
      const defaultTypes = [
        {
          college_id: user.id,
          name: "student_to_faculty",
          display_name: "Student Feedback on Faculty",
          description:
            "Students evaluate faculty teaching performance for subjects",
          is_anonymous: false,
          requires_authentication: true,
          is_active: true,
        },
        {
          college_id: user.id,
          name: "faculty_to_faculty",
          display_name: "Faculty Peer Review",
          description: "Faculty members evaluate other faculty colleagues",
          is_anonymous: true,
          requires_authentication: true,
          is_active: false,
        },
        {
          college_id: user.id,
          name: "general_feedback",
          display_name: "General Feedback",
          description:
            "Open feedback about college infrastructure, administration, and services",
          is_anonymous: true,
          requires_authentication: false,
          is_active: false,
        },
      ];

      const { error } = await supabase
        .from("feedback_types")
        .insert(defaultTypes);

      if (error) throw error;
    } catch (error) {
      console.error("Error creating default types:", error);
    }
  }

  async function toggleActive(id, currentStatus) {
    try {
      const { error } = await supabase
        .from("feedback_types")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      fetchFeedbackTypes();
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to update status");
    }
  }

  async function toggleAnonymous(id, currentStatus) {
    try {
      const { error } = await supabase
        .from("feedback_types")
        .update({ is_anonymous: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      fetchFeedbackTypes();
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to update anonymity setting");
    }
  }

  async function updateDescription(id, description) {
    try {
      const { error } = await supabase
        .from("feedback_types")
        .update({ description })
        .eq("id", id);

      if (error) throw error;
      alert("Description updated!");
      fetchFeedbackTypes();
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to update description");
    }
  }

  const getIcon = (name) => {
    switch (name) {
      case "student_to_faculty":
        return MessageSquare;
      case "faculty_to_faculty":
        return Users;
      case "general_feedback":
        return Globe;
      default:
        return Settings;
    }
  };

  const getColor = (name) => {
    switch (name) {
      case "student_to_faculty":
        return "blue";
      case "faculty_to_faculty":
        return "purple";
      case "general_feedback":
        return "green";
      default:
        return "gray";
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Feedback Types</h1>
        <p className="text-gray-600 mt-1">
          Configure different types of feedback collection
        </p>
      </div>

      {/* Info Banner */}
      <Card className="mb-6 bg-blue-50 border-2 border-blue-200">
        <div className="flex gap-3">
          <Settings className="w-6 h-6 text-blue-600 flex-shrink-0" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-2">Three Types of Feedback:</p>
            <ul className="space-y-1">
              <li>
                <strong>Student → Faculty:</strong> Students evaluate teaching
                performance (subject-wise)
              </li>
              <li>
                <strong>Faculty → Faculty:</strong> Peer review system where
                faculty evaluate colleagues
              </li>
              <li>
                <strong>General Feedback:</strong> Open public feedback about
                college facilities and administration
              </li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Feedback Types Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {feedbackTypes.map((type) => {
          const Icon = getIcon(type.name);
          const color = getColor(type.name);

          const colorClasses = {
            blue: {
              bg: "bg-blue-100",
              text: "text-blue-600",
              border: "border-blue-200",
              active: "bg-blue-600",
            },
            purple: {
              bg: "bg-purple-100",
              text: "text-purple-600",
              border: "border-purple-200",
              active: "bg-purple-600",
            },
            green: {
              bg: "bg-green-100",
              text: "text-green-600",
              border: "border-green-200",
              active: "bg-green-600",
            },
          };

          const colors = colorClasses[color];

          return (
            <Card
              key={type.id}
              className={`border-2 ${colors.border} ${
                !type.is_active && "opacity-60"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${colors.bg}`}>
                  <Icon className={`w-6 h-6 ${colors.text}`} />
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={type.is_active}
                    onChange={() => toggleActive(type.id, type.is_active)}
                    className="sr-only peer"
                  />
                  <div
                    className={`w-11 h-6 ${colors.bg} peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:${colors.active}`}
                  ></div>
                </label>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {type.display_name}
              </h3>

              <p className="text-sm text-gray-600 mb-4">{type.description}</p>

              <div className="space-y-3 pt-3 border-t border-gray-200">
                {/* Anonymous Toggle */}
                {type.name !== "student_to_faculty" && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Anonymous</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={type.is_anonymous}
                        onChange={() =>
                          toggleAnonymous(type.id, type.is_anonymous)
                        }
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>
                )}

                {/* Authentication Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Authentication</span>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      type.requires_authentication
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {type.requires_authentication ? "Required" : "Public"}
                  </span>
                </div>

                {/* Usage Info */}
                {type.name === "student_to_faculty" && (
                  <div className="text-xs text-gray-500 mt-2">
                    ✓ Currently active (subject-wise)
                  </div>
                )}

                {type.name === "faculty_to_faculty" && !type.is_active && (
                  <div className="text-xs text-orange-600 mt-2">
                    Enable to allow peer reviews
                  </div>
                )}

                {type.name === "general_feedback" && !type.is_active && (
                  <div className="text-xs text-orange-600 mt-2">
                    Enable for public feedback form
                  </div>
                )}
              </div>

              {/* Edit Description */}
              <div className="mt-4 pt-3 border-t border-gray-200">
                <textarea
                  value={type.description}
                  onChange={(e) => {
                    const updated = feedbackTypes.map((t) =>
                      t.id === type.id
                        ? { ...t, description: e.target.value }
                        : t
                    );
                    setFeedbackTypes(updated);
                  }}
                  onBlur={(e) => updateDescription(type.id, e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                  rows="2"
                />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-2 gap-6 mt-8">
        {/* Student to Faculty */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Student → Faculty Feedback
          </h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>✓ Subject-wise evaluation</p>
            <p>✓ Token-based access</p>
            <p>✓ Multiple forms per token</p>
            <p>✓ Progress tracking</p>
            <p>✓ Analytics dashboard</p>
          </div>
          <div className="mt-4 pt-3 border-t">
            <p className="text-xs text-gray-500">
              Status:{" "}
              <span className="text-green-600 font-medium">
                Active & Implemented
              </span>
            </p>
          </div>
        </Card>

        {/* Faculty to Faculty */}
        <Card className="border-2 border-purple-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Faculty → Faculty Peer Review
          </h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• Admin assigns reviewers</p>
            <p>• Anonymous option available</p>
            <p>• Department-specific or cross-department</p>
            <p>• Custom questionnaires</p>
            <p>• Confidential results</p>
          </div>
          <div className="mt-4 pt-3 border-t">
            {feedbackTypes.find((t) => t.name === "faculty_to_faculty")
              ?.is_active ? (
              <Button size="sm" variant="outline">
                Configure Peer Reviews
              </Button>
            ) : (
              <p className="text-xs text-orange-600">
                Enable above to activate peer review system
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* General Feedback Card */}
      <Card className="mt-6 border-2 border-green-200">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-green-100 rounded-lg">
            <Globe className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              General Public Feedback
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Allow anyone to submit feedback about college infrastructure,
              administration, facilities, and services without requiring login.
            </p>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-700 mb-2">Features:</p>
                <ul className="space-y-1 text-gray-600">
                  <li>• No authentication required</li>
                  <li>• Optional email for responses</li>
                  <li>• Category-based (Infrastructure, Admin, etc.)</li>
                  <li>• Admin can view and respond</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-700 mb-2">Use Cases:</p>
                <ul className="space-y-1 text-gray-600">
                  <li>• Facility complaints</li>
                  <li>• Suggestions for improvement</li>
                  <li>• Event feedback</li>
                  <li>• General concerns</li>
                </ul>
              </div>
            </div>
            <div className="mt-4">
              {feedbackTypes.find((t) => t.name === "general_feedback")
                ?.is_active ? (
                <div className="flex gap-3">
                  <Button size="sm">View Public Form</Button>
                  <Button size="sm" variant="outline">
                    Manage Responses
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-orange-600">
                  Enable General Feedback above to activate public feedback form
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Implementation Status */}
      <Card className="mt-6 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Implementation Status
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">Student → Faculty</span>
            </div>
            <span className="text-sm text-green-600 font-medium">
              Fully Implemented
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm font-medium">Faculty → Faculty</span>
            </div>
            <span className="text-sm text-yellow-600 font-medium">
              Available (Configure to use)
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm font-medium">General Feedback</span>
            </div>
            <span className="text-sm text-yellow-600 font-medium">
              Available (Enable to use)
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
