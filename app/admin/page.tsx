'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface Song {
  _id: string;
  title: string;
  artist?: string;
  votes: number;
  isRequested: boolean;
}

const ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN ?? '1234';

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    if (!authed) return;
    const es = new EventSource('/api/sse');
    es.onmessage = (e) => setSongs(JSON.parse(e.data));
    return () => es.close();
  }, [authed]);

  const login = () => {
    if (pin === ADMIN_PIN) {
      setAuthed(true);
    } else {
      setPinError(true);
      setPin('');
      setTimeout(() => setPinError(false), 1500);
    }
  };

  const markPlayed = async (id: string) => {
    setPlaying(id);
    await fetch(`/api/admin/play/${id}`, { method: 'POST' });
    setTimeout(() => setPlaying(null), 800);
  };

  const deleteSong = async (id: string) => {
    await fetch(`/api/admin/songs/${id}`, { method: 'DELETE' });
    setConfirmDelete(null);
  };

  // ── LOGIN ──
  if (!authed) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '100dvh',
        padding: 24, background: 'var(--bg)',
        gap: 0,
      }}>
        {!logoError ? (
          <Image
            src="/logo.png"
            alt="Xaranga L'Espurna"
            width={80}
            height={80}
            style={{ borderRadius: 18, objectFit: 'contain', marginBottom: 16 }}
            onError={() => setLogoError(true)}
          />
        ) : (
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎺</div>
        )}

        <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800 }}>
          Xaranga L&apos;Espurna
        </h1>
        <p style={{ margin: '0 0 36px', color: 'var(--muted)', fontSize: 14 }}>
          Tauler d&apos;administració
        </p>

        <div style={{ width: '100%', maxWidth: 300 }}>
          <p style={{ margin: '0 0 10px', textAlign: 'center', color: 'var(--secondary)', fontSize: 13, fontWeight: 600 }}>
            Introdueix el PIN
          </p>
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="••••••••"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && login()}
            autoFocus
            style={{
              width: '100%',
              padding: '18px',
              fontSize: 26,
              textAlign: 'center',
              letterSpacing: 10,
              borderRadius: 16,
              border: `2px solid ${pinError ? 'rgba(239,68,68,0.6)' : 'var(--surface3)'}`,
              background: pinError ? '#1a0505' : 'var(--surface)',
              color: 'var(--text)',
              outline: 'none',
              transition: 'border-color 0.2s, background 0.2s',
            }}
          />
          <button
            onClick={login}
            style={{
              width: '100%',
              marginTop: 12,
              padding: '17px',
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 16,
              fontSize: 17,
              fontWeight: 700,
              letterSpacing: 0.5,
            }}
          >
            Entrar
          </button>
          {pinError && (
            <p style={{ textAlign: 'center', color: 'var(--danger)', marginTop: 12, fontSize: 14 }}>
              PIN incorrecte
            </p>
          )}
        </div>
      </div>
    );
  }

  const topSong = songs[0] ?? null;
  const queueSongs = songs.slice(1);

  // ── TAULER ADMIN ──
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100dvh', maxWidth: 520, margin: '0 auto', paddingBottom: 40 }}>

      {/* Capçalera */}
      <header style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--surface3)',
        padding: '14px 16px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        {!logoError ? (
          <Image
            src="/logo.png"
            alt=""
            width={34}
            height={34}
            style={{ borderRadius: 8, objectFit: 'contain' }}
            onError={() => setLogoError(true)}
          />
        ) : (
          <span style={{ fontSize: 22 }}>🎺</span>
        )}
        <div>
          <h1 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>L&apos;Espurna · Admin</h1>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)' }}>
            {songs.length} cançons · En directe
          </p>
        </div>
        {/* Indicador en viu */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: 'var(--success)',
            boxShadow: '0 0 6px var(--success)',
          }} />
          <span style={{ fontSize: 11, color: 'var(--success)', fontWeight: 700 }}>EN VIU</span>
        </div>
      </header>

      <div style={{ padding: '16px' }}>

        {/* ── CANÇÓ MÉS VOTADA ── */}
        <SectionLabel>🔥 Més votada — prem al tocar-la</SectionLabel>

        {topSong ? (
          <button
            onClick={() => markPlayed(topSong._id)}
            disabled={playing === topSong._id}
            style={{
              width: '100%',
              padding: '22px 20px',
              background: playing === topSong._id
                ? 'linear-gradient(135deg, #021a0a, #032d10)'
                : 'linear-gradient(135deg, #010d22 0%, #012060 60%, #013080 100%)',
              border: `2px solid ${playing === topSong._id ? 'var(--success)' : 'rgba(240,180,41,0.5)'}`,
              borderRadius: 20,
              color: '#fff',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.3s',
              marginBottom: 24,
              boxShadow: playing === topSong._id
                ? '0 4px 20px rgba(34,197,94,0.2)'
                : '0 4px 24px rgba(0,74,173,0.35)',
            }}
          >
            <div style={{
              fontSize: 12, fontWeight: 700, letterSpacing: 0.5,
              color: playing === topSong._id ? 'rgba(34,197,94,0.9)' : 'rgba(240,180,41,0.8)',
              marginBottom: 8,
              textTransform: 'uppercase',
            }}>
              {playing === topSong._id ? '✅  Tocada! Reiniciant vots...' : '👆  Prem quan la toques'}
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, lineHeight: 1.2, marginBottom: 6 }}>
              {topSong.title}
            </div>
            {topSong.artist && (
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', marginBottom: 12 }}>
                {topSong.artist}
              </div>
            )}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'var(--gold-dim)',
              border: '1px solid rgba(240,180,41,0.35)',
              borderRadius: 20, padding: '5px 14px',
              fontSize: 16, fontWeight: 800, color: 'var(--gold)',
            }}>
              👍 {topSong.votes} vots
            </div>
          </button>
        ) : (
          <div style={{
            textAlign: 'center', padding: '40px 20px',
            background: 'var(--surface)', borderRadius: 20,
            color: 'var(--muted)', marginBottom: 24,
            border: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: 32 }}>🎵</div>
            <p style={{ margin: '8px 0 0', fontSize: 14 }}>Sense peticions encara</p>
          </div>
        )}

        {/* ── CUA (2a, 3a, 4a) ── */}
        {queueSongs.length > 0 && (
          <>
            <SectionLabel>⚡ Següents en cua</SectionLabel>
            {queueSongs.slice(0, 3).map((song, i) => (
              <div key={song._id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 14px', marginBottom: 8,
                background: 'var(--surface)',
                borderRadius: 14,
                border: '1px solid var(--border)',
              }}>
                <span style={{ fontSize: 13, color: 'var(--muted)', minWidth: 24, fontWeight: 700 }}>
                  #{i + 2}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {song.title}
                  </div>
                  {song.artist && <div style={{ fontSize: 11, color: 'var(--muted)' }}>{song.artist}</div>}
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-bright)', marginRight: 4 }}>
                  👍{song.votes}
                </span>
                <button
                  onClick={() => markPlayed(song._id)}
                  style={smallBtn('var(--surface2)', 'var(--secondary)')}
                  title="Marcar com a tocada"
                >
                  ✅
                </button>
              </div>
            ))}
            <div style={{ height: 16 }} />
          </>
        )}

        {/* ── GESTIÓ DEL REPERTORI ── */}
        <SectionLabel>🗑 Gestió del repertori</SectionLabel>

        {songs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '28px', color: 'var(--muted)', fontSize: 14 }}>
            No hi ha cançons
          </div>
        )}

        {songs.map((song, i) => (
          <div
            key={song._id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 14px',
              marginBottom: 8,
              background: 'var(--surface)',
              borderRadius: 14,
              border: '1px solid var(--border)',
            }}
          >
            <span style={{ fontSize: 12, color: 'var(--muted)', minWidth: 26, fontWeight: 700 }}>
              #{i + 1}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 14, fontWeight: 700,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {song.title}
              </div>
              {song.artist && (
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{song.artist}</div>
              )}
            </div>
            <span style={{
              fontSize: 13, fontWeight: 700,
              color: song.votes > 0 ? 'var(--accent-bright)' : 'var(--muted)',
              minWidth: 44, textAlign: 'right', flexShrink: 0,
            }}>
              👍{song.votes}
            </span>

            {confirmDelete === song._id ? (
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => setConfirmDelete(null)}
                  style={smallBtn('var(--surface2)', 'var(--secondary)')}
                >
                  No
                </button>
                <button
                  onClick={() => deleteSong(song._id)}
                  style={smallBtn('#3a0a0a', '#fca5a5')}
                >
                  Sí
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(song._id)}
                style={smallBtn('var(--surface2)', 'var(--muted)')}
              >
                🗑
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      margin: '0 0 10px',
      fontSize: 11,
      fontWeight: 700,
      color: 'var(--muted)',
      textTransform: 'uppercase',
      letterSpacing: 1,
    }}>
      {children}
    </p>
  );
}

function smallBtn(bg: string, color: string): React.CSSProperties {
  return {
    padding: '8px 12px',
    borderRadius: 10,
    border: 'none',
    background: bg,
    color,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  };
}
