import { db } from './firebase'
import { ref, get, set, query, orderByChild, limitToLast } from 'firebase/database'
import { getUserId } from './userService'

/**
 * Submit a score to the leaderboard.
 * Only saves if it's better than the player's existing best for that game type.
 *
 * Game types: 'trivia', 'words30', 'words60', 'vsTrivia', 'vsWords'
 */
export async function submitScore(gameType, { score, wordsFound, username }) {
  const userId = getUserId()
  const entryRef = ref(db, `leaderboard/${gameType}/${userId}`)
  const snapshot = await get(entryRef)

  const existing = snapshot.exists() ? snapshot.val() : null

  // Only update if new score is better
  if (!existing || score > existing.score) {
    await set(entryRef, {
      name: username,
      score,
      wordsFound: wordsFound || null,
      date: Date.now(),
    })
  }
}

/**
 * Get top scores for a game type.
 * Returns array sorted by score descending, max 50 entries.
 */
export async function getLeaderboard(gameType) {
  const lbRef = query(
    ref(db, `leaderboard/${gameType}`),
    orderByChild('score'),
    limitToLast(50)
  )
  const snapshot = await get(lbRef)

  if (!snapshot.exists()) return []

  const entries = []
  snapshot.forEach(child => {
    entries.push({ id: child.key, ...child.val() })
  })

  // Sort descending (limitToLast gives ascending)
  entries.sort((a, b) => b.score - a.score)
  return entries
}

/**
 * Get the current user's rank and score for a game type.
 */
export async function getMyRank(gameType) {
  const all = await getLeaderboard(gameType)
  const userId = getUserId()
  const index = all.findIndex(e => e.id === userId)
  if (index === -1) return null
  return { rank: index + 1, ...all[index] }
}
