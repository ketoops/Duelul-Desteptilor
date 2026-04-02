import { db } from './firebase'
import { ref, set, get, update, push, remove, onValue, off } from 'firebase/database'

// Generate or retrieve persistent userId
export function getUserId() {
  let id = localStorage.getItem('userId')
  if (!id) {
    id = 'u_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
    localStorage.setItem('userId', id)
  }
  return id
}

// Generate a short friend code from userId
function generateFriendCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

// Create or update user profile in Firebase
export async function ensureUserProfile(username) {
  const userId = getUserId()
  const userRef = ref(db, `users/${userId}`)
  const snapshot = await get(userRef)

  if (!snapshot.exists()) {
    const friendCode = generateFriendCode()
    await set(userRef, {
      name: username,
      friendCode,
      createdAt: Date.now(),
    })
    localStorage.setItem('friendCode', friendCode)
  } else {
    const data = snapshot.val()
    localStorage.setItem('friendCode', data.friendCode)
    if (data.name !== username) {
      await update(userRef, { name: username })
    }
  }
}

export function getFriendCode() {
  return localStorage.getItem('friendCode') || '------'
}

// Add friend by their friend code
export async function addFriend(friendCode) {
  const myId = getUserId()

  // Find user by friend code
  const usersRef = ref(db, 'users')
  const snapshot = await get(usersRef)
  if (!snapshot.exists()) throw new Error('Codul nu există')

  let friendId = null
  let friendName = null
  snapshot.forEach(child => {
    const data = child.val()
    if (data.friendCode === friendCode.toUpperCase() && child.key !== myId) {
      friendId = child.key
      friendName = data.name
    }
  })

  if (!friendId) throw new Error('Codul nu există sau e al tău')

  // Check if already friends
  const myFriendRef = ref(db, `friends/${myId}/${friendId}`)
  const existing = await get(myFriendRef)
  if (existing.exists()) throw new Error('Sunteți deja prieteni')

  // Add both ways
  await set(ref(db, `friends/${myId}/${friendId}`), {
    name: friendName,
    addedAt: Date.now(),
  })
  const myData = await get(ref(db, `users/${myId}`))
  await set(ref(db, `friends/${friendId}/${myId}`), {
    name: myData.val().name,
    addedAt: Date.now(),
  })

  return friendName
}

// Get friends list
export function listenToFriends(callback) {
  const myId = getUserId()
  const friendsRef = ref(db, `friends/${myId}`)
  onValue(friendsRef, (snapshot) => {
    const friends = []
    if (snapshot.exists()) {
      snapshot.forEach(child => {
        friends.push({ id: child.key, ...child.val() })
      })
    }
    callback(friends)
  })
  return () => off(friendsRef)
}

// Remove friend
export async function removeFriend(friendId) {
  const myId = getUserId()
  await remove(ref(db, `friends/${myId}/${friendId}`))
  await remove(ref(db, `friends/${friendId}/${myId}`))
}

// Save duel result to history (for both players)
export async function saveDuelResult(result) {
  const { vsScores, vsNames } = result
  const myId = getUserId()

  const entry = {
    player1: vsNames[0],
    player2: vsNames[1],
    score1: vsScores[0],
    score2: vsScores[1],
    winner: vsScores[0] > vsScores[1] ? vsNames[0] : vsScores[1] > vsScores[0] ? vsNames[1] : 'Egalitate',
    date: Date.now(),
  }

  await push(ref(db, `history/${myId}`), entry)
}

// Listen to duel history
export function listenToHistory(callback) {
  const myId = getUserId()
  const histRef = ref(db, `history/${myId}`)
  onValue(histRef, (snapshot) => {
    const entries = []
    if (snapshot.exists()) {
      snapshot.forEach(child => {
        entries.push({ id: child.key, ...child.val() })
      })
    }
    // Newest first
    entries.sort((a, b) => b.date - a.date)
    callback(entries)
  })
  return () => off(histRef)
}
