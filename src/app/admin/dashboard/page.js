'use client'

import { useState, useEffect } from 'react'
import { Users, GraduationCap, FileText, Building2, TrendingUp } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'
import Card from '../../../components/ui/Card'

export default function DashboardPage() {
  const { user } = useAuth()
  const [questionnaires, setQuestionnaires] = useState([])
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState('')
  const [stats, setStats] = useState({
    departments: 0,
    faculty: 0,
    students: 0,
    responses: 0,
    tokensUsed: 0,
    tokensTotal: 0,
    departmentStats: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQuestionnaires()
  }, [user])

  useEffect(() => {
    if (user) {
      fetchStats()
    }
  }, [user, selectedQuestionnaire])

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
    }
  }

  async function fetchStats() {
    try {
      const [depts, fac, stud, tokens] = await Promise.all([
        supabase.from('departments').select('id, name', { count: 'exact' }).eq('college_id', user.id),
        supabase.from('faculty').select('id', { count: 'exact' }).eq('college_id', user.id),
        supabase.from('students').select('id', { count: 'exact' }).eq('college_id', user.id),
        supabase.from('access_tokens').select('is_used, department_id, departments(name)', { count: 'exact' })
          .eq('college_id', user.id)
          .eq('questionnaire_id', selectedQuestionnaire || null)
      ])

      const tokensUsedCount = tokens.data?.filter(t => t.is_used).length || 0

      // Department-wise stats
      const deptMap = {}
      tokens.data?.forEach(token => {
        const deptName = token.departments?.name || 'Unknown'
        if (!deptMap[deptName]) {
          deptMap[deptName] = { total: 0, used: 0 }
        }
        deptMap[deptName].total++
        if (token.is_used) deptMap[deptName].used++
      })

      const departmentStats = Object.entries(deptMap).map(([name, data]) => ({
        name,
        total: data.total,
        used: data.used,
        percentage: data.total > 0 ? Math.round((data.used / data.total) * 100) : 0
      }))

      setStats({
        departments: depts.count || 0,
        faculty: fac.count || 0,
        students: stud.count || 0,
        responses: tokensUsedCount,
        tokensUsed: tokensUsedCount,
        tokensTotal: tokens.count || 0,
        departmentStats
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Departments',
      value: stats.departments,
      icon: Building2,
      color: 'blue'
    },
    {
      title: 'Faculty Members',
      value: stats.faculty,
      icon: Users,
      color: 'green'
    },
    {
      title: 'Students',
      value: stats.students,
      icon: GraduationCap,
      color: 'purple'
    },
    {
      title: 'Responses',
      value: `${stats.responses}/${stats.tokensTotal}`,
      icon: FileText,
      color: 'orange'
    }
  ]

  const responseRate = stats.tokensTotal > 0 
    ? Math.round((stats.tokensUsed / stats.tokensTotal) * 100) 
    : 0

  function getProgressColor(percentage) {
    if (percentage < 30) return 'bg-gradient-to-r from-red-500 to-red-600'
    if (percentage < 60) return 'bg-gradient-to-r from-yellow-500 to-yellow-600'
    if (percentage < 90) return 'bg-gradient-to-r from-blue-500 to-blue-600'
    return 'bg-gradient-to-r from-green-500 to-green-600'
  }

  function getDepartmentColor(percentage) {
    if (percentage < 30) return 'text-red-600'
    if (percentage < 60) return 'text-yellow-600'
    if (percentage < 90) return 'text-blue-600'
    return 'text-green-600'
  }

  if (loading) {
    return <div>Loading dashboard...</div>
  }

  const activeQuestionnaire = questionnaires.find(q => q.id === selectedQuestionnaire)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, {user?.name}</p>
      </div>

      {/* Questionnaire Selector */}
      {questionnaires.length > 0 && (
        <Card className="mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">
              Active Questionnaire:
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
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon
          const colorClasses = {
            blue: 'bg-blue-100 text-blue-600',
            green: 'bg-green-100 text-green-600',
            purple: 'bg-purple-100 text-purple-600',
            orange: 'bg-orange-100 text-orange-600'
          }

          return (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${colorClasses[stat.color]}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Response Rate Card */}
      {selectedQuestionnaire && (
        <Card className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Feedback Response Rate</h3>
              <p className="text-sm text-gray-600">
                {activeQuestionnaire?.name || 'Current Questionnaire'}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-3xl font-bold ${
                responseRate < 30 ? 'text-red-600' :
                responseRate < 60 ? 'text-yellow-600' :
                responseRate < 90 ? 'text-blue-600' : 'text-green-600'
              }`}>
                {responseRate}%
              </p>
              <p className="text-sm text-gray-600">Response Rate</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Overall Progress</span>
                <span className="text-sm font-semibold text-gray-900">
                  {stats.tokensUsed} / {stats.tokensTotal} submitted
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-4 rounded-full transition-all duration-500 ${getProgressColor(responseRate)}`}
                  style={{ width: `${responseRate}%` }}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-gray-600">Tokens Generated</p>
                <p className="text-2xl font-bold text-gray-900">{stats.tokensTotal}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Feedback Submitted</p>
                <p className="text-2xl font-bold text-green-600">{stats.tokensUsed}</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Department-wise Progress */}
      {stats.departmentStats.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Department-wise Response Rate
          </h3>
          <div className="space-y-4">
            {stats.departmentStats.map((dept, index) => (
              <div key={index}>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{dept.name}</span>
                  <span className={`text-sm font-semibold ${getDepartmentColor(dept.percentage)}`}>
                    {dept.used}/{dept.total} ({dept.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      dept.percentage < 30 ? 'bg-red-500' :
                      dept.percentage < 60 ? 'bg-yellow-500' :
                      dept.percentage < 90 ? 'bg-blue-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${dept.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/admin/questionnaires'}>
            <TrendingUp className="w-8 h-8 text-purple-600 mb-3" />
            <h4 className="font-semibold text-gray-900 mb-2">Create Questionnaire</h4>
            <p className="text-sm text-gray-600">Start a new feedback cycle</p>
          </Card>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/admin/students'}>
            <GraduationCap className="w-8 h-8 text-green-600 mb-3" />
            <h4 className="font-semibold text-gray-900 mb-2">Manage Students</h4>
            <p className="text-sm text-gray-600">Import or add students</p>
          </Card>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/admin/tokens'}>
            <FileText className="w-8 h-8 text-blue-600 mb-3" />
            <h4 className="font-semibold text-gray-900 mb-2">Generate Tokens</h4>
            <p className="text-sm text-gray-600">Create access tokens</p>
          </Card>
        </div>
      </div>
    </div>
  )
}
