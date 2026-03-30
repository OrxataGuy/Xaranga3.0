'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';

interface Song {
  _id: string;
  title: string;
  artist?: string;
  votes: number;
  isRequested: boolean;
}

export default function ClientPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [popId, setPopId] = useState<string | null>(null);
  const [addedCount, setAddedCount] = useState(0);
  const [logoError, setLogoError] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Recuperar vots del localStorage en muntar
  useEffect(() => {
    try {
      const stored = localStorage.getItem('espurna_voted');
      if (stored) setVotedIds(new Set(JSON.parse(stored)));
    } catch { /* ignorar */ }
  }, []);

  // Persistir vots al localStorage
  useEffect(() => {
    try {
      localStorage.setItem('espurna_voted', JSON.stringify([...votedIds]));
    } catch { /* ignorar */ }
  }, [votedIds]);

  // SSE: actualitzar cançons en directe
  useEffect(() => {
    const es = new EventSource('/api/sse');
    es.onmessage = (e) => setSongs(JSON.parse(e.data));
    return () => es.close();
  }, []);

  // Quan una cançó es toca (votes → 0), treure-la dels votats perquè es puga tornar a votar
  useEffect(() => {
    if (songs.length === 0 || votedIds.size === 0) return;
    setVotedIds(prev => {
      let changed = false;
      const next = new Set(prev);
      for (const id of prev) {
        const song = songs.find(s => s._id === id);
        if (song && song.votes === 0) { next.delete(id); changed = true; }
      }
      return changed ? next : prev;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songs]);

  const filtered = songs.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      (s.artist?.toLowerCase().includes(q) ?? false)
    );
  });

  const vote = useCallback(async (id: string) => {
    if (votedIds.has(id)) return;
    setVotedIds((prev) => new Set([...prev, id]));
    setPopId(id);
    setTimeout(() => setPopId(null), 300);
    await fetch(`/api/songs/${id}/vote`, { method: 'POST' });
  }, [votedIds]);

  const addSong = async () => {
    if (!newTitle.trim()) return;
    setLoading(true);
    setError('');

    const res = await fetch('/api/songs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim(), artist: newArtist.trim() }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error en afegir la cançó");
      return;
    }

    setAddedCount((c) => c + 1);
    setNewTitle('');
    setNewArtist('');
    setShowForm(false);
  };

  const exactMatch = songs.some(
    (s) => s.title.toLowerCase() === search.toLowerCase()
  );

  const remaining = 3 - addedCount;

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100dvh', maxWidth: 520, margin: '0 auto', paddingBottom: 80 }}>

      {/* ── CAPÇALERA ── */}
      <header style={{
        background: 'var(--accent)',
        padding: '16px 16px 14px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        boxShadow: '0 4px 24px rgba(0,74,173,0.5)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          {/* Logo */}
          {!logoError ? (
            <Image
              src="/logo.png"
              alt="Xaranga L'Espurna"
              width={44}
              height={44}
              style={{ borderRadius: 10, objectFit: 'contain' }}
              onError={() => setLogoError(true)}
            />
          ) : (
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24,
            }}>🎺</div>
          )}

          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>
              Xaranga L&apos;Espurna
            </h1>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
              Peticions en directe
            </p>
          </div>

          {/* Comptador de demandes restants */}
          {addedCount > 0 && (
            <div style={{
              background: remaining === 0 ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.15)',
              border: `1px solid ${remaining === 0 ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.25)'}`,
              color: '#fff',
              fontSize: 11,
              fontWeight: 700,
              padding: '5px 10px',
              borderRadius: 20,
              textAlign: 'center',
              lineHeight: 1.3,
            }}>
              {remaining > 0
                ? <><span style={{ fontSize: 14 }}>{remaining}</span><br />restants</>
                : <>límit<br />assolit</>
              }
            </div>
          )}
        </div>

        {/* Camp de cerca */}
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
            fontSize: 16, pointerEvents: 'none',
          }}>🔍</span>
          <input
            ref={searchRef}
            type="text"
            placeholder="Cerca una cançó..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '13px 16px 13px 42px',
              fontSize: 16,
              borderRadius: 14,
              border: 'none',
              background: 'rgba(255,255,255,0.95)',
              color: '#111',
              outline: 'none',
              fontWeight: 500,
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: '#ccc', color: '#555', border: 'none',
                borderRadius: '50%', width: 22, height: 22,
                fontSize: 13, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >✕</button>
          )}
        </div>
      </header>

      {/* ── BOTÓ DEMANAR ── */}
      <div style={{ padding: '12px 16px 0' }}>
        {search && !exactMatch ? (
          <button
            onClick={() => { setShowForm(true); setNewTitle(search); }}
            style={requestBtnStyle}
          >
            <span style={{ fontSize: 22, lineHeight: 1 }}>＋</span>
            Demanar &ldquo;{search}&rdquo;
          </button>
        ) : !search ? (
          <button onClick={() => setShowForm(true)} style={requestBtnStyle}>
            <span style={{ fontSize: 22, lineHeight: 1 }}>＋</span>
            Demanar una cançó nova
          </button>
        ) : null}
      </div>

      {/* ── MODAL DEMANAR CANÇÓ ── */}
      {showForm && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(2,12,30,0.85)',
            display: 'flex', alignItems: 'flex-end',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setShowForm(false)}
        >
          <div
            className="fadeSlideUp"
            style={{
              background: 'var(--surface)',
              width: '100%',
              borderRadius: '22px 22px 0 0',
              padding: '8px 0 0',
              maxWidth: 520,
              margin: '0 auto',
              borderTop: '1px solid var(--surface3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Indicador drag */}
            <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--surface3)', margin: '0 auto 20px' }} />

            <div style={{ padding: '0 20px 36px' }}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 34 }}>🎵</div>
                <h2 style={{ margin: '8px 0 4px', fontSize: 20, fontWeight: 800 }}>Demanar cançó</h2>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13 }}>
                  Pots demanar fins a 3 cançons cada 10 minuts
                </p>
              </div>

              {error && (
                <div style={{
                  background: 'var(--danger-bg)',
                  border: '1px solid rgba(239,68,68,0.4)',
                  color: '#fca5a5',
                  padding: '11px 14px',
                  borderRadius: 12,
                  marginBottom: 14,
                  fontSize: 14,
                }}>
                  ⚠️ {error}
                </div>
              )}

              <input
                autoFocus
                type="text"
                placeholder="Nom de la cançó *"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSong()}
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="Artista (opcional)"
                value={newArtist}
                onChange={(e) => setNewArtist(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSong()}
                style={{ ...inputStyle, marginTop: 10 }}
              />

              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button
                  onClick={() => { setShowForm(false); setError(''); }}
                  style={{
                    flex: 1, padding: '15px', borderRadius: 14,
                    background: 'var(--surface2)',
                    color: 'var(--secondary)',
                    border: 'none', fontSize: 15, fontWeight: 600,
                  }}
                >
                  Cancel·lar
                </button>
                <button
                  onClick={addSong}
                  disabled={loading || !newTitle.trim()}
                  style={{
                    flex: 2, padding: '15px', borderRadius: 14,
                    background: loading || !newTitle.trim() ? 'var(--surface3)' : 'var(--accent-bright)',
                    color: loading || !newTitle.trim() ? 'var(--muted)' : '#fff',
                    border: 'none', fontSize: 15, fontWeight: 700,
                    transition: 'background 0.2s',
                  }}
                >
                  {loading ? 'Afegint...' : '🎺 Demanar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── LLISTA DE CANÇONS ── */}
      <div style={{ padding: '12px 16px 0' }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--muted)' }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>🎵</div>
            <p style={{ margin: 0, fontSize: 15 }}>
              {search ? 'Cap cançó coincidix' : 'Encara no hi ha cançons'}
            </p>
          </div>
        )}

        {filtered.map((song, i) => (
          <SongCard
            key={song._id}
            song={song}
            rank={i + 1}
            voted={votedIds.has(song._id)}
            isPopping={popId === song._id}
            onVote={() => vote(song._id)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Estils reutilitzables ──

const requestBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '15px',
  background: 'var(--surface)',
  color: 'var(--accent-bright)',
  border: '2px dashed var(--accent-bright)',
  borderRadius: 16,
  fontSize: 15,
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px 16px',
  fontSize: 16,
  borderRadius: 14,
  border: '2px solid var(--surface3)',
  background: 'var(--surface2)',
  color: 'var(--text)',
  outline: 'none',
};

// ── Component targeta cançó ──

function SongCard({
  song,
  rank,
  voted,
  isPopping,
  onVote,
}: {
  song: Song;
  rank: number;
  voted: boolean;
  isPopping: boolean;
  onVote: () => void;
}) {
  const isTop = rank === 1;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '13px 14px',
      marginBottom: 8,
      background: isTop
        ? 'linear-gradient(135deg, #010a1c 0%, #021638 60%, #0a2a5e 100%)'
        : 'var(--surface)',
      borderRadius: 16,
      border: isTop
        ? '1px solid rgba(240,180,41,0.4)'
        : '1px solid var(--border)',
      boxShadow: isTop ? '0 2px 16px rgba(0,74,173,0.3)' : 'none',
    }}>

      {/* Posició */}
      <div style={{
        minWidth: 30,
        textAlign: 'center',
        fontSize: isTop ? 22 : 13,
        color: isTop ? 'var(--gold)' : 'var(--muted)',
        fontWeight: 800,
        flexShrink: 0,
      }}>
        {isTop ? '🏆' : `#${rank}`}
      </div>

      {/* Títol i artista */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 15,
          fontWeight: 700,
          color: isTop ? '#fff' : 'var(--text)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {song.title}
        </div>
        {song.artist && (
          <div style={{
            fontSize: 12,
            color: isTop ? 'rgba(255,255,255,0.55)' : 'var(--muted)',
            marginTop: 2,
          }}>
            {song.artist}
          </div>
        )}
      </div>

      {/* Botó votar + comptador */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flexShrink: 0 }}>
        <button
          onClick={onVote}
          className={isPopping ? 'pop' : ''}
          aria-label={`Votar ${song.title}`}
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            border: voted ? '2px solid var(--success)' : '2px solid transparent',
            background: voted
              ? 'rgba(34,197,94,0.12)'
              : isTop
                ? 'var(--accent-bright)'
                : 'var(--surface2)',
            color: voted ? 'var(--success)' : '#fff',
            fontSize: 22,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s',
          }}
        >
          {voted ? '✓' : '👍'}
        </button>
        <span style={{
          fontSize: 14,
          fontWeight: 800,
          color: isTop ? 'var(--gold)' : 'var(--text-soft)',
        }}>
          {song.votes}
        </span>
      </div>
    </div>
  );
}
