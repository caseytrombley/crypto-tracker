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

const exportInversions = async () => {
  try {
    // Reference the collection
    const inversionsCollection = db.collection('inversions');
    const snapshot = await inversionsCollection.get();

    if (snapshot.empty) {
      console.log('No documents found in inversions collection.');
      return;
    }

    // Parse Firestore data into a JSON object
    const data = {};
    snapshot.forEach((doc) => {
      data[doc.id] = doc.data();
    });

    // Write to JSON file
    const outputFilePath = path.join(__dirname, 'dataInversions.json');
    fs.writeFileSync(outputFilePath, JSON.stringify(data, null, 2));

    console.log(`Inversions successfully exported to ${outputFilePath}`);
  } catch (error) {
    console.error('Error exporting inversions:', error);
  }
};

// Start the export process
exportInversions();
