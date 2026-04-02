import { db } from './firebase'
import { ref, set, get, update, remove, onValue, off, runTransaction } from 'firebase/database'
import questions from '../data/questions.json'

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

function shuffleArray(arr) {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export async function createRoom(username) {
  const code = generateCode()
  const withImages = questions.filter(q => q.imagine)
  const questionIds = shuffleArray(withImages.map(q => q.id)).slice(0, 10)

  await set(ref(db, `rooms/${code}`), {
    status: 'waiting',
    questionIds,
    currentQuestion: 0,
    createdAt: Date.now(),
    player1: { name: username, score: 0, answer: null },
    player2: null,
  })

  return code
}

export async function joinRoom(code, username) {
  const roomRef = ref(db, `rooms/${code}`)
  const snapshot = await get(roomRef)

  if (!snapshot.exists()) {
    throw new Error('Camera nu există')
  }

  const room = snapshot.val()
  if (room.status !== 'waiting') {
    throw new Error('Camera este deja plină')
  }

  await update(roomRef, {
    status: 'playing',
    player2: { name: username, score: 0, answer: null },
  })

  return room.questionIds
}

export function listenToRoom(code, callback) {
  const roomRef = ref(db, `rooms/${code}`)
  onValue(roomRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val())
    }
  })
  return () => off(roomRef)
}

export async function submitAnswer(code, playerSlot, answer) {
  await update(ref(db, `rooms/${code}/${playerSlot}`), { answer })
}

export async function updateScore(code, playerSlot, score) {
  await update(ref(db, `rooms/${code}/${playerSlot}`), { score })
}

export async function advanceQuestion(code, nextIndex) {
  const roomRef = ref(db, `rooms/${code}`)
  // Use transaction to prevent double-advance
  await runTransaction(ref(db, `rooms/${code}/currentQuestion`), (current) => {
    if (current === nextIndex - 1) {
      return nextIndex
    }
    return current // abort if already advanced
  })
  // Clear answers for new question
  await update(roomRef, {
    'player1/answer': null,
    'player2/answer': null,
  })
}

export async function setRoomStatus(code, status) {
  await update(ref(db, `rooms/${code}`), { status })
}

export async function deleteRoom(code) {
  await remove(ref(db, `rooms/${code}`))
}

export function getQuestionsById(ids) {
  return ids.map(id => questions.find(q => q.id === id))
}
