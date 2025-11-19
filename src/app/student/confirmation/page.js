'use client'

import { CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'

export default function ConfirmationPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center px-4">
      <Card className="max-w-md text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Feedback Submitted!
        </h1>
        
        <p className="text-gray-600 mb-6">
          Thank you for taking the time to provide valuable feedback. 
          Your responses have been recorded successfully.
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-900">
            ✓ Your token has been used and cannot be reused<br/>
            ✓ Feedback submitted anonymously<br/>
            ✓ Your input helps improve teaching quality
          </p>
        </div>

        <Button onClick={() => router.push('/')} className="w-full">
          Return to Home
        </Button>
      </Card>
    </div>
  )
}
