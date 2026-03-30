'use client';

import { useState, useEffect } from 'react';

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
    setTimeout(() => setPlaying(null), 600);
  };

  const deleteSong = async (id: string) => {
    await fetch(`/api/admin/songs/${id}`, { method: 'DELETE' });
    setConfirmDelete(null);
  };

  if (!authed) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '100dvh',
        padding: 24, background: 'var(--bg)',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎺</div>
        <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 800 }}>Panel Admin</h1>
        <p style={{ margin: '0 0 32px', color: 'var(--muted)', fontSize: 14 }}>Introduce el PIN</p>

        <div style={{ width: '100%', maxWidth: 280 }}>
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && login()}
            autoFocus
            style={{
              width: '100%',
              padding: '18px',
              fontSize: 24,
              textAlign: 'center',
              letterSpacing: 8,
              borderRadius: 16,
              border: `2px solid ${pinError ? 'var(--danger)' : '#333'}`,
              background: pinError ? '#1a0000' : '#1c1c1c',
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
              padding: '16px',
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 16,
              fontSize: 17,
              fontWeight: 700,
            }}
          >
            Entrar
          </button>
          {pinError && (
            <p style={{ textAlign: 'center', color: 'var(--danger)', marginTop: 12, fontSize: 14 }}>
              PIN incorrecto
            </p>
          )}
        </div>
      </div>
    );
  }

  const topSong = songs[0] ?? null;
  const restSongs = songs.slice(1);

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100dvh', maxWidth: 520, margin: '0 auto', padding: '0 0 40px' }}>
      {/* Header */}
      <header style={{
        background: '#111',
        borderBottom: '1px solid #222',
        padding: '16px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <span style={{ fontSize: 24 }}>🎺</span>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Admin Xaranga</h1>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)' }}>{songs.length} canciones · En directo</p>
        </div>
        <div style={{
          marginLeft: 'auto',
          width: 10, height: 10,
          borderRadius: '50%',
          background: 'var(--success)',
          boxShadow: '0 0 6px var(--success)',
        }} />
      </header>

      <div style={{ padding: '16px' }}>
        {/* Canción número 1 */}
        <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
          🔥 Más votada — toca y marca como tocada
        </p>

        {topSong ? (
          <button
            onClick={() => markPlayed(topSong._id)}
            disabled={playing === topSong._id}
            style={{
              width: '100%',
              padding: '24px 20px',
              background: playing === topSong._id
                ? 'linear-gradient(135deg, #052e16, #14532d)'
                : 'linear-gradient(135deg, #431407, #7c2d12)',
              border: `2px solid ${playing === topSong._id ? 'var(--success)' : 'var(--accent)'}`,
              borderRadius: 20,
              color: '#fff',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.3s',
              marginBottom: 24,
            }}
          >
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 6, fontWeight: 600 }}>
              {playing === topSong._id ? '✅ ¡Tocada!' : '👆 Pulsa al tocarla'}
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.2, marginBottom: 6 }}>
              {topSong.title}
            </div>
            {topSong.artist && (
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 10 }}>
                {topSong.artist}
              </div>
            )}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(249,115,22,0.3)',
              border: '1px solid rgba(249,115,22,0.5)',
              borderRadius: 20, padding: '4px 12px',
              fontSize: 16, fontWeight: 800,
            }}>
              👍 {topSong.votes} votos
            </div>
          </button>
        ) : (
          <div style={{
            textAlign: 'center', padding: '40px 20px',
            background: 'var(--surface)', borderRadius: 20,
            color: 'var(--muted)', marginBottom: 24,
          }}>
            <div style={{ fontSize: 32 }}>🎵</div>
            <p style={{ margin: '8px 0 0' }}>Sin peticiones aún</p>
          </div>
        )}

        {/* Lista de canciones para borrar */}
        <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
          🗑 Gestión del repertorio
        </p>

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
              border: '1px solid #222',
            }}
          >
            <span style={{ fontSize: 12, color: 'var(--muted)', minWidth: 24, fontWeight: 700 }}>
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
              color: song.votes > 0 ? 'var(--accent)' : 'var(--muted)',
              minWidth: 40, textAlign: 'right',
            }}>
              👍{song.votes}
            </span>

            {confirmDelete === song._id ? (
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => setConfirmDelete(null)}
                  style={smallBtn('#333', '#aaa')}
                >
                  No
                </button>
                <button
                  onClick={() => deleteSong(song._id)}
                  style={smallBtn('#7f1d1d', '#fca5a5')}
                >
                  Sí
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(song._id)}
                style={smallBtn('#1c1c1c', '#555')}
              >
                🗑
              </button>
            )}
          </div>
        ))}

        {songs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>
            No hay canciones
          </div>
        )}

        {/* Silenciar/Ignorar segunda canción rápido */}
        {restSongs.length > 0 && (
          <>
            <p style={{ margin: '24px 0 10px', fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
              ⚡ Siguientes en cola
            </p>
            {restSongs.slice(0, 3).map((song, i) => (
              <div key={song._id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 14px', marginBottom: 8,
                background: 'var(--surface)', borderRadius: 14,
                border: '1px solid #1a1a1a',
                opacity: 0.75,
              }}>
                <span style={{ fontSize: 12, color: 'var(--muted)', minWidth: 24 }}>#{i + 2}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {song.title}
                  </div>
                  {song.artist && <div style={{ fontSize: 11, color: 'var(--muted)' }}>{song.artist}</div>}
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)' }}>👍{song.votes}</span>
                <button
                  onClick={() => markPlayed(song._id)}
                  style={smallBtn('#1c1c1c', '#666')}
                  title="Marcar como tocada"
                >
                  ✅
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
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
  };
}
