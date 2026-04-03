import { db } from './firebase'
import { ref, set, get, update, remove, onValue, off, runTransaction } from 'firebase/database'
import questions from '../data/questions.json'

const LETTER_POOL = 'AAAAAEEEEEIIIIOOOOUUUURRRRNNNNTTTTSSSSLLLLCCCCDDDDMMMMPPPBBFFGGHHJKVWXYZ'

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

function pickLettersForRoom(count = 8) {
  const pool = LETTER_POOL.split('')
  const vowels = 'AEIOU'.split('')
  const consonants = pool.filter(l => !vowels.includes(l))
  const picked = []

  const vowelCount = 2 + Math.floor(Math.random() * 2)
  const vowelPool = pool.filter(l => vowels.includes(l))
  for (let i = 0; i < vowelCount; i++) {
    picked.push(vowelPool[Math.floor(Math.random() * vowelPool.length)])
  }

  while (picked.length < count) {
    const letter = consonants[Math.floor(Math.random() * consonants.length)]
    if (picked.filter(l => l === letter).length < 2) {
      picked.push(letter)
    }
  }

  return shuffleArray(picked)
}

export async function createRoom(username, gameType = 'trivia') {
  const code = generateCode()

  if (gameType === 'words') {
    const letters = pickLettersForRoom(8)
    await set(ref(db, `rooms/${code}`), {
      status: 'waiting',
      gameType: 'words',
      letters,
      createdAt: Date.now(),
      player1: { name: username, score: 0, wordsFound: 0 },
      player2: null,
    })
  } else {
    const withImages = questions.filter(q => q.imagine)
    const questionIds = shuffleArray(withImages.map(q => q.id)).slice(0, 10)

    await set(ref(db, `rooms/${code}`), {
      status: 'waiting',
      gameType: 'trivia',
      questionIds,
      currentQuestion: 0,
      createdAt: Date.now(),
      player1: { name: username, score: 0, answer: null },
      player2: null,
    })
  }

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

  if (room.gameType === 'words') {
    await update(roomRef, {
      status: 'playing',
      startedAt: Date.now(),
      player2: { name: username, score: 0, wordsFound: 0 },
    })
  } else {
    await update(roomRef, {
      status: 'playing',
      player2: { name: username, score: 0, answer: null },
    })
  }

  return room
}

export async function updateWordScore(code, playerSlot, score, wordsFound) {
  await update(ref(db, `rooms/${code}/${playerSlot}`), { score, wordsFound })
}

export async function setPlayerFinished(code, playerSlot) {
  await update(ref(db, `rooms/${code}/${playerSlot}`), { finished: true })
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
