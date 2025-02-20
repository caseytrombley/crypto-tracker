import { db } from './firestore.js';
import fs from 'fs';
import path from 'path';

// Get the current directory name for ES module support
const __dirname = path.dirname(new URL(import.meta.url).pathname);

// Function to import the inversions data from a JSON file into Firestore
const importChordsFromJSON = async () => {
  try {
    // Load the JSON file
    const inputFilePath = path.join(__dirname, './dataChords.json');
    const inversionsData = JSON.parse(fs.readFileSync(inputFilePath, 'utf8'));

    // Iterate through the data and write to Firestore
    for (const [docId, docData] of Object.entries(inversionsData)) {
      const docRef = db.collection('chords').doc(docId);
      await docRef.set(docData);
      console.log(`Successfully imported document with ID: ${docId}`);
    }

    console.log('Chords collection has been successfully imported.');
  } catch (error) {
    console.error('Error importing chords collection:', error);
  }
};

// Start the import process
importChordsFromJSON();
