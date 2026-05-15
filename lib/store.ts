import { create } from "zustand";

export interface NoteItem {
  _id: string;
  title: string;
  content: string;
  tags: string[];
  category: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NoteStore {
  selectedNoteId: string | null;
  setSelectedNoteId: (id: string | null) => void;
}

export const useNoteStore = create<NoteStore>((set) => ({
  selectedNoteId: null,
  setSelectedNoteId: (id) => set({ selectedNoteId: id }),
}));
