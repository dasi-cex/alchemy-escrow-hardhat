import * as admin from 'firebase-admin';

const fbApp = admin.initializeApp();

export const firestoreDb = () => {
  return fbApp.firestore();
}