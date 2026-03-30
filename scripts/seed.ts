// Ejecutar con: npx ts-node --esm scripts/seed.ts
// O: npx tsx scripts/seed.ts

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/xaranga';

const SongSchema = new mongoose.Schema({
  title: String,
  artist: String,
  votes: { type: Number, default: 0 },
  addedAt: { type: Date, default: Date.now },
  isRequested: { type: Boolean, default: false },
});

const Song = mongoose.models.Song ?? mongoose.model('Song', SongSchema);

const canciones = [
  { title: 'Y Viva España', artist: 'Manolo Escobar' },
  { title: 'El Cola Cao', artist: 'Popular' },
  { title: 'La Macarena', artist: 'Los del Río' },
  { title: 'Resistiré', artist: 'Dúo Dinámico' },
  { title: 'Despacito', artist: 'Luis Fonsi' },
  { title: 'La Bamba', artist: 'Ritchie Valens' },
  { title: 'Cumpleaños Feliz', artist: 'Popular' },
  { title: 'El Gato Montés', artist: 'Pasodoble' },
  { title: 'España Cañí', artist: 'Pasodoble' },
  { title: 'La Cucaracha', artist: 'Popular' },
  { title: 'Guantanamera', artist: 'Popular' },
  { title: 'Thriller', artist: 'Michael Jackson' },
  { title: 'Eye of the Tiger', artist: 'Survivor' },
  { title: 'We Will Rock You', artist: 'Queen' },
  { title: 'Jump', artist: 'Van Halen' },
  { title: 'Living on a Prayer', artist: 'Bon Jovi' },
  { title: 'La Gozadera', artist: 'Gente de Zona' },
  { title: 'Bella Ciao', artist: 'Popular italiana' },
  { title: 'Por Ti Volaré', artist: 'Andrea Bocelli' },
  { title: 'El Himno de Valencia', artist: 'Popular' },
];

async function seed() {
  await mongoose.connect(MONGODB_URI);
  await Song.deleteMany({});
  await Song.insertMany(canciones);
  console.log(`✅ ${canciones.length} canciones insertadas`);
  await mongoose.disconnect();
}

seed().catch(console.error);
