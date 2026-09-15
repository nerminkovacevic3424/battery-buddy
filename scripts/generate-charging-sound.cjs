const fs = require('node:fs');
const path = require('node:path');
const rate = 22050, duration = 1.2, frames = Math.floor(rate * duration);
const out = Buffer.alloc(44 + frames * 2);
out.write('RIFF'); out.writeUInt32LE(out.length - 8, 4); out.write('WAVEfmt ', 8);
out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(1, 22);
out.writeUInt32LE(rate, 24); out.writeUInt32LE(rate * 2, 28); out.writeUInt16LE(2, 32); out.writeUInt16LE(16, 34);
out.write('data', 36); out.writeUInt32LE(frames * 2, 40);
for (let i = 0; i < frames; i++) {
  const t = i / rate;
  let sample = 0;
  [523.25, 659.25, 783.99].forEach((frequency, index) => {
    const u = t - index * 0.16;
    if (u >= 0) sample += Math.sin(2 * Math.PI * frequency * u) * Math.min(1, u * 100) * Math.exp(-u * 6) * 0.22;
  });
  sample *= Math.min(1, (duration - t) * 40);
  out.writeInt16LE(Math.round(Math.max(-1, Math.min(1, sample)) * 32767), 44 + i * 2);
}
fs.writeFileSync(path.join(__dirname, '../modules/battery-alarm/android/src/main/res/raw/charging.wav'), out);
console.log('Generated original 1.2-second charging chime.');
