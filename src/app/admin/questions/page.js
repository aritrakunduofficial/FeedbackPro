'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, GripVertical, FileQuestion, X } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'
import { QUESTION_TYPES } from '../../../lib/constants'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import Card from '../../../components/ui/Card'
import Modal from '../../../components/ui/Modal'

export default function QuestionsPage() {
  const { user } = useAuth()
  const [questionnaires, setQuestionnaires] = useState([])
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState('')
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState(null)
  const [formData, setFormData] = useState({
    type: QUESTION_TYPES.STAR_RATING,
    text: '',
    options: [],
    required: true
  })
  const [newOption, setNewOption] = useState('')

  useEffect(() => {
    fetchQuestionnaires()
  }, [user])

  useEffect(() => {
    if (selectedQuestionnaire) {
      fetchQuestions()
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
      
      // Auto-select first active questionnaire
      const active = data?.find(q => q.is_active)
      if (active) {
        setSelectedQuestionnaire(active.id)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to load questionnaires')
    } finally {
      setLoading(false)
    }
  }

  async function fetchQuestions() {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('questionnaire_id', selectedQuestionnaire)
        .order('order_index', { ascending: true })

      if (error) throw error
      setQuestions(data || [])
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to load questions')
    }
  }

  function addOption() {
    if (newOption.trim()) {
      setFormData({
        ...formData,
        options: [...formData.options, newOption.trim()]
      })
      setNewOption('')
    }
  }

  function removeOption(index) {
    setFormData({
      ...formData,
      options: formData.options.filter((_, i) => i !== index)
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    if (!selectedQuestionnaire) {
      alert('Please select a questionnaire first')
      return
    }

    try {
      const questionData = {
        college_id: user.id,
        questionnaire_id: selectedQuestionnaire,
        type: formData.type,
        text: formData.text,
        required: formData.required,
        order_index: questions.length + 1
      }

      if ([QUESTION_TYPES.MULTIPLE_CHOICE, QUESTION_TYPES.CHECKBOX].includes(formData.type)) {
        if (formData.options.length === 0) {
          alert('Please add at least one option')
          return
        }
        questionData.options = formData.options
      }

      if (editingQuestion) {
        await supabase
          .from('questions')
          .update(questionData)
          .eq('id', editingQuestion.id)
        alert('Question updated!')
      } else {
        await supabase
          .from('questions')
          .insert([questionData])
        alert('Question added!')
      }

      setShowModal(false)
      setEditingQuestion(null)
      setFormData({ type: QUESTION_TYPES.STAR_RATING, text: '', options: [], required: true })
      fetchQuestions()
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to save question')
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this question?')) return

    try {
      await supabase.from('questions').delete().eq('id', id)
      alert('Question deleted!')
      fetchQuestions()
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to delete question')
    }
  }

  function openModal(question = null) {
    if (question) {
      setEditingQuestion(question)
      setFormData({
        type: question.type,
        text: question.text,
        options: question.options || [],
        required: question.required
      })
    } else {
      setEditingQuestion(null)
      setFormData({ type: QUESTION_TYPES.STAR_RATING, text: '', options: [], required: true })
    }
    setShowModal(true)
  }

  const questionTypeLabels = {
    [QUESTION_TYPES.STAR_RATING]: '⭐ Star Rating',
    [QUESTION_TYPES.SHORT_TEXT]: '📝 Short Text',
    [QUESTION_TYPES.LONG_TEXT]: '📄 Long Text',
    [QUESTION_TYPES.MULTIPLE_CHOICE]: '☑️ Multiple Choice',
    [QUESTION_TYPES.CHECKBOX]: '✅ Checkbox',
    [QUESTION_TYPES.SCALE]: '📊 Scale (1-10)'
  }

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Questions</h1>
          <p className="text-gray-600 mt-1">Build your custom feedback form</p>
        </div>
        <Button onClick={() => openModal()} disabled={!selectedQuestionnaire}>
          <Plus className="w-5 h-5 mr-2" />
          Add Question
        </Button>
      </div>

      {/* Questionnaire Selector */}
      <Card className="mb-6">
        <div className="flex items-center gap-4">
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
          <FileQuestion className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Questionnaire</h3>
          <p className="text-gray-600 mb-4">
            Choose a questionnaire above to start adding questions
          </p>
        </Card>
      ) : questions.length === 0 ? (
        <Card className="text-center py-12">
          <FileQuestion className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No questions yet</h3>
          <p className="text-gray-600 mb-4">Create your first feedback question</p>
          <Button onClick={() => openModal()}>Add Question</Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {questions.map((question, index) => (
            <Card key={question.id} className="hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-2">
                  <GripVertical className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-sm font-medium text-blue-600">
                        {questionTypeLabels[question.type]}
                      </span>
                      {question.required && (
                        <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                          Required
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openModal(question)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(question.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-900 font-medium">
                    {index + 1}. {question.text}
                  </p>
                  {question.options && question.options.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {question.options.map((option, i) => (
                        <div key={i} className="text-sm text-gray-600 pl-4">
                          • {option}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showModal && (
        <Modal
          title={editingQuestion ? 'Edit Question' : 'Add Question'}
          onClose={() => setShowModal(false)}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value, options: [] })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required
              >
                {Object.entries(questionTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question Text *
              </label>
              <textarea
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                rows="3"
                placeholder="e.g., How would you rate the teaching quality?"
                required
              />
            </div>

            {[QUESTION_TYPES.MULTIPLE_CHOICE, QUESTION_TYPES.CHECKBOX].includes(formData.type) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Options *
                </label>
                
                {/* Display existing options */}
                <div className="space-y-2 mb-3">
                  {formData.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                      <span className="flex-1">{option}</span>
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add new option */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Type an option and click Add"
                  />
                  <Button type="button" onClick={addOption}>
                    Add
                  </Button>
                </div>
                
                {formData.options.length === 0 && (
                  <p className="text-sm text-red-600 mt-2">Add at least one option</p>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="required"
                checked={formData.required}
                onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="required" className="text-sm text-gray-700">
                Make this question required
              </label>
            </div>

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingQuestion ? 'Update' : 'Add'} Question
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
