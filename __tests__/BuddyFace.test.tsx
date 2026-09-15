import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { BuddyAvatar } from '../src/buddy/BuddyAvatar';
import { BuddyMood, defaultProfile, personalities } from '../src/buddy/types';

test('all personalities render different face geometry in every battery mood', () => {
  const moods: BuddyMood[] = ['energetic', 'happy', 'concerned', 'worried', 'crying', 'panic', 'charging', 'full'];
  const view = render(<BuddyAvatar profile={defaultProfile} mood="happy" />);
  for (const mood of moods) {
    const appearances = new Set<string>();
    for (const personality of personalities) {
      view.rerender(<BuddyAvatar profile={{ ...defaultProfile, personality, faceAccessory: 'face_sunglasses' }} mood={mood} />);
      expect(screen.getByTestId(`buddy-face-${mood}`)).toBeTruthy();
      // Compare visible geometry, not just personality labels or component props.
      appearances.add(JSON.stringify(['buddy-brow-left', 'buddy-brow-right', 'buddy-mouth'].map(id => StyleSheet.flatten(screen.getByTestId(id).props.style))));
    }
    expect(appearances.size).toBe(personalities.length);
  }
});
