import { db } from './firestore.js';
import fs from 'fs';

// Function to import chords data, delete existing chords collection, and update "dim" chords as minor
const importChordsFromJSON = async () => {
  try {
    // Load the JSON file for chords data
    const chordsData = JSON.parse(fs.readFileSync('./dataChords.json', 'utf8'));

    // Step 1: Delete the existing "chords" collection
    console.log('Deleting existing "chords" collection...');
    const keys = await db.collection('chords').get();
    for (const keyDoc of keys.docs) {
      const key = keyDoc.id;
      await db.collection('chords').doc(key).delete();  // Delete each key document
      console.log(`Deleted key document: ${key}`);
    }

    // Step 2: Upload the new data from dataChords.json and update "dim" chords to "minor"
    for (const key in chordsData) {
      const chordsInKey = chordsData[key];

      // Prepare the data to be added under the key
      const keyData = {};

      for (const docId in chordsInKey) {
        const docData = chordsInKey[docId];

        // Check if "dim" is in the chord ID or longName and set the type to "minor"
        if (docId.includes('dim') || (docData.longName && docData.longName.includes('dim'))) {
          docData.type = 'minor';  // Set the type to "minor" if "dim" is found
          console.log(`Setting type to "minor" for chord ID: ${docId}`);
        }

        // Add each chord as a field under the key
        keyData[docId] = docData;
      }

      // Set the updated data under the corresponding key in Firestore
      const docRef = db.collection('chords').doc(key);
      await docRef.set(keyData);  // Upload the chord data as fields under the key document
      console.log(`Successfully uploaded chords for key: ${key}`);
    }

    console.log('Chords collection has been successfully imported and updated.');
  } catch (error) {
    console.error('Error importing chords collection:', error);
  }
};

// Start the import process
importChordsFromJSON();
