'use client';
// Repertorio local (este dispositivo). Interfaz lista para cambiar a Supabase sin tocar la UI:
// ver supabase/migrations/0001_songs.sql.

import { SEEDS } from '../song/seeds';
import { SongSchema, type Song } from '../song/schema';

export interface SongRepo {
  list(): Promise<Song[]>;
  get(id: string): Promise<Song | null>;
  save(song: Song): Promise<void>;
  remove(id: string): Promise<void>;
}

const KEY = 'dr:songs:v1';
const seeds: Song[] = SEEDS.map((s) => SongSchema.parse(s));

function readUser(): Song[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const arr: unknown[] = JSON.parse(raw);
    return arr.flatMap((x) => { const r = SongSchema.safeParse(x); return r.success ? [r.data] : []; });
  } catch { return []; }
}

function writeUser(songs: Song[]) {
  try { window.localStorage.setItem(KEY, JSON.stringify(songs)); } catch { /* sin almacenamiento: se queda en memoria */ }
}

export const localSongRepo: SongRepo = {
  async list() {
    const user = readUser();
    const ids = new Set(user.map((s) => s.id));
    return [...user.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')), ...seeds.filter((s) => !ids.has(s.id))];
  },
  async get(id) {
    return readUser().find((s) => s.id === id) ?? seeds.find((s) => s.id === id) ?? null;
  },
  async save(song) {
    const user = readUser().filter((s) => s.id !== song.id);
    writeUser([{ ...song, createdAt: song.createdAt ?? new Date().toISOString() }, ...user]);
  },
  async remove(id) {
    writeUser(readUser().filter((s) => s.id !== id));
  },
};

export const isSeed = (id: string) => seeds.some((s) => s.id === id);
