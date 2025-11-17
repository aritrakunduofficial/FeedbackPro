export function generateToken(rollNo) {
  const randomString = Math.random().toString(36).substring(2, 10)
  return `${rollNo}-${randomString}`
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function calculateAverage(ratings) {
  if (!ratings || ratings.length === 0) return 0
  const sum = ratings.reduce((acc, val) => acc + val, 0)
  return (sum / ratings.length).toFixed(1)
}

export function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
