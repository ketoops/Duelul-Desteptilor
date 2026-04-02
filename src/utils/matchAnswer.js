/**
 * Normalize a string: lowercase, remove diacritics, trim, collapse whitespace.
 */
function normalize(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Check if user's answer matches the correct answer.
 * Diacritics-tolerant, case-insensitive.
 */
export function matchAnswer(userAnswer, correctAnswer) {
  const user = normalize(userAnswer)
  const correct = normalize(correctAnswer)

  if (!user) return false
  if (user === correct) return true
  if (correct.includes(user) && user.length >= 3) return true
  if (user.includes(correct)) return true

  return false
}
