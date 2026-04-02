import { db } from './firebase'
import { ref, set, get, update, onValue, off } from 'firebase/database'
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

export async function createRoom() {
  const code = generateCode()
  const questionIds = shuffleArray(questions.map(q => q.id)).slice(0, 10)

  await set(ref(db, `rooms/${code}`), {
    status: 'waiting',
    questionIds,
    createdAt: Date.now(),
    player1: { score: 0, current: 0, finished: false },
    player2: null,
  })

  return code
}

export async function joinRoom(code) {
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
    'player2': { score: 0, current: 0, finished: false },
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

export async function updatePlayer(code, playerSlot, data) {
  await update(ref(db, `rooms/${code}/${playerSlot}`), data)
}

export async function setRoomStatus(code, status) {
  await update(ref(db, `rooms/${code}`), { status })
}

export function getQuestionsById(ids) {
  return ids.map(id => questions.find(q => q.id === id))
}
