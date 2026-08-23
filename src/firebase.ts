import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: 'hey-9ba52',
  appId: '1:793509106837:web:1b58f8c4fa243ad27ab79c',
  storageBucket: 'hey-9ba52.firebasestorage.app',
  apiKey: 'AIzaSyCm577yjz49MWUJXD7a5Ja2uicCiTB9BKQ',
  authDomain: 'hey-9ba52.firebaseapp.com',
  messagingSenderId: '793509106837',
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
