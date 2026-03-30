// Executar amb: npm run seed

import { readFileSync } from 'fs';
import { resolve } from 'path';

try {
  const envFile = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
  for (const line of envFile.split('\n')) {
    const [key, ...rest] = line.split('=');
    if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
  }
} catch { /* sense .env.local */ }

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/xaranga';

const SongSchema = new mongoose.Schema({
  title: String,
  votes: { type: Number, default: 0 },
  addedAt: { type: Date, default: Date.now },
  isRequested: { type: Boolean, default: false },
});

const Song = mongoose.models.Song ?? mongoose.model('Song', SongSchema);

const cancions = [
  { title: 'Y Viva España' },
  { title: 'El Cola Cao' },
  { title: 'La Macarena' },
  { title: 'Resistiré' },
  { title: 'Despacito' },
  { title: 'La Bamba' },
  { title: 'Cumpleaños Feliz' },
  { title: 'El Gato Montés' },
  { title: 'España Cañí' },
  { title: 'La Cucaracha' },
  { title: 'Guantanamera' },
  { title: 'Thriller' },
  { title: 'Eye of the Tiger' },
  { title: 'We Will Rock You' },
  { title: 'Jump' },
  { title: 'Living on a Prayer' },
  { title: 'La Gozadera' },
  { title: 'Bella Ciao' },
  { title: 'Por Ti Volaré' },
  { title: 'El Himno de Valencia' },
];

async function seed() {
  await mongoose.connect(MONGODB_URI);
  await Song.deleteMany({});
  await Song.insertMany(cancions);
  console.log(`✅ ${cancions.length} cançons insertades`);
  await mongoose.disconnect();
}

seed().catch(console.error);
