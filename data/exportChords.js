import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin SDK with the service account key
const serviceAccount = JSON.parse(fs.readFileSync(path.join(__dirname, '../firebase-admin-key.json'), 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const exportData = async () => {
  try {
    // Reference the collection
    const chordsCollection = db.collection('chords');
    const snapshot = await chordsCollection.get();

    if (snapshot.empty) {
      console.log('No matching documents found.');
      return;
    }

    // Parse Firestore data into a JSON object
    const data = {};
    snapshot.forEach((doc) => {
      data[doc.id] = doc.data();
    });

    // Write to JSON file
    const outputFilePath = path.join(__dirname, 'dataChords.json');
    fs.writeFileSync(outputFilePath, JSON.stringify(data, null, 2));

    console.log(`Data successfully exported to ${outputFilePath}`);
  } catch (error) {
    console.error('Error exporting Firestore data:', error);
  }
};

// Start the export process
exportData();
