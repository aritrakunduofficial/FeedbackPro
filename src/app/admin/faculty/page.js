'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Users } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import Card from '../../../components/ui/Card'
import Modal from '../../../components/ui/Modal'
import Table from '../../../components/ui/Table'

export default function FacultyPage() {
  const { user } = useAuth()
  const [faculty, setFaculty] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingFaculty, setEditingFaculty] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subjects: '',
    departmentIds: []
  })

  useEffect(() => {
    fetchData()
  }, [user])

  async function fetchData() {
    try {
      const [facultyData, deptsData] = await Promise.all([
        supabase
          .from('faculty')
          .select(`
            *,
            faculty_departments (
              department_id,
              departments (id, name)
            )
          `)
          .eq('college_id', user.id),
        supabase
          .from('departments')
          .select('*')
          .eq('college_id', user.id)
      ])

      setFaculty(facultyData.data || [])
      setDepartments(deptsData.data || [])
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
      if (editingFaculty) {
        // Update faculty
        await supabase
          .from('faculty')
          .update({
            name: formData.name,
            email: formData.email,
            subjects: formData.subjects
          })
          .eq('id', editingFaculty.id)

        // Update departments
        await supabase
          .from('faculty_departments')
          .delete()
          .eq('faculty_id', editingFaculty.id)

        for (const deptId of formData.departmentIds) {
          await supabase
            .from('faculty_departments')
            .insert({ faculty_id: editingFaculty.id, department_id: deptId })
        }

        alert('Faculty updated!')
      } else {
        // Insert new faculty
        const { data: newFaculty, error } = await supabase
          .from('faculty')
          .insert([{
            college_id: user.id,
            name: formData.name,
            email: formData.email,
            subjects: formData.subjects
          }])
          .select()
          .single()

        if (error) throw error

        // Insert departments
        for (const deptId of formData.departmentIds) {
          await supabase
            .from('faculty_departments')
            .insert({ faculty_id: newFaculty.id, department_id: deptId })
        }

        alert('Faculty added!')
      }

      setShowModal(false)
      setEditingFaculty(null)
      setFormData({ name: '', email: '', subjects: '', departmentIds: [] })
      fetchData()
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to save faculty')
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this faculty member?')) return

    try {
      await supabase.from('faculty').delete().eq('id', id)
      alert('Faculty deleted!')
      fetchData()
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to delete faculty')
    }
  }

  function openModal(fac = null) {
    if (fac) {
      setEditingFaculty(fac)
      setFormData({
        name: fac.name,
        email: fac.email,
        subjects: fac.subjects,
        departmentIds: fac.faculty_departments.map(fd => fd.department_id)
      })
    } else {
      setEditingFaculty(null)
      setFormData({ name: '', email: '', subjects: '', departmentIds: [] })
    }
    setShowModal(true)
  }

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Faculty</h1>
          <p className="text-gray-600 mt-1">Manage faculty members</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="w-5 h-5 mr-2" />
          Add Faculty
        </Button>
      </div>

      {faculty.length === 0 ? (
        <Card className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No faculty yet</h3>
          <p className="text-gray-600 mb-4">Add your first faculty member</p>
          <Button onClick={() => openModal()}>Add Faculty</Button>
        </Card>
      ) : (
        <Card>
          <Table
            headers={['Name', 'Email', 'Subjects', 'Departments', 'Actions']}
            data={faculty}
            renderRow={(fac) => (
              <>
                <td className="px-6 py-4">{fac.name}</td>
                <td className="px-6 py-4">{fac.email}</td>
                <td className="px-6 py-4">{fac.subjects}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {fac.faculty_departments.map(fd => (
                      <span key={fd.department_id} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {fd.departments.name}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openModal(fac)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(fac.id)}
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
          title={editingFaculty ? 'Edit Faculty' : 'Add Faculty'}
          onClose={() => setShowModal(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
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
            />
            <Input
              label="Subjects"
              value={formData.subjects}
              onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
              placeholder="e.g., Data Structures, Algorithms"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Departments *
              </label>
              {departments.length === 0 ? (
                <p className="text-sm text-red-600">Please create departments first!</p>
              ) : (
                departments.map(dept => (
                  <label key={dept.id} className="flex items-center gap-2 py-2">
                    <input
                      type="checkbox"
                      checked={formData.departmentIds.includes(dept.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            departmentIds: [...formData.departmentIds, dept.id]
                          })
                        } else {
                          setFormData({
                            ...formData,
                            departmentIds: formData.departmentIds.filter(id => id !== dept.id)
                          })
                        }
                      }}
                      className="rounded"
                    />
                    <span>{dept.name}</span>
                  </label>
                ))
              )}
            </div>
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingFaculty ? 'Update' : 'Add'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
