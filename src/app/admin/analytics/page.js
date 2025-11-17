'use client'

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Users, Star, Download, Filter } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [questionnaires, setQuestionnaires] = useState([])
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState('')
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState({
    facultyRatings: [],
    totalResponses: 0,
    averageRating: 0,
    departmentStats: [],
    questionStats: []
  })

  useEffect(() => {
    fetchQuestionnaires()
  }, [user])

  useEffect(() => {
    if (selectedQuestionnaire) {
      fetchAnalytics()
    }
  }, [selectedQuestionnaire])

  async function fetchQuestionnaires() {
    try {
      const { data, error } = await supabase
        .from('questionnaires')
        .select('*')
        .eq('college_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setQuestionnaires(data || [])
      
      // Auto-select active questionnaire
      const active = data?.find(q => q.is_active)
      if (active) {
        setSelectedQuestionnaire(active.id)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchAnalytics() {
    try {
      const { data: responses, error } = await supabase
        .from('feedback_responses')
        .select(`
          *,
          faculty (id, name, subjects, faculty_departments(departments(name))),
          answers (
            question_id,
            answer,
            questions (type, text)
          )
        `)
        .eq('questionnaire_id', selectedQuestionnaire)

      if (error) throw error

      // Calculate faculty-wise ratings
      const facultyMap = {}
      
      responses?.forEach(response => {
        const facultyId = response.faculty.id
        if (!facultyMap[facultyId]) {
          facultyMap[facultyId] = {
            faculty: response.faculty,
            ratings: [],
            responseCount: 0,
            departments: response.faculty.faculty_departments.map(fd => fd.departments.name)
          }
        }
        
        facultyMap[facultyId].responseCount++
        
        // Extract star ratings
        response.answers?.forEach(answer => {
          if (answer.questions?.type === 'star_rating' && answer.answer?.value) {
            facultyMap[facultyId].ratings.push(Number(answer.answer.value))
          }
        })
      })

      // Calculate averages
      const facultyRatings = Object.values(facultyMap).map(item => ({
        name: item.faculty.name,
        subjects: item.faculty.subjects,
        departments: item.departments,
        averageRating: item.ratings.length > 0 
          ? (item.ratings.reduce((a, b) => a + b, 0) / item.ratings.length).toFixed(1)
          : 0,
        responseCount: item.responseCount,
        totalRatings: item.ratings.length
      }))

      // Calculate overall average
      const allRatings = Object.values(facultyMap).flatMap(f => f.ratings)
      const averageRating = allRatings.length > 0
        ? (allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1)
        : 0

      // Question-wise statistics
      const questionMap = {}
      responses?.forEach(response => {
        response.answers?.forEach(answer => {
          const qId = answer.question_id
          if (!questionMap[qId]) {
            questionMap[qId] = {
              question: answer.questions,
              ratings: [],
              textResponses: []
            }
          }
          
          if (answer.questions?.type === 'star_rating' && answer.answer?.value) {
            questionMap[qId].ratings.push(Number(answer.answer.value))
          } else if (['short_text', 'long_text'].includes(answer.questions?.type)) {
            questionMap[qId].textResponses.push(answer.answer?.value)
          }
        })
      })

      const questionStats = Object.values(questionMap).map(item => ({
        question: item.question?.text,
        type: item.question?.type,
        averageRating: item.ratings.length > 0
          ? (item.ratings.reduce((a, b) => a + b, 0) / item.ratings.length).toFixed(1)
          : null,
        responseCount: item.ratings.length + item.textResponses.length,
        textResponses: item.textResponses.slice(0, 5) // Show first 5
      }))

      setAnalytics({
        facultyRatings,
        totalResponses: responses?.length || 0,
        averageRating,
        questionStats
      })
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to load analytics')
    }
  }

  function exportCSV() {
    const csv = [
      'Faculty Name,Subjects,Departments,Average Rating,Response Count',
      ...analytics.facultyRatings.map(f => 
        `${f.name},${f.subjects},${f.departments.join('; ')},${f.averageRating},${f.responseCount}`
      )
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'analytics.csv'
    a.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading analytics...</div>
      </div>
    )
  }

  const activeQuestionnaire = questionnaires.find(q => q.id === selectedQuestionnaire)

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Faculty performance insights</p>
        </div>
        {analytics.facultyRatings.length > 0 && (
          <Button onClick={exportCSV}>
            <Download className="w-5 h-5 mr-2" />
            Export Report
          </Button>
        )}
      </div>

      {/* Questionnaire Selector */}
      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <label className="text-sm font-medium text-gray-700">
            Select Questionnaire:
          </label>
          <select
            value={selectedQuestionnaire}
            onChange={(e) => setSelectedQuestionnaire(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">-- Select Questionnaire --</option>
            {questionnaires.map(q => (
              <option key={q.id} value={q.id}>
                {q.name} {q.is_active ? '(Active)' : ''}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {!selectedQuestionnaire ? (
        <Card className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Questionnaire</h3>
          <p className="text-gray-600">
            Choose a questionnaire above to view analytics
          </p>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Responses</p>
                  <p className="text-3xl font-bold text-gray-900">{analytics.totalResponses}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Average Rating</p>
                  <p className="text-3xl font-bold text-gray-900">{analytics.averageRating}/5</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Faculty Members</p>
                  <p className="text-3xl font-bold text-gray-900">{analytics.facultyRatings.length}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* Faculty Performance Table */}
          {analytics.facultyRatings.length === 0 ? (
            <Card className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No data yet</h3>
              <p className="text-gray-600">
                Analytics will appear here once students submit feedback for {activeQuestionnaire?.name}
              </p>
            </Card>
          ) : (
            <>
              <Card className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Faculty Performance</h3>
                <div className="space-y-4">
                  {analytics.facultyRatings
                    .sort((a, b) => b.averageRating - a.averageRating)
                    .map((faculty, index) => (
                      <div key={index} className="border-b pb-4 last:border-0">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-gray-900">{faculty.name}</h4>
                              {index === 0 && faculty.averageRating >= 4.5 && (
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                                  ⭐ Top Rated
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{faculty.subjects}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {faculty.departments.map((dept, i) => (
                                <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                                  {dept}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className="flex items-center gap-2">
                              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                              <span className="text-2xl font-bold text-gray-900">
                                {faculty.averageRating}
                              </span>
                              <span className="text-gray-500">/5</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {faculty.responseCount} responses
                            </p>
                          </div>
                        </div>
                        
                        {/* Rating Bar */}
                        <div className="mt-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                faculty.averageRating >= 4.5 ? 'bg-green-500' :
                                faculty.averageRating >= 3.5 ? 'bg-blue-500' :
                                faculty.averageRating >= 2.5 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${(faculty.averageRating / 5) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </Card>

              {/* Question-wise Analysis */}
              {analytics.questionStats.length > 0 && (
                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Question-wise Analysis</h3>
                  <div className="space-y-4">
                    {analytics.questionStats.map((stat, index) => (
                      <div key={index} className="border-b pb-4 last:border-0">
                        <p className="font-medium text-gray-900 mb-2">{stat.question}</p>
                        {stat.averageRating && (
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-gray-900">{stat.averageRating}/5</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${(stat.averageRating / 5) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600">{stat.responseCount} responses</span>
                          </div>
                        )}
                        {stat.textResponses && stat.textResponses.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <p className="text-sm font-medium text-gray-700">Sample Responses:</p>
                            {stat.textResponses.map((response, i) => (
                              <p key={i} className="text-sm text-gray-600 italic pl-4">
                                "{response}"
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
