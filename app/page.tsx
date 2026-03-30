'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

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
  const searchRef = useRef<HTMLInputElement>(null);

  // Tiempo real: SSE
  useEffect(() => {
    const es = new EventSource('/api/sse');
    es.onmessage = (e) => {
      setSongs(JSON.parse(e.data));
    };
    return () => es.close();
  }, []);

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
      setError(data.error ?? 'Error al añadir');
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

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100dvh', maxWidth: 520, margin: '0 auto', padding: '0 0 100px' }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
        padding: '20px 16px 16px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        boxShadow: '0 4px 20px rgba(234,88,12,0.4)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: 28 }}>🎺</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1 }}>Xaranga</h1>
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>Peticiones en directo</p>
          </div>
          {addedCount > 0 && (
            <span style={{
              marginLeft: 'auto',
              background: 'rgba(0,0,0,0.3)',
              color: '#fff',
              fontSize: 11,
              padding: '3px 8px',
              borderRadius: 20,
            }}>
              {3 - addedCount} añadidos restantes
            </span>
          )}
        </div>
        <input
          ref={searchRef}
          type="text"
          placeholder="🔍  Busca una canción..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: 16,
            borderRadius: 14,
            border: 'none',
            background: 'rgba(255,255,255,0.95)',
            color: '#111',
            outline: 'none',
            fontWeight: 500,
          }}
        />
      </header>

      {/* Botón añadir canción */}
      {search && !exactMatch && (
        <div style={{ padding: '12px 16px 0' }}>
          <button
            onClick={() => { setShowForm(true); setNewTitle(search); }}
            style={{
              width: '100%',
              padding: '14px',
              background: 'var(--surface2)',
              color: 'var(--accent)',
              border: '2px dashed var(--accent)',
              borderRadius: 14,
              fontSize: 15,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 20 }}>＋</span>
            Pedir &ldquo;{search}&rdquo;
          </button>
        </div>
      )}

      {!search && (
        <div style={{ padding: '12px 16px 0' }}>
          <button
            onClick={() => setShowForm(true)}
            style={{
              width: '100%',
              padding: '14px',
              background: 'var(--surface2)',
              color: 'var(--accent)',
              border: '2px dashed var(--accent)',
              borderRadius: 14,
              fontSize: 15,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 20 }}>＋</span>
            Pedir una canción nueva
          </button>
        </div>
      )}

      {/* Modal añadir canción */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'flex-end',
        }} onClick={() => setShowForm(false)}>
          <div
            style={{
              background: 'var(--surface)',
              width: '100%',
              borderRadius: '20px 20px 0 0',
              padding: '24px 20px 40px',
              maxWidth: 520,
              margin: '0 auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 32 }}>🎵</div>
              <h2 style={{ margin: '8px 0 4px', fontSize: 20, fontWeight: 800 }}>Pedir canción</h2>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13 }}>
                Puedes pedir hasta 3 canciones cada 10 min
              </p>
            </div>

            {error && (
              <div style={{
                background: '#450a0a',
                border: '1px solid var(--danger)',
                color: '#fca5a5',
                padding: '10px 14px',
                borderRadius: 10,
                marginBottom: 12,
                fontSize: 14,
              }}>
                {error}
              </div>
            )}

            <input
              autoFocus
              type="text"
              placeholder="Nombre de la canción *"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              style={inputStyle}
            />
            <input
              type="text"
              placeholder="Artista (opcional)"
              value={newArtist}
              onChange={(e) => setNewArtist(e.target.value)}
              style={{ ...inputStyle, marginTop: 10 }}
            />

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  flex: 1, padding: '14px', borderRadius: 14,
                  background: 'var(--surface2)', color: 'var(--muted)',
                  border: 'none', fontSize: 15, fontWeight: 600,
                }}
              >
                Cancelar
              </button>
              <button
                onClick={addSong}
                disabled={loading || !newTitle.trim()}
                style={{
                  flex: 2, padding: '14px', borderRadius: 14,
                  background: loading || !newTitle.trim() ? '#555' : 'var(--accent)',
                  color: '#fff', border: 'none', fontSize: 15, fontWeight: 700,
                }}
              >
                {loading ? 'Añadiendo...' : '🎺 Pedir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de canciones */}
      <div style={{ padding: '12px 16px 0' }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🎵</div>
            <p>No hay canciones que coincidan</p>
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

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px 16px',
  fontSize: 16,
  borderRadius: 14,
  border: '2px solid #333',
  background: '#222',
  color: 'var(--text)',
  outline: 'none',
};

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
      padding: '14px',
      marginBottom: 8,
      background: isTop ? 'linear-gradient(135deg, #1c1000 0%, #2a1800 100%)' : 'var(--surface)',
      borderRadius: 16,
      border: isTop ? '1px solid #f97316' : '1px solid #2a2a2a',
    }}>
      {/* Ranking */}
      <div style={{
        minWidth: 32,
        textAlign: 'center',
        fontSize: isTop ? 20 : 13,
        color: isTop ? '#f97316' : 'var(--muted)',
        fontWeight: 800,
      }}>
        {isTop ? '🏆' : `#${rank}`}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 15,
          fontWeight: 700,
          color: 'var(--text)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {song.title}
        </div>
        {song.artist && (
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
            {song.artist}
          </div>
        )}
      </div>

      {/* Votos */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <button
          onClick={onVote}
          className={isPopping ? 'pop' : ''}
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            border: 'none',
            background: voted ? '#1a3a1a' : isTop ? 'var(--accent)' : 'var(--surface2)',
            color: voted ? 'var(--success)' : '#fff',
            fontSize: 22,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s',
          }}
        >
          {voted ? '✓' : '👍'}
        </button>
        <span style={{
          fontSize: 14,
          fontWeight: 800,
          color: isTop ? '#f97316' : 'var(--text)',
        }}>
          {song.votes}
        </span>
      </div>
    </div>
  );
}
