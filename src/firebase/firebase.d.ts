// src/firebase/firebase.d.ts
declare module '../firebase/firebase' {
  import { Firestore } from 'firebase/firestore';

  export const db: Firestore;
}
