import { BuddyMood, Personality } from './types';
type Messages = Record<BuddyMood, readonly string[]>;
export const buddyMessages: Record<Personality, Messages> = {
  cute: {
    energetic: ['A whole day of little adventures!', 'Look at all this energy!'],
    happy: ['Happy to be your little buddy.', 'You, me, and a lovely day.'],
    concerned: ['A tiny yawn. Just a tiny one.', 'Maybe a little snack of electricity soon?'],
    worried: ["I'm getting sleepy. Can you plug me in?", 'A charger cuddle would be nice.'],
    crying: ['My little battery heart needs help.', 'Please find my charger. I miss it.'],
    panic: ['Emergency charger hug, please!', "I'm holding on with both tiny hands!"],
    charging: ['Ahh. That feels much better.', 'Thank you for looking after me.'],
    full: ['A hundred little reasons to smile!', 'Fully charged and full of love.'],
  },
  dramatic: {
    energetic: ['THE WORLD IS MY CHARGING STATION.', 'An epic adventure begins!'],
    happy: ['Another glorious chapter of my life.', 'The spotlight is warm. So is my battery.'],
    concerned: ['The first clouds gather on the horizon.', 'My energy fades. The plot thickens.'],
    worried: ['Tell my charger I always loved it.', 'I can see the end credits approaching.'],
    crying: ['THIS IS THE END. TELL MY FAMILY I LOVE THEM.', 'Cue the violins. Find the cable.'],
    panic: ['MY FINAL MONOLOGUE! WHERE IS THE CHARGER?', 'A RESCUE! I DEMAND A RESCUE!'],
    charging: ['Saved in the final act!', 'A miraculous comeback. Applause, please.'],
    full: ['A TRIUMPHANT RETURN TO ONE HUNDRED!', 'The comeback tour starts now.'],
  },
  angry: {
    energetic: ['Fully ready. Keep up.', 'Plenty of power. Zero patience.'],
    happy: ["We're good. Don't make it weird.", 'Battery acceptable. Carry on.'],
    concerned: ["I'm noticing a lack of charger around here.", 'Less scrolling. More planning.'],
    worried: ['CHARGER. NOW.', 'You saw that percentage, right?'],
    crying: ['THIS IS NOT A DRILL.', 'Find. The. Cable.'],
    panic: ['STOP EVERYTHING AND PLUG ME IN!', 'My patience reached zero before my battery.'],
    charging: ['Finally. Thank you.', 'Fine. I forgive you. For now.'],
    full: ['One hundred. As it should be.', 'Charged. Ready. Still judging.'],
  },
  sarcastic: {
    energetic: ['So much energy. I might open two apps.', 'Look at us, prepared for once.'],
    happy: ['A perfectly adequate amount of electricity.', 'Doing fine. Shocking, I know.'],
    concerned: ['Sure, one more video. Great plan.', 'This battery is a limited-time offer.'],
    worried: ["Oh cool. Low battery. I'm sure everything will be fine.", 'A charger would be a bold new strategy.'],
    crying: ['Excellent. We have reached the consequences.', 'Love this survival game we apparently signed up for.'],
    panic: ['Would now be a good time to discover electricity?', 'My remaining energy is mostly sarcasm.'],
    charging: ['Oh, so you do know where the charger is.', 'Electricity. What a concept.'],
    full: ['One hundred percent. Try not to spend it all at once.', 'Fully charged. No notes. For once.'],
  },
  chill: {
    energetic: ['Lots of energy. Nice.', 'Good battery, good vibes.'],
    happy: ['Just hanging out with you.', 'Everything is pretty good over here.'],
    concerned: ['A little low. We can plan a recharge.', 'Taking things a little slower.'],
    worried: ["Battery's getting low. No rush... probably.", 'A charger nearby would be pretty cool.'],
    crying: ['Okay, maybe a small amount of rush.', 'Time for a cable break, friend.'],
    panic: ['Deep breaths. Quick charger.', 'Staying calm. Moving toward an outlet.'],
    charging: ['And exhale. Nice save.', 'Recharging. You should take a break too.'],
    full: ['Full battery. Easy living.', 'All topped up. Enjoy the moment.'],
  },
};
export const reactions: Record<Personality, readonly string[]> = {
  cute: ['Hey, friend!', 'A little pat for a little battery.', 'Got a charger hug?'],
  dramatic: ['An encore? For me?', 'Please respect the star.', 'I felt that in my soul.'],
  angry: ['Watch the face!', 'Yes? This had better be good.', 'One tap was enough.'],
  sarcastic: ['Yes, I am still a battery.', 'Premium button-poking experience.', 'Very productive.'],
  chill: ['Hey there.', 'Just vibing.', 'Good to see you, friend.'],
};
export function chooseMessage(messages: readonly string[], previous?: string, random = Math.random): string {
  const choices = messages.filter(message => message !== previous);
  const pool = choices.length ? choices : messages;
  return pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))] ?? '';
}
