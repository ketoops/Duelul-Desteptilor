import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyDw3zDX-Y_jsk9S3YVqw27L2rATw6N0oN4",
  authDomain: "duelul-desteptilor.firebaseapp.com",
  databaseURL: "https://duelul-desteptilor-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "duelul-desteptilor",
  storageBucket: "duelul-desteptilor.firebasestorage.app",
  messagingSenderId: "978147439104",
  appId: "1:978147439104:web:dbc03598eeb57762885ee5",
}

const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)
