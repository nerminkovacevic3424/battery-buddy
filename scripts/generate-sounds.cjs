// Original synthesized sounds. No recordings or third-party audio assets.
const fs = require('node:fs');
const path = require('node:path');
const directory = path.join(__dirname, '../modules/battery-alarm/android/src/main/res/raw');
fs.mkdirSync(directory, { recursive: true });
const rate = 22050, seconds = 3.2, frames = Math.floor(rate * seconds);
for (const name of ['cry', 'robot', 'chime']) {
  const bytes = Buffer.alloc(44 + frames * 2);
  bytes.write('RIFF'); bytes.writeUInt32LE(bytes.length - 8, 4); bytes.write('WAVEfmt ', 8);
  bytes.writeUInt32LE(16, 16); bytes.writeUInt16LE(1, 20); bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(rate, 24); bytes.writeUInt32LE(rate * 2, 28); bytes.writeUInt16LE(2, 32); bytes.writeUInt16LE(16, 34);
  bytes.write('data', 36); bytes.writeUInt32LE(frames * 2, 40);
  let phase = 0;
  for (let i = 0; i < frames; i++) {
    const t = i / rate;
    let sample = 0;
    if (name === 'cry') {
      const u = t % 1.05;
      const envelope = u < 0.78 ? Math.pow(Math.sin(Math.PI * u / 0.78), 0.65) : 0;
      const frequency = 390 + 180 * Math.sin(Math.PI * Math.min(u / 0.78, 1)) + 20 * Math.sin(2 * Math.PI * 7 * t);
      phase += 2 * Math.PI * frequency / rate;
      sample = envelope * (Math.sin(phase) + 0.3 * Math.sin(phase * 2) + 0.12 * Math.sin(phase * 3)) * 0.38;
    } else if (name === 'robot') {
      const u = t % 0.8;
      phase += 2 * Math.PI * (u < 0.2 ? 520 : u < 0.4 ? 390 : 260) / rate;
      sample = u < 0.6 ? Math.sin(Math.PI * (u % 0.2) / 0.2) * (Math.sin(phase) + 0.2 * Math.sin(3 * phase)) * 0.4 : 0;
    } else {
      for (let n = 0; n < 3; n++) {
        const u = t - n * 0.48;
        if (u >= 0) sample += Math.sin(2 * Math.PI * [659.25, 523.25, 440][n] * u) * Math.exp(-u * 4) * Math.min(u * 120, 1) * 0.4;
      }
    }
    const fade = Math.min(1, t * 100, (seconds - t) * 20);
    bytes.writeInt16LE(Math.round(Math.max(-1, Math.min(1, sample * fade)) * 32767), 44 + i * 2);
  }
  fs.writeFileSync(path.join(directory, name + '.wav'), bytes);
}
console.log('Generated three original 3.2-second PCM WAV loops.');
