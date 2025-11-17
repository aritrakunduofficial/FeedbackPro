'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, ClipboardList, Calendar, CheckCircle, XCircle } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import Card from '../../../components/ui/Card'
import Modal from '../../../components/ui/Modal'

export default function QuestionnairesPage() {
  const { user } = useAuth()
  const [questionnaires, setQuestionnaires] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    isActive: true
  })

  useEffect(() => {
    fetchQuestionnaires()
  }, [user])

  async function fetchQuestionnaires() {
    try {
      const { data, error } = await supabase
        .from('questionnaires')
        .select('*')
        .eq('college_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setQuestionnaires(data || [])
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to load questionnaires')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    try {
      const questionnaireData = {
        college_id: user.id,
        name: formData.name,
        description: formData.description,
        start_date: formData.startDate || null,
        end_date: formData.endDate || null,
        is_active: formData.isActive
      }

      if (editing) {
        await supabase
          .from('questionnaires')
          .update(questionnaireData)
          .eq('id', editing.id)
        alert('Questionnaire updated!')
      } else {
        await supabase
          .from('questionnaires')
          .insert([questionnaireData])
        alert('Questionnaire created!')
      }

      setShowModal(false)
      setEditing(null)
      setFormData({ name: '', description: '', startDate: '', endDate: '', isActive: true })
      fetchQuestionnaires()
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to save questionnaire')
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this questionnaire? All associated questions and responses will be lost.')) return

    try {
      await supabase.from('questionnaires').delete().eq('id', id)
      alert('Questionnaire deleted!')
      fetchQuestionnaires()
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to delete questionnaire')
    }
  }

  async function toggleActive(id, currentStatus) {
    try {
      await supabase
        .from('questionnaires')
        .update({ is_active: !currentStatus })
        .eq('id', id)
      fetchQuestionnaires()
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to update status')
    }
  }

  function openModal(questionnaire = null) {
    if (questionnaire) {
      setEditing(questionnaire)
      setFormData({
        name: questionnaire.name,
        description: questionnaire.description || '',
        startDate: questionnaire.start_date || '',
        endDate: questionnaire.end_date || '',
        isActive: questionnaire.is_active
      })
    } else {
      setEditing(null)
      setFormData({ name: '', description: '', startDate: '', endDate: '', isActive: true })
    }
    setShowModal(true)
  }

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Questionnaires</h1>
          <p className="text-gray-600 mt-1">Manage feedback questionnaires</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="w-5 h-5 mr-2" />
          Create Questionnaire
        </Button>
      </div>

      {questionnaires.length === 0 ? (
        <Card className="text-center py-12">
          <ClipboardList className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No questionnaires yet</h3>
          <p className="text-gray-600 mb-4">Create your first feedback questionnaire</p>
          <Button onClick={() => openModal()}>Create Questionnaire</Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {questionnaires.map((q) => (
            <Card key={q.id} className="hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{q.name}</h3>
                    {q.is_active ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  {q.description && (
                    <p className="text-sm text-gray-600 mb-3">{q.description}</p>
                  )}
                  {q.start_date && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(q.start_date).toLocaleDateString()}</span>
                      {q.end_date && (
                        <>
                          <span>→</span>
                          <span>{new Date(q.end_date).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2 pt-4 border-t">
                <button
                  onClick={() => toggleActive(q.id, q.is_active)}
                  className={`flex-1 px-3 py-2 text-sm rounded ${
                    q.is_active 
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {q.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => openModal(q)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(q.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showModal && (
        <Modal
          title={editing ? 'Edit Questionnaire' : 'Create Questionnaire'}
          onClose={() => setShowModal(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Questionnaire Name"
              placeholder="e.g., Mid-Term Feedback January 2025"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                rows="3"
                placeholder="Optional description..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
              <Input
                label="End Date"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">
                Set as active questionnaire
              </label>
            </div>

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editing ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
