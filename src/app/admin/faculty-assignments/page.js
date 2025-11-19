'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, UserCheck, Filter } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import Modal from '../../../components/ui/Modal'
import Table from '../../../components/ui/Table'

export default function FacultyAssignmentsPage() {
  const { user } = useAuth()
  const [assignments, setAssignments] = useState([])
  const [faculty, setFaculty] = useState([])
  const [subjects, setSubjects] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState(null)
  const [filters, setFilters] = useState({
    department: '',
    semester: '',
    academicYear: ''
  })
  const [formData, setFormData] = useState({
    faculty_id: '',
    subject_id: '',
    department_id: '',
    academic_year: '',
    semester: '',
    is_active: true
  })

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  async function fetchData() {
    try {
      const [assignmentsData, facultyData, subjectsData, deptsData] = await Promise.all([
        supabase
          .from('faculty_subject_assignments')
          .select(`
            *,
            faculty (id, name, email),
            subjects (id, code, name),
            departments (id, name)
          `)
          .eq('faculty.college_id', user.id)
          .order('created_at', { ascending: false }),
        supabase.from('faculty').select('*').eq('college_id', user.id),
        supabase.from('subjects').select('*').eq('college_id', user.id),
        supabase.from('departments').select('*').eq('college_id', user.id)
      ])

      setAssignments(assignmentsData.data || [])
      setFaculty(facultyData.data || [])
      setSubjects(subjectsData.data || [])
      setDepartments(deptsData.data || [])

      // Set default academic year to current
      const currentYear = new Date().getFullYear()
      setFormData(prev => ({
        ...prev,
        academic_year: `${currentYear}-${currentYear + 1}`
      }))
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    try {
      if (editingAssignment) {
        await supabase
          .from('faculty_subject_assignments')
          .update(formData)
          .eq('id', editingAssignment.id)
        alert('Assignment updated!')
      } else {
        // Check for duplicate
        const { data: existing } = await supabase
          .from('faculty_subject_assignments')
          .select('id')
          .eq('faculty_id', formData.faculty_id)
          .eq('subject_id', formData.subject_id)
          .eq('department_id', formData.department_id)
          .eq('academic_year', formData.academic_year)
          .eq('semester', formData.semester)
          .single()

        if (existing) {
          alert('This assignment already exists!')
          return
        }

        await supabase
          .from('faculty_subject_assignments')
          .insert([formData])
        alert('Assignment added!')
      }

      setShowModal(false)
      setEditingAssignment(null)
      resetForm()
      fetchData()
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to save assignment')
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this assignment?')) return

    try {
      await supabase.from('faculty_subject_assignments').delete().eq('id', id)
      alert('Assignment deleted!')
      fetchData()
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to delete assignment')
    }
  }

  async function toggleActive(id, currentStatus) {
    try {
      await supabase
        .from('faculty_subject_assignments')
        .update({ is_active: !currentStatus })
        .eq('id', id)
      fetchData()
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to update status')
    }
  }

  function openModal(assignment = null) {
    if (assignment) {
      setEditingAssignment(assignment)
      setFormData({
        faculty_id: assignment.faculty_id,
        subject_id: assignment.subject_id,
        department_id: assignment.department_id,
        academic_year: assignment.academic_year,
        semester: assignment.semester,
        is_active: assignment.is_active
      })
    } else {
      resetForm()
    }
    setShowModal(true)
  }

  function resetForm() {
    const currentYear = new Date().getFullYear()
    setFormData({
      faculty_id: '',
      subject_id: '',
      department_id: '',
      academic_year: `${currentYear}-${currentYear + 1}`,
      semester: '',
      is_active: true
    })
    setEditingAssignment(null)
  }

  // Apply filters
  const filteredAssignments = assignments.filter(assignment => {
    if (filters.department && assignment.department_id !== filters.department) return false
    if (filters.semester && assignment.semester?.toString() !== filters.semester) return false
    if (filters.academicYear && assignment.academic_year !== filters.academicYear) return false
    return true
  })

  // Get unique academic years for filter
  const academicYears = [...new Set(assignments.map(a => a.academic_year))].filter(Boolean)

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Faculty Subject Assignments</h1>
          <p className="text-gray-600 mt-1">Assign subjects to faculty members (semester-wise)</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="w-5 h-5 mr-2" />
          New Assignment
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Filters</h3>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <select
            value={filters.department}
            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>

          <select
            value={filters.semester}
            onChange={(e) => setFilters({ ...filters, semester: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
              <option key={sem} value={sem}>Semester {sem}</option>
            ))}
          </select>

          <select
            value={filters.academicYear}
            onChange={(e) => setFilters({ ...filters, academicYear: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Academic Years</option>
            {academicYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </Card>

      {filteredAssignments.length === 0 ? (
        <Card className="text-center py-12">
          <UserCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No assignments yet</h3>
          <p className="text-gray-600 mb-4">Start by assigning subjects to faculty</p>
          <Button onClick={() => openModal()}>Create Assignment</Button>
        </Card>
      ) : (
        <Card>
          <Table
            headers={['Faculty', 'Subject', 'Department', 'Academic Year', 'Sem', 'Status', 'Actions']}
            data={filteredAssignments}
            renderRow={(assignment) => (
              <>
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium text-gray-900">{assignment.faculty.name}</div>
                    <div className="text-sm text-gray-500">{assignment.faculty.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <div className="font-mono text-sm font-medium text-blue-600">
                      {assignment.subjects.code}
                    </div>
                    <div className="text-sm text-gray-600">{assignment.subjects.name}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    {assignment.departments.name}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">{assignment.academic_year}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                    {assignment.semester}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => toggleActive(assignment.id, assignment.is_active)}
                    className={`px-3 py-1 text-xs rounded-full font-medium ${
                      assignment.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {assignment.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openModal(assignment)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(assignment.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </>
            )}
          />
        </Card>
      )}

      {showModal && (
        <Modal
          title={editingAssignment ? 'Edit Assignment' : 'New Assignment'}
          onClose={() => setShowModal(false)}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Faculty Member *
              </label>
              <select
                value={formData.faculty_id}
                onChange={(e) => setFormData({ ...formData, faculty_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Select Faculty</option>
                {faculty.map(fac => (
                  <option key={fac.id} value={fac.id}>
                    {fac.name} ({fac.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject *
              </label>
              <select
                value={formData.subject_id}
                onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Select Subject</option>
                {subjects.map(sub => (
                  <option key={sub.id} value={sub.id}>
                    {sub.code} - {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department *
              </label>
              <select
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Academic Year *
                </label>
                <input
                  type="text"
                  value={formData.academic_year}
                  onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                  placeholder="2024-25"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Semester *
                </label>
                <select
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">Select</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                    <option key={sem} value={sem}>Semester {sem}</option>
                  ))}
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Active Assignment</span>
            </label>

            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingAssignment ? 'Update' : 'Create'} Assignment
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}