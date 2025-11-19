'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, BookOpen, Search } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import Card from '../../../components/ui/Card'
import Modal from '../../../components/ui/Modal'
import Table from '../../../components/ui/Table'

export default function SubjectsPage() {
  const { user } = useAuth()
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSubject, setEditingSubject] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    semester: '',
    credits: ''
  })

  useEffect(() => {
    if (user) {
      fetchSubjects()
    }
  }, [user])

  async function fetchSubjects() {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('college_id', user.id)
        .order('code', { ascending: true })

      if (error) throw error
      setSubjects(data || [])
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to load subjects')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    try {
      const dataToSubmit = {
        ...formData,
        college_id: user.id,
        semester: parseInt(formData.semester) || null,
        credits: parseInt(formData.credits) || null
      }

      if (editingSubject) {
        await supabase
          .from('subjects')
          .update(dataToSubmit)
          .eq('id', editingSubject.id)
        alert('Subject updated!')
      } else {
        await supabase
          .from('subjects')
          .insert([dataToSubmit])
        alert('Subject added!')
      }

      setShowModal(false)
      setEditingSubject(null)
      setFormData({ code: '', name: '', semester: '', credits: '' })
      fetchSubjects()
    } catch (error) {
      console.error('Error:', error)
      alert('Error: ' + error.message)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this subject? This will affect all related assignments.')) return

    try {
      await supabase.from('subjects').delete().eq('id', id)
      alert('Subject deleted!')
      fetchSubjects()
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to delete subject')
    }
  }

  function openModal(subject = null) {
    if (subject) {
      setEditingSubject(subject)
      setFormData({
        code: subject.code,
        name: subject.name,
        semester: subject.semester?.toString() || '',
        credits: subject.credits?.toString() || ''
      })
    } else {
      setEditingSubject(null)
      setFormData({ code: '', name: '', semester: '', credits: '' })
    }
    setShowModal(true)
  }

  const filteredSubjects = subjects.filter(subject =>
    subject.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subjects</h1>
          <p className="text-gray-600 mt-1">Manage subjects for your institution</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="w-5 h-5 mr-2" />
          Add Subject
        </Button>
      </div>

      <Card className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search subjects by code or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </Card>

      {filteredSubjects.length === 0 ? (
        <Card className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm ? 'No subjects found' : 'No subjects yet'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ? 'Try a different search term' : 'Add your first subject to get started'}
          </p>
          {!searchTerm && <Button onClick={() => openModal()}>Add Subject</Button>}
        </Card>
      ) : (
        <Card>
          <Table
            headers={['Code', 'Subject Name', 'Semester', 'Credits', 'Actions']}
            data={filteredSubjects}
            renderRow={(subject) => (
              <>
                <td className="px-6 py-4">
                  <span className="font-mono text-sm font-medium text-blue-600">
                    {subject.code}
                  </span>
                </td>
                <td className="px-6 py-4">{subject.name}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                    Sem {subject.semester || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4">{subject.credits || 'N/A'}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openModal(subject)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(subject.id)}
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
          title={editingSubject ? 'Edit Subject' : 'Add Subject'}
          onClose={() => setShowModal(false)}
        >
          <div className="space-y-4">
            <Input
              label="Subject Code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="e.g., BCAC101"
              required
            />
            <Input
              label="Subject Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Computer Architecture"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Semester"
                type="number"
                min="1"
                max="8"
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                placeholder="1-8"
              />
              <Input
                label="Credits"
                type="number"
                min="1"
                max="10"
                value={formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                placeholder="1-10"
              />
            </div>
            <div className="flex gap-3 justify-end pt-4">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingSubject ? 'Update' : 'Add'} Subject
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}