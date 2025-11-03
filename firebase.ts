// ---------------------------------
// 📄 firebase.ts (새로 만들 파일)
// ---------------------------------
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// 1. 님이 복사한 '열쇠' (firebaseConfig)를
//    여기에 그대로 붙여넣으세요.
const firebaseConfig = {
  apiKey: "AIzaSyAAm19ww4L7AQwTUHMPfVfju6HlEYrgGUs",
  authDomain: "stepbystep-37855.firebaseapp.com",
  projectId: "stepbystep-37855",
  storageBucket: "stepbystep-37855.firebasestorage.app",
  messagingSenderId: "1043443774387",
  appId: "1:1043443774387:web:efb1122ca2eeded40551c6",
  measurementId: "G-Z6QNQ19Y07"
};

// 2. Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// 3. Firestore 데이터베이스('중앙 칠판') 내보내기
//    (이 'db'를 App.tsx 파일에서 가져다 쓸 겁니다)
export const db = getFirestore(app);
// ---------------------------------