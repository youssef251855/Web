import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type ElementType = 'text' | 'heading' | 'image' | 'video' | 'button' | 'divider' | 'card' | 'icon' | 'spacer' | 'list' | 'quote' | 'badge' | 'map' | 'audio' | 'alert';

export interface Position {
  x: number;
  y: number;
}

export interface ElementStyle {
  fontSize?: string;
  color?: string;
  backgroundColor?: string;
  width?: string;
  height?: string;
  padding?: string;
  borderRadius?: string;
  textAlign?: 'left' | 'center' | 'right';
  borderLeft?: string;
  fontStyle?: string;
  display?: string;
  fontWeight?: string;
  border?: string;
}

export interface ElementAction {
  type: 'none' | 'url' | 'page';
  value: string;
}

export interface PageElement {
  id: string;
  type: ElementType;
  content: any;
  style: ElementStyle;
  position: Position;
  action?: ElementAction;
}

interface BuilderState {
  elements: PageElement[];
  selectedElementId: string | null;
  isDragging: boolean;
  setElements: (elements: PageElement[]) => void;
  addElement: (type: ElementType, position: Position) => void;
  updateElement: (id: string, updates: Partial<PageElement>) => void;
  removeElement: (id: string) => void;
  selectElement: (id: string | null) => void;
  setIsDragging: (isDragging: boolean) => void;
}

const defaultContent: Record<ElementType, any> = {
  text: 'Double click to edit text',
  heading: 'Heading',
  image: 'https://picsum.photos/seed/placeholder/400/300',
  video: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  button: 'Click Me',
  divider: null,
  card: 'Card Content',
  icon: 'star',
  spacer: null,
  list: ['Item 1', 'Item 2', 'Item 3'],
  quote: 'This is an inspiring quote.',
  badge: 'New',
  map: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3151.83543450937!2d144.9537353153166!3d-37.81720997975171!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6ad65d4c2b349649%3A0xb6899234e561db11!2sEnvato!5e0!3m2!1sen!2sau!4v1628684675000!5m2!1sen!2sau',
  audio: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  alert: 'This is an important alert message.',
};

const defaultStyle: Record<ElementType, ElementStyle> = {
  text: { fontSize: '16px', color: '#333333' },
  heading: { fontSize: '32px', color: '#111111' },
  image: { width: '400px', height: 'auto', borderRadius: '8px' },
  video: { width: '560px', height: '315px' },
  button: { padding: '10px 20px', backgroundColor: '#3b82f6', color: '#ffffff', borderRadius: '6px' },
  divider: { width: '100%', height: '2px', backgroundColor: '#e5e7eb' },
  card: { padding: '20px', backgroundColor: '#ffffff', borderRadius: '12px', width: '300px' },
  icon: { fontSize: '24px', color: '#6b7280' },
  spacer: { width: '100%', height: '50px' },
  list: { fontSize: '16px', color: '#333333' },
  quote: { fontSize: '18px', color: '#4b5563', borderLeft: '4px solid #3b82f6', padding: '0 0 0 16px', fontStyle: 'italic' },
  badge: { padding: '4px 12px', backgroundColor: '#ef4444', color: '#ffffff', borderRadius: '9999px', fontSize: '12px', fontWeight: 'bold', display: 'inline-block' },
  map: { width: '400px', height: '300px' },
  audio: { width: '300px' },
  alert: { padding: '16px', backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #f87171', borderRadius: '8px', width: '300px' },
};

export const useBuilderStore = create<BuilderState>((set) => ({
  elements: [],
  selectedElementId: null,
  isDragging: false,
  setElements: (elements) => set({ elements }),
  addElement: (type, position) => set((state) => ({
    elements: [
      ...state.elements,
      {
        id: uuidv4(),
        type,
        content: defaultContent[type],
        style: { ...defaultStyle[type] },
        position,
        action: type === 'button' ? { type: 'none', value: '' } : undefined,
      },
    ],
  })),
  updateElement: (id, updates) => set((state) => ({
    elements: state.elements.map((el) => (el.id === id ? { ...el, ...updates } : el)),
  })),
  removeElement: (id) => set((state) => ({
    elements: state.elements.filter((el) => el.id !== id),
    selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
  })),
  selectElement: (id) => set({ selectedElementId: id }),
  setIsDragging: (isDragging) => set({ isDragging }),
}));
