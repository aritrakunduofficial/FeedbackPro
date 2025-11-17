'use client'

import { useState, useEffect } from 'react'
import { Plus, Upload, Download, Edit, Trash2, Search } from 'lucide-react'
import Papa from 'papaparse'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import Card from '../../../components/ui/Card'
import Modal from '../../../components/ui/Modal'
import Table from '../../../components/ui/Table'

export default function StudentsPage() {
  const { user } = useAuth()
  const [students, setStudents] = useState([])
  const [filteredStudents, setFilteredStudents] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [formData, setFormData] = useState({
    rollNo: '',
    name: '',
    email: '',
    departmentId: ''
  })

  useEffect(() => {
    fetchData()
  }, [user])

  useEffect(() => {
    filterStudents()
  }, [students, searchTerm, selectedDepartment])

  async function fetchData() {
    try {
      const [studentsData, deptsData] = await Promise.all([
        supabase
          .from('students')
          .select(`
            *,
            departments (name)
          `)
          .eq('college_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('departments')
          .select('*')
          .eq('college_id', user.id)
      ])

      setStudents(studentsData.data || [])
      setDepartments(deptsData.data || [])
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  function filterStudents() {
    let filtered = students

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.roll_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Department filter
    if (selectedDepartment) {
      filtered = filtered.filter(s => s.department_id === selectedDepartment)
    }

    setFilteredStudents(filtered)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    try {
      if (editingStudent) {
        await supabase
          .from('students')
          .update({
            roll_no: formData.rollNo,
            name: formData.name,
            email: formData.email,
            department_id: formData.departmentId
          })
          .eq('id', editingStudent.id)
        alert('Student updated!')
      } else {
        await supabase
          .from('students')
          .insert([{
            college_id: user.id,
            roll_no: formData.rollNo,
            name: formData.name,
            email: formData.email,
            department_id: formData.departmentId
          }])
        alert('Student added!')
      }

      setShowModal(false)
      setEditingStudent(null)
      setFormData({ rollNo: '', name: '', email: '', departmentId: '' })
      fetchData()
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to save student')
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this student?')) return

    try {
      await supabase.from('students').delete().eq('id', id)
      alert('Student deleted!')
      fetchData()
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to delete student')
    }
  }

  function handleCSVUpload(e) {
    const file = e.target.files[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        try {
          const studentsToInsert = results.data
            .filter(row => row.RollNo && row.Name && row.Email)
            .map(row => ({
              college_id: user.id,
              roll_no: row.RollNo.trim(),
              name: row.Name.trim(),
              email: row.Email.trim(),
              department_id: departments.find(d => 
                d.name.toLowerCase() === row.Department?.toLowerCase()
              )?.id
            }))
            .filter(s => s.department_id)

          const { error } = await supabase
            .from('students')
            .insert(studentsToInsert)

          if (error) throw error

          alert(`${studentsToInsert.length} students imported!`)
          setShowUploadModal(false)
          fetchData()
        } catch (error) {
          console.error('Import error:', error)
          alert('Failed to import students')
        }
      }
    })
  }

  function downloadCSVTemplate() {
    const template = `RollNo,Name,Email,Department
BBA2024001,John Doe,john@example.com,${departments[0]?.name || 'BBA'}
BCA2024001,Jane Smith,jane@example.com,${departments[1]?.name || 'BCA'}`
    
    const blob = new Blob([template], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'students_template.csv'
    a.click()
  }

  function exportStudents() {
    const csv = [
      'Roll No,Name,Email,Department',
      ...filteredStudents.map(s => 
        `${s.roll_no},${s.name},${s.email},${s.departments?.name || ''}`
      )
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'students.csv'
    a.click()
  }

  function openModal(student = null) {
    if (student) {
      setEditingStudent(student)
      setFormData({
        rollNo: student.roll_no,
        name: student.name,
        email: student.email,
        departmentId: student.department_id
      })
    } else {
      setEditingStudent(null)
      setFormData({ rollNo: '', name: '', email: '', departmentId: '' })
    }
    setShowModal(true)
  }

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-600 mt-1">
            Total: {students.length} | Showing: {filteredStudents.length}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowUploadModal(true)}>
            <Upload className="w-5 h-5 mr-2" />
            Import CSV
          </Button>
          <Button onClick={() => openModal()}>
            <Plus className="w-5 h-5 mr-2" />
            Add Student
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, roll no, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          {filteredStudents.length > 0 && (
            <Button variant="outline" onClick={exportStudents}>
              <Download className="w-5 h-5 mr-2" />
              Export
            </Button>
          )}
        </div>
      </Card>

      {students.length === 0 ? (
        <Card className="text-center py-12">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No students yet</h3>
          <p className="text-gray-600 mb-4">Add students manually or import via CSV</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => openModal()}>Add Manually</Button>
            <Button variant="outline" onClick={() => setShowUploadModal(true)}>
              Import CSV
            </Button>
          </div>
        </Card>
      ) : filteredStudents.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-600">No students match your filters</p>
        </Card>
      ) : (
        <Card>
          <Table
            headers={['Roll No', 'Name', 'Email', 'Department', 'Actions']}
            data={filteredStudents}
            renderRow={(student) => (
              <>
                <td className="px-6 py-4">{student.roll_no}</td>
                <td className="px-6 py-4">{student.name}</td>
                <td className="px-6 py-4">{student.email}</td>
                <td className="px-6 py-4">{student.departments?.name}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openModal(student)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(student.id)}
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
          title={editingStudent ? 'Edit Student' : 'Add Student'}
          onClose={() => setShowModal(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Roll Number"
              value={formData.rollNo}
              onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
              required
            />
            <Input
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department *
              </label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingStudent ? 'Update' : 'Add'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {showUploadModal && (
        <Modal title="Import Students via CSV" onClose={() => setShowUploadModal(false)}>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">CSV Format</h4>
              <p className="text-sm text-blue-700">
                Required columns: RollNo, Name, Email, Department
              </p>
            </div>

            <Button
              variant="outline"
              onClick={downloadCSVTemplate}
              className="w-full"
            >
              <Download className="w-5 h-5 mr-2" />
              Download Template
            </Button>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload CSV File
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
