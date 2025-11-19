'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Building2 } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import Card from '../../../components/ui/Card'
import Modal from '../../../components/ui/Modal'

export default function DepartmentsPage() {
  const { user } = useAuth()
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingDept, setEditingDept] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    code: ''
  })

  useEffect(() => {
    fetchDepartments()
  }, [user])

  async function fetchDepartments() {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('college_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setDepartments(data || [])
    } catch (error) {
      console.error('Error fetching departments:', error)
      alert('Failed to load departments')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    try {
      if (editingDept) {
        const { error } = await supabase
          .from('departments')
          .update({
            name: formData.name,
            code: formData.code
          })
          .eq('id', editingDept.id)

        if (error) throw error
        alert('Department updated!')
      } else {
        const { error } = await supabase
          .from('departments')
          .insert([{
            college_id: user.id,
            name: formData.name,
            code: formData.code
          }])

        if (error) throw error
        alert('Department added!')
      }

      setShowModal(false)
      setEditingDept(null)
      setFormData({ name: '', code: '' })
      fetchDepartments()
    } catch (error) {
      console.error('Error saving department:', error)
      alert('Failed to save department')
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure? This will remove all associated data.')) return

    try {
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', id)

      if (error) throw error
      alert('Department deleted!')
      fetchDepartments()
    } catch (error) {
      console.error('Error deleting department:', error)
      alert('Failed to delete department')
    }
  }

  function openModal(dept = null) {
    if (dept) {
      setEditingDept(dept)
      setFormData({ name: dept.name, code: dept.code })
    } else {
      setEditingDept(null)
      setFormData({ name: '', code: '' })
    }
    setShowModal(true)
  }

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Departments</h1>
          <p className="text-gray-600 mt-1">Manage your college departments</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="w-5 h-5 mr-2" />
          Add Department
        </Button>
      </div>

      {departments.length === 0 ? (
        <Card className="text-center py-12">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No departments yet</h3>
          <p className="text-gray-600 mb-4">Get started by adding your first department</p>
          <Button onClick={() => openModal()}>Add Department</Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => (
            <Card key={dept.id}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{dept.name}</h3>
                  <p className="text-sm text-gray-600">Code: {dept.code || 'N/A'}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openModal(dept)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(dept.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <Modal
          title={editingDept ? 'Edit Department' : 'Add Department'}
          onClose={() => setShowModal(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Department Name"
              placeholder="e.g., Computer Science"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              label="Department Code"
              placeholder="e.g., CS"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            />
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingDept ? 'Update' : 'Add'} Department
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
