// 'use client'

// import { useState, useEffect } from 'react'
// import { Key, Send, Download, Search, Filter } from 'lucide-react'
// import { supabase } from '../../../lib/supabase'
// import { useAuth } from '../../../context/AuthContext'
// import { generateToken } from '../../../lib/utils'
// import { sendBulkTokens } from '../../../lib/email'
// import Button from '../../../components/ui/Button'
// import Card from '../../../components/ui/Card'
// import Table from '../../../components/ui/Table'

// export default function TokensPage() {
//   const { user } = useAuth()
//   const [questionnaires, setQuestionnaires] = useState([])
//   const [departments, setDepartments] = useState([])
//   const [students, setStudents] = useState([])
//   const [tokens, setTokens] = useState([])
//   const [filteredTokens, setFilteredTokens] = useState([])
//   const [loading, setLoading] = useState(true)
//   const [generating, setGenerating] = useState(false)
//   const [sending, setSending] = useState(false)
  
//   // Filters
//   const [selectedQuestionnaire, setSelectedQuestionnaire] = useState('')
//   const [selectedDepartment, setSelectedDepartment] = useState('')
//   const [selectedStudents, setSelectedStudents] = useState([])
//   const [searchTerm, setSearchTerm] = useState('')
//   const [statusFilter, setStatusFilter] = useState('all') // all, used, pending
  
//   // UI State
//   const [showGenerateModal, setShowGenerateModal] = useState(false)
//   const [step, setStep] = useState(1) // 1: Select Questionnaire, 2: Select Department, 3: Select Students

//   useEffect(() => {
//     fetchData()
//   }, [user])

//   useEffect(() => {
//     filterTokens()
//   }, [tokens, searchTerm, statusFilter, selectedQuestionnaire])

//   async function fetchData() {
//     try {
//       const [questData, deptData, studData, tokenData] = await Promise.all([
//         supabase
//           .from('questionnaires')
//           .select('*')
//           .eq('college_id', user.id)
//           .order('created_at', { ascending: false }),
//         supabase
//           .from('departments')
//           .select('*')
//           .eq('college_id', user.id),
//         supabase
//           .from('students')
//           .select('*, departments(name)')
//           .eq('college_id', user.id),
//         supabase
//           .from('access_tokens')
//           .select(`
//             *,
//             students (roll_no, name, email, departments(name)),
//             questionnaires (name)
//           `)
//           .eq('college_id', user.id)
//           .order('created_at', { ascending: false })
//       ])

//       setQuestionnaires(questData.data || [])
//       setDepartments(deptData.data || [])
//       setStudents(studData.data || [])
//       setTokens(tokenData.data || [])
//     } catch (error) {
//       console.error('Error:', error)
//       alert('Failed to load data')
//     } finally {
//       setLoading(false)
//     }
//   }

//   function filterTokens() {
//     let filtered = tokens

//     // Search filter
//     if (searchTerm) {
//       filtered = filtered.filter(t => 
//         t.students?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         t.students?.roll_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         t.token.toLowerCase().includes(searchTerm.toLowerCase())
//       )
//     }

//     // Status filter
//     if (statusFilter === 'used') {
//       filtered = filtered.filter(t => t.is_used)
//     } else if (statusFilter === 'pending') {
//       filtered = filtered.filter(t => !t.is_used)
//     }

//     // Questionnaire filter
//     if (selectedQuestionnaire) {
//       filtered = filtered.filter(t => t.questionnaire_id === selectedQuestionnaire)
//     }

//     setFilteredTokens(filtered)
//   }

//   function openGenerateModal() {
//     setShowGenerateModal(true)
//     setStep(1)
//     setSelectedQuestionnaire('')
//     setSelectedDepartment('')
//     setSelectedStudents([])
//   }

//   function getAvailableStudents() {
//     let available = students

//     // Filter by department if selected
//     if (selectedDepartment) {
//       available = available.filter(s => s.department_id === selectedDepartment)
//     }

//     // Exclude students who already have tokens for this questionnaire
//     const existingTokenStudents = tokens
//       .filter(t => t.questionnaire_id === selectedQuestionnaire)
//       .map(t => t.student_id)

//     available = available.filter(s => !existingTokenStudents.includes(s.id))

//     return available
//   }

//   function handleSelectAll() {
//     const available = getAvailableStudents()
//     if (selectedStudents.length === available.length) {
//       setSelectedStudents([])
//     } else {
//       setSelectedStudents(available.map(s => s.id))
//     }
//   }

//   function handleSelectStudent(studentId) {
//     if (selectedStudents.includes(studentId)) {
//       setSelectedStudents(selectedStudents.filter(id => id !== studentId))
//     } else {
//       setSelectedStudents([...selectedStudents, studentId])
//     }
//   }

//   async function handleGenerateTokens() {
//     if (selectedStudents.length === 0) {
//       alert('Please select at least one student')
//       return
//     }

//     if (!confirm(`Generate tokens for ${selectedStudents.length} students?`)) return

//     setGenerating(true)
//     try {
//       const tokensToInsert = selectedStudents.map(studentId => {
//         const student = students.find(s => s.id === studentId)
//         return {
//           token: generateToken(student.roll_no),
//           college_id: user.id,
//           student_id: studentId,
//           questionnaire_id: selectedQuestionnaire,
//           department_id: student.department_id,
//           is_used: false,
//           expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
//         }
//       })

//       const { error } = await supabase
//         .from('access_tokens')
//         .insert(tokensToInsert)

//       if (error) throw error

//       alert(`${tokensToInsert.length} tokens generated successfully!`)
//       setShowGenerateModal(false)
//       fetchData()
//     } catch (error) {
//       console.error('Error:', error)
//       alert('Failed to generate tokens')
//     } finally {
//       setGenerating(false)
//     }
//   }

//   async function handleSendEmails() {
//     const tokensToSend = filteredTokens.filter(t => !t.is_used)
    
//     if (tokensToSend.length === 0) {
//       alert('No pending tokens to send')
//       return
//     }

//     if (!confirm(`Send emails to ${tokensToSend.length} students?`)) return

//     setSending(true)
//     try {
//       const studentsWithTokens = tokensToSend.map(t => ({
//         email: t.students.email,
//         name: t.students.name,
//         token: t.token
//       }))

//       alert('Sending emails... This may take a few minutes.')
//       await sendBulkTokens(studentsWithTokens, user.name)
//       alert('Emails sent successfully!')
//     } catch (error) {
//       console.error('Error:', error)
//       alert('Failed to send emails')
//     } finally {
//       setSending(false)
//     }
//   }

//   function exportTokensCSV() {
//     const csv = [
//       'Roll No,Name,Email,Department,Token,Status,Questionnaire,Created Date',
//       ...filteredTokens.map(t => 
//         `${t.students.roll_no},${t.students.name},${t.students.email},${t.students.departments?.name || ''},${t.token},${t.is_used ? 'Used' : 'Pending'},${t.questionnaires?.name || ''},${new Date(t.created_at).toLocaleDateString()}`
//       )
//     ].join('\n')

//     const blob = new Blob([csv], { type: 'text/csv' })
//     const url = window.URL.createObjectURL(blob)
//     const a = document.createElement('a')
//     a.href = url
//     a.download = 'tokens.csv'
//     a.click()
//   }

//   if (loading) return <div>Loading...</div>

//   const totalTokens = tokens.length
//   const usedTokens = tokens.filter(t => t.is_used).length
//   const pendingTokens = tokens.filter(t => !t.is_used).length
//   const responseRate = totalTokens > 0 ? Math.round((usedTokens / totalTokens) * 100) : 0

//   return (
//     <div>
//       <div className="flex justify-between items-center mb-6">
//         <div>
//           <h1 className="text-3xl font-bold text-gray-900">Access Tokens</h1>
//           <p className="text-gray-600 mt-1">Generate and manage student access tokens</p>
//         </div>
//         <div className="flex gap-3">
//           {filteredTokens.length > 0 && (
//             <>
//               <Button variant="outline" onClick={exportTokensCSV}>
//                 <Download className="w-5 h-5 mr-2" />
//                 Export
//               </Button>
//               <Button variant="secondary" onClick={handleSendEmails} disabled={sending}>
//                 <Send className="w-5 h-5 mr-2" />
//                 {sending ? 'Sending...' : 'Send Emails'}
//               </Button>
//             </>
//           )}
//           <Button onClick={openGenerateModal}>
//             <Key className="w-5 h-5 mr-2" />
//             Generate Tokens
//           </Button>
//         </div>
//       </div>

//       {/* Stats Cards */}
//       <div className="grid md:grid-cols-4 gap-6 mb-6">
//         <Card>
//           <h3 className="text-sm text-gray-600 mb-1">Total Tokens</h3>
//           <p className="text-3xl font-bold text-gray-900">{totalTokens}</p>
//         </Card>
//         <Card>
//           <h3 className="text-sm text-gray-600 mb-1">Used</h3>
//           <p className="text-3xl font-bold text-green-600">{usedTokens}</p>
//           <p className="text-xs text-gray-500 mt-1">{responseRate}% response rate</p>
//         </Card>
//         <Card>
//           <h3 className="text-sm text-gray-600 mb-1">Pending</h3>
//           <p className="text-3xl font-bold text-orange-600">{pendingTokens}</p>
//           <p className="text-xs text-gray-500 mt-1">{totalTokens - usedTokens} remaining</p>
//         </Card>
//         <Card>
//           <h3 className="text-sm text-gray-600 mb-1">Progress</h3>
//           <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
//             <div
//               className={`h-2 rounded-full transition-all ${
//                 responseRate < 30 ? 'bg-red-500' :
//                 responseRate < 60 ? 'bg-yellow-500' :
//                 responseRate < 90 ? 'bg-blue-500' : 'bg-green-500'
//               }`}
//               style={{ width: `${responseRate}%` }}
//             />
//           </div>
//           <p className="text-sm text-gray-600 mt-1">{responseRate}%</p>
//         </Card>
//       </div>

//       {/* Filters */}
//       <Card className="mb-6">
//         <div className="flex flex-wrap gap-4">
//           <div className="flex-1 min-w-[200px]">
//             <div className="relative">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//               <input
//                 type="text"
//                 placeholder="Search by name, roll no, or token..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
//               />
//             </div>
//           </div>
          
//           <select
//             value={statusFilter}
//             onChange={(e) => setStatusFilter(e.target.value)}
//             className="px-4 py-2 border border-gray-300 rounded-lg"
//           >
//             <option value="all">All Status</option>
//             <option value="used">Used Only</option>
//             <option value="pending">Pending Only</option>
//           </select>

//           <select
//             value={selectedQuestionnaire}
//             onChange={(e) => setSelectedQuestionnaire(e.target.value)}
//             className="px-4 py-2 border border-gray-300 rounded-lg"
//           >
//             <option value="">All Questionnaires</option>
//             {questionnaires.map(q => (
//               <option key={q.id} value={q.id}>{q.name}</option>
//             ))}
//           </select>
//         </div>
//       </Card>

//       {/* Tokens Table */}
//       {tokens.length === 0 ? (
//         <Card className="text-center py-12">
//           <Key className="w-16 h-16 text-gray-400 mx-auto mb-4" />
//           <h3 className="text-lg font-semibold text-gray-900 mb-2">No tokens generated</h3>
//           <p className="text-gray-600 mb-4">Generate unique access tokens for your students</p>
//           <Button onClick={openGenerateModal}>Generate Tokens</Button>
//         </Card>
//       ) : filteredTokens.length === 0 ? (
//         <Card className="text-center py-12">
//           <p className="text-gray-600">No tokens match your filters</p>
//         </Card>
//       ) : (
//         <Card>
//           <Table
//             headers={['Roll No', 'Name', 'Email', 'Department', 'Token', 'Questionnaire', 'Status', 'Date']}
//             data={filteredTokens}
//             renderRow={(token) => (
//               <>
//                 <td className="px-6 py-4">{token.students?.roll_no}</td>
//                 <td className="px-6 py-4">{token.students?.name}</td>
//                 <td className="px-6 py-4">{token.students?.email}</td>
//                 <td className="px-6 py-4">{token.students?.departments?.name}</td>
//                 <td className="px-6 py-4">
//                   <code className="text-xs bg-gray-100 px-2 py-1 rounded">
//                     {token.token}
//                   </code>
//                 </td>
//                 <td className="px-6 py-4 text-sm">{token.questionnaires?.name}</td>
//                 <td className="px-6 py-4">
//                   <span className={`px-2 py-1 text-xs rounded ${
//                     token.is_used 
//                       ? 'bg-green-100 text-green-800' 
//                       : 'bg-orange-100 text-orange-800'
//                   }`}>
//                     {token.is_used ? 'Used' : 'Pending'}
//                   </span>
//                 </td>
//                 <td className="px-6 py-4 text-sm text-gray-600">
//                   {new Date(token.created_at).toLocaleDateString()}
//                 </td>
//               </>
//             )}
//           />
//         </Card>
//       )}

//       {/* Generate Tokens Modal */}
//       {showGenerateModal && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
//           <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
//             <div className="sticky top-0 bg-white border-b px-6 py-4">
//               <h2 className="text-xl font-semibold text-gray-900">
//                 Generate Access Tokens
//               </h2>
//               <div className="flex items-center gap-2 mt-3">
//                 {[1, 2, 3].map(s => (
//                   <div key={s} className="flex items-center flex-1">
//                     <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
//                       step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
//                     }`}>
//                       {s}
//                     </div>
//                     {s < 3 && <div className={`flex-1 h-1 ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`} />}
//                   </div>
//                 ))}
//               </div>
//             </div>

//             <div className="p-6">
//               {step === 1 && (
//                 <div>
//                   <h3 className="text-lg font-semibold mb-4">Step 1: Select Questionnaire</h3>
//                   <div className="space-y-2">
//                     {questionnaires.map(q => (
//                       <label key={q.id} className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
//                         <input
//                           type="radio"
//                           name="questionnaire"
//                           value={q.id}
//                           checked={selectedQuestionnaire === q.id}
//                           onChange={(e) => setSelectedQuestionnaire(e.target.value)}
//                           className="w-4 h-4"
//                         />
//                         <div className="flex-1">
//                           <p className="font-medium">{q.name}</p>
//                           {q.description && <p className="text-sm text-gray-600">{q.description}</p>}
//                         </div>
//                         {q.is_active && (
//                           <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Active</span>
//                         )}
//                       </label>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               {step === 2 && (
//                 <div>
//                   <h3 className="text-lg font-semibold mb-4">Step 2: Select Department (Optional)</h3>
//                   <div className="space-y-2">
//                     <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
//                       <input
//                         type="radio"
//                         name="department"
//                         value=""
//                         checked={selectedDepartment === ''}
//                         onChange={() => setSelectedDepartment('')}
//                         className="w-4 h-4"
//                       />
//                       <span className="font-medium">All Departments</span>
//                     </label>
//                     {departments.map(d => (
//                       <label key={d.id} className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
//                         <input
//                           type="radio"
//                           name="department"
//                           value={d.id}
//                           checked={selectedDepartment === d.id}
//                           onChange={(e) => setSelectedDepartment(e.target.value)}
//                           className="w-4 h-4"
//                         />
//                         <span className="font-medium">{d.name}</span>
//                       </label>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               {step === 3 && (
//                 <div>
//                   <div className="flex justify-between items-center mb-4">
//                     <h3 className="text-lg font-semibold">Step 3: Select Students</h3>
//                     <Button variant="outline" onClick={handleSelectAll}>
//                       {selectedStudents.length === getAvailableStudents().length ? 'Deselect All' : 'Select All'}
//                     </Button>
//                   </div>
                  
//                   {getAvailableStudents().length === 0 ? (
//                     <div className="text-center py-8 text-gray-600">
//                       No students available. All students in this department already have tokens for this questionnaire.
//                     </div>
//                   ) : (
//                     <div className="max-h-96 overflow-y-auto border rounded-lg">
//                       <table className="w-full">
//                         <thead className="bg-gray-50 sticky top-0">
//                           <tr>
//                             <th className="px-4 py-2 text-left">
//                               <input
//                                 type="checkbox"
//                                 checked={selectedStudents.length === getAvailableStudents().length}
//                                 onChange={handleSelectAll}
//                                 className="rounded"
//                               />
//                             </th>
//                             <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Roll No</th>
//                             <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Name</th>
//                             <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Email</th>
//                             <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Department</th>
//                           </tr>
//                         </thead>
//                         <tbody className="divide-y">
//                           {getAvailableStudents().map(student => (
//                             <tr key={student.id} className="hover:bg-gray-50">
//                               <td className="px-4 py-2">
//                                 <input
//                                   type="checkbox"
//                                   checked={selectedStudents.includes(student.id)}
//                                   onChange={() => handleSelectStudent(student.id)}
//                                   className="rounded"
//                                 />
//                               </td>
//                               <td className="px-4 py-2 text-sm">{student.roll_no}</td>
//                               <td className="px-4 py-2 text-sm">{student.name}</td>
//                               <td className="px-4 py-2 text-sm">{student.email}</td>
//                               <td className="px-4 py-2 text-sm">{student.departments?.name}</td>
//                             </tr>
//                           ))}
//                         </tbody>
//                       </table>
//                     </div>
//                   )}
                  
//                   <p className="mt-4 text-sm text-gray-600">
//                     Selected: <strong>{selectedStudents.length}</strong> students
//                   </p>
//                 </div>
//               )}
//             </div>

//             <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-between">
//               <Button
//                 variant="secondary"
//                 onClick={() => {
//                   if (step > 1) {
//                     setStep(step - 1)
//                   } else {
//                     setShowGenerateModal(false)
//                   }
//                 }}
//               >
//                 {step === 1 ? 'Cancel' : 'Back'}
//               </Button>
              
//               {step < 3 ? (
//                 <Button
//                   onClick={() => setStep(step + 1)}
//                   disabled={step === 1 && !selectedQuestionnaire}
//                 >
//                   Next
//                 </Button>
//               ) : (
//                 <Button
//                   onClick={handleGenerateTokens}
//                   disabled={generating || selectedStudents.length === 0}
//                 >
//                   {generating ? 'Generating...' : `Generate ${selectedStudents.length} Tokens`}
//                 </Button>
//               )}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }
'use client'

import { useState, useEffect } from 'react'
import { Key, Download, Users, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'

export default function TokensPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [questionnaires, setQuestionnaires] = useState([])
  const [departments, setDepartments] = useState([])
  const [students, setStudents] = useState([])
  const [tokens, setTokens] = useState([])
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [generatedTokens, setGeneratedTokens] = useState([])
  const [stats, setStats] = useState({ total: 0, used: 0, pending: 0 })

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  useEffect(() => {
    if (selectedQuestionnaire) {
      fetchTokenStats()
    }
  }, [selectedQuestionnaire])

  async function fetchData() {
    try {
      const [qData, dData, sData] = await Promise.all([
        supabase
          .from('questionnaires')
          .select('*')
          .eq('college_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('departments')
          .select('*')
          .eq('college_id', user.id),
        supabase
          .from('students')
          .select('*, departments(name)')
          .eq('college_id', user.id)
      ])

      setQuestionnaires(qData.data || [])
      setDepartments(dData.data || [])
      setStudents(sData.data || [])
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to load data')
    }
  }

  async function fetchTokenStats() {
    try {
      const { data, error } = await supabase
        .from('access_tokens')
        .select('*')
        .eq('college_id', user.id)
        .eq('questionnaire_id', selectedQuestionnaire)

      if (error) throw error

      const total = data?.length || 0
      const used = data?.filter(t => t.is_used).length || 0
      
      setStats({
        total,
        used,
        pending: total - used
      })
      setTokens(data || [])
    } catch (error) {
      console.error('Error:', error)
    }
  }

  async function generateTokens() {
    if (!selectedQuestionnaire) {
      alert('Please select a questionnaire')
      return
    }

    if (!selectedDepartment) {
      alert('Please select a department')
      return
    }

    // Check if department has active faculty assignments
    const { data: assignments, error: assignError } = await supabase
      .from('faculty_subject_assignments')
      .select('id')
      .eq('department_id', selectedDepartment)
      .eq('is_active', true)

    if (assignError || !assignments || assignments.length === 0) {
      alert('No active faculty-subject assignments found for this department. Please create assignments first.')
      return
    }

    const deptStudents = students.filter(s => s.department_id === selectedDepartment)

    if (deptStudents.length === 0) {
      alert('No students found in this department')
      return
    }

    setLoading(true)

    try {
      const newTokens = []

      for (const student of deptStudents) {
        // Check if token already exists
        const { data: existing } = await supabase
          .from('access_tokens')
          .select('token')
          .eq('student_id', student.id)
          .eq('questionnaire_id', selectedQuestionnaire)
          .single()

        if (existing) {
          newTokens.push({
            ...student,
            token: existing.token,
            status: 'existing'
          })
          continue
        }

        // Generate unique token
        const token = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        const { error } = await supabase
          .from('access_tokens')
          .insert([{
            token,
            college_id: user.id,
            student_id: student.id,
            questionnaire_id: selectedQuestionnaire,
            department_id: selectedDepartment,
            is_used: false,
            expires_at: null
          }])

        if (error) throw error

        newTokens.push({
          ...student,
          token,
          status: 'new'
        })
      }

      setGeneratedTokens(newTokens)
      fetchTokenStats()
      alert(`Generated ${newTokens.filter(t => t.status === 'new').length} new tokens!`)
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to generate tokens: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  function downloadTokens() {
    if (generatedTokens.length === 0) {
      alert('No tokens to download')
      return
    }

    const questionnaire = questionnaires.find(q => q.id === selectedQuestionnaire)
    const department = departments.find(d => d.id === selectedDepartment)

    const csv = [
      ['Roll No', 'Name', 'Email', 'Department', 'Token', 'Login URL', 'Status'].join(','),
      ...generatedTokens.map(t => [
        t.roll_no,
        t.name,
        t.email,
        t.departments.name,
        t.token,
        `${window.location.origin}/student/login?token=${t.token}`,
        t.status === 'new' ? 'New' : 'Already Generated'
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tokens_${department?.name}_${questionnaire?.name}.csv`
    a.click()
  }

  async function viewAllTokens() {
    if (!selectedQuestionnaire || !selectedDepartment) {
      alert('Please select questionnaire and department')
      return
    }

    try {
      const { data, error } = await supabase
        .from('access_tokens')
        .select(`
          *,
          students (
            roll_no,
            name,
            email,
            departments (name)
          )
        `)
        .eq('college_id', user.id)
        .eq('questionnaire_id', selectedQuestionnaire)
        .eq('department_id', selectedDepartment)

      if (error) throw error

      const tokensList = data.map(t => ({
        roll_no: t.students.roll_no,
        name: t.students.name,
        email: t.students.email,
        departments: t.students.departments,
        token: t.token,
        status: t.is_used ? 'used' : 'pending'
      }))

      setGeneratedTokens(tokensList)
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to load tokens')
    }
  }

  const selectedDept = departments.find(d => d.id === selectedDepartment)
  const deptStudentCount = students.filter(s => s.department_id === selectedDepartment).length

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Access Tokens</h1>
        <p className="text-gray-600 mt-1">Generate feedback access tokens for students</p>
      </div>

      {/* Token Generation Form */}
      <Card className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate New Tokens</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Questionnaire *
            </label>
            <select
              value={selectedQuestionnaire}
              onChange={(e) => setSelectedQuestionnaire(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">-- Select Questionnaire --</option>
              {questionnaires.map(q => (
                <option key={q.id} value={q.id}>
                  {q.name} {q.is_active ? '(Active)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Department *
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">-- Select Department --</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            {selectedDepartment && (
              <p className="text-sm text-gray-600 mt-2">
                {deptStudentCount} students in {selectedDept?.name}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={generateTokens}
              disabled={loading || !selectedQuestionnaire || !selectedDepartment}
              className="flex-1"
            >
              <Key className="w-5 h-5 mr-2" />
              {loading ? 'Generating...' : 'Generate Tokens'}
            </Button>
            
            {selectedQuestionnaire && selectedDepartment && (
              <Button
                variant="outline"
                onClick={viewAllTokens}
              >
                View Existing
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Stats */}
      {selectedQuestionnaire && stats.total > 0 && (
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <Card>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Tokens</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                <Key className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Submitted</p>
                <p className="text-3xl font-bold text-green-600">{stats.used}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-100 text-green-600">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending</p>
                <p className="text-3xl font-bold text-orange-600">{stats.pending}</p>
              </div>
              <div className="p-3 rounded-lg bg-orange-100 text-orange-600">
                <AlertCircle className="w-6 h-6" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Generated Tokens Table */}
      {generatedTokens.length > 0 && (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Generated Tokens ({generatedTokens.length})
            </h3>
            <Button size="sm" onClick={downloadTokens}>
              <Download className="w-4 h-4 mr-2" />
              Download CSV
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Roll No
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Token
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {generatedTokens.map((token, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono">{token.roll_no}</td>
                    <td className="px-4 py-3 text-sm">{token.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{token.email}</td>
                    <td className="px-4 py-3">
                      <code className="px-2 py-1 bg-gray-100 text-xs rounded">
                        {token.token}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        token.status === 'new' || token.status === 'pending'
                          ? 'bg-blue-100 text-blue-800'
                          : token.status === 'used'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {token.status === 'new' ? 'New' : 
                         token.status === 'existing' ? 'Existing' :
                         token.status === 'used' ? 'Submitted' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Info Box */}
      <Card className="mt-6 bg-blue-50 border-2 border-blue-200">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">How Token System Works</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>One token per student</strong> - Each student gets 1 token for the questionnaire</li>
              <li>• <strong>Multiple feedback forms</strong> - With one token, students can give feedback for ALL faculty-subjects in their department</li>
              <li>• <strong>Progress tracking</strong> - Token is marked "used" only after ALL feedback forms are submitted</li>
              <li>• <strong>Department-specific</strong> - Students only see faculty-subject assignments for their department</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}