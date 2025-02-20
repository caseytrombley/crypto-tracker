import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

export const addChordInversions = functions.firestore
  .document("chords/{chordId}")
  .onWrite(async (change, context) => {
    // Guard against deleted documents
    if (!change.after.exists) {
      console.log(`Document ${context.params.chordId} was deleted. No action taken.`);
      return;
    }

    // Get the new data
    const chordData = change.after.data();
    if (!chordData) {
      console.warn(`Document ${context.params.chordId} has no data.`);
      return;
    }

    const { notes, intervals, midiKeys } = chordData;
    if (!notes || !intervals || !midiKeys) {
      console.warn(`Missing required fields in chord ${context.params.chordId}.`);
      return;
    }

    // Function to compute all inversions
    const computeInversions = (array: any[]) => {
      const inversions = [];
      for (let i = 1; i < array.length; i++) {
        inversions.push([...array.slice(i), ...array.slice(0, i)]);
      }
      return inversions;
    };

    // Compute inversions for notes, intervals, and midiKeys
    const inversions = computeInversions(notes).map((notesInverted, index) => ({
      inversion: index + 1, // 1-based inversion index
      notes: notesInverted,
      intervals: computeInversions(intervals)[index],
      midiKeys: computeInversions(midiKeys)[index],
    }));

    try {
      // Update Firestore document with inversions
      await change.after.ref.update({ inversions });
      console.log(`Inversions added for chord ${context.params.chordId}.`);
    } catch (error) {
      console.error(`Failed to update chord ${context.params.chordId}:`, error);
    }
  });
