import { db } from './firestore.js';
import fs from 'fs';
import path from 'path';

// Function to import the inversions data from a JSON file into Firestore
const importInversionsFromJSON = async () => {
  try {
    // Load the JSON file
    const inputFilePath = path.join(__dirname, '../dataExports/dataInversions.json');
    const inversionsData = JSON.parse(fs.readFileSync(inputFilePath, 'utf8'));

    // Iterate through the data and write to Firestore
    for (const [docId, docData] of Object.entries(inversionsData)) {
      const docRef = db.collection('inversions').doc(docId);
      await docRef.set(docData);
      console.log(`Successfully imported document with ID: ${docId}`);
    }

    console.log('Inversions collection has been successfully imported.');
  } catch (error) {
    console.error('Error importing inversions collection:', error);
  }
};

// Start the import process
importInversionsFromJSON();
