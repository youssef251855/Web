import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type ElementType = 'text' | 'heading' | 'image' | 'video' | 'button' | 'divider' | 'card' | 'icon' | 'spacer' | 'list' | 'quote' | 'badge' | 'map' | 'audio' | 'alert' | 'accordion' | 'pricing' | 'testimonial' | 'gallery' | 'countdown' | 'progress' | 'social' | 'form' | 'table' | 'code' | 'avatar' | 'hero' | 'stat' | 'steps' | 'rating' | 'newsletter' | 'marquee' | 'profile' | 'iframe' | 'breadcrumbs' | 'tags' | 'search' | 'banner' | 'footer' | 'logo' | 'callout' | 'checklist' | 'spinner' | 'toggle' | 'signature' | 'auth_form' | 'loading_screen';

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
  gap?: string;
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  alignItems?: string;
  fontFamily?: string;
  [key: string]: any; // Allow custom CSS properties
}

export type ActionType = 
  | 'navigate_page' 
  | 'navigate_back'    
  | 'navigate_url' 
  | 'open_modal'       
  | 'close_modal'
  | 'db_create' 
  | 'db_update'
  | 'db_delete'
  | 'db_fetch'
  | 'auth_signup' 
  | 'auth_login' 
  | 'auth_logout'
  | 'auth_reset'
  | 'file_upload' 
  | 'file_delete'
  | 'api_request'
  | 'logic_if' 
  | 'logic_delay'
  | 'logic_math'
  | 'logic_set_variable'
  | 'ui_show' 
  | 'ui_hide'
  | 'ui_set_text'
  | 'run_js';

export interface ActionStep {
  id: string;
  type: ActionType;
  params: Record<string, any>;
  conditions?: { field: string; operator: string; value: any }[];
}

export interface ElementEvent {
  id: string; // e.g. onClick, onLoad, onHover
  trigger: string;
  actions: ActionStep[];
}

export interface DataSource {
  tableId: string;
  filters?: any[];
  limit?: number;
  sort?: { field: string, direction: 'asc' | 'desc' };
}

export interface DataMapping {
  [key: string]: string; 
}

export interface PageElement {
  id: string;
  type: ElementType;
  content: any;
  style: ElementStyle;
  position: Position;
  
  // Actions replace old simple action
  events?: ElementEvent[];
  
  // Custom code & Advanced
  customCss?: string;
  customJs?: string; // Component-level lifecycle hooks or logic
  customId?: string; // Allows CSS targeting
  
  dataSource?: DataSource;
  dataMapping?: DataMapping;
}

export interface AppVariable {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  defaultValue: any;
} // State Management variables

interface BuilderState {
  elements: PageElement[];
  variables: AppVariable[];
  selectedElementId: string | null;
  isDragging: boolean;
  setElements: (elements: PageElement[]) => void;
  setVariables: (variables: AppVariable[]) => void;
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
  accordion: [{ title: 'Question 1', content: 'Answer 1' }, { title: 'Question 2', content: 'Answer 2' }],
  pricing: { plan: 'Pro', price: '$29/mo', features: ['Feature 1', 'Feature 2', 'Feature 3'] },
  testimonial: { quote: "This is amazing!", author: "John Doe", role: "CEO" },
  gallery: ['https://picsum.photos/seed/1/200/200', 'https://picsum.photos/seed/2/200/200', 'https://picsum.photos/seed/3/200/200'],
  countdown: '2026-12-31T23:59:59',
  progress: 75,
  social: ['twitter', 'facebook', 'instagram'],
  form: { title: 'Contact Us', buttonText: 'Submit' },
  table: { headers: ['Name', 'Age', 'City'], rows: [['John', '30', 'New York'], ['Jane', '25', 'London']] },
  code: '<h1>Hello World</h1>\n<p>This is raw HTML</p>',
  avatar: 'https://picsum.photos/seed/avatar/100/100',
  hero: { title: 'Welcome to my site', subtitle: 'This is a hero section', buttonText: 'Get Started' },
  stat: { value: '10K+', label: 'Happy Customers' },
  steps: [{ title: 'Step 1', description: 'Do this first' }, { title: 'Step 2', description: 'Then do this' }],
  rating: 4,
  newsletter: { title: 'Subscribe', placeholder: 'Enter email', buttonText: 'Subscribe' },
  marquee: 'Breaking News: Welcome to my awesome website! ',
  profile: { name: 'Jane Doe', role: 'Designer', bio: 'I love making things look good.', avatarUrl: 'https://picsum.photos/seed/jane/100/100' },
  iframe: 'https://example.com',
  breadcrumbs: ['Home', 'Products', 'Current'],
  tags: ['Design', 'Development', 'Marketing'],
  search: 'Search...',
  banner: { text: 'Special Offer! 50% off today.', link: '#' },
  footer: { copyright: '© 2026 My Company', links: ['Privacy', 'Terms'] },
  logo: { url: 'https://picsum.photos/seed/logo/150/50', alt: 'Company Logo' },
  callout: { emoji: '💡', text: 'This is an important tip!' },
  checklist: [{ text: 'Task 1', checked: true }, { text: 'Task 2', checked: false }],
  spinner: 'Loading...',
  toggle: { label: 'Enable notifications', checked: true },
  signature: 'John Doe',
  auth_form: { title: 'Sign Up', mode: 'signup', buttonText: 'Create Account' },
  loading_screen: { message: 'Loading...', showSpinner: true },
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
  accordion: { width: '400px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' },
  pricing: { width: '300px', padding: '24px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb', textAlign: 'center' },
  testimonial: { width: '400px', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px', fontStyle: 'italic' },
  gallery: { width: '100%', display: 'flex' },
  countdown: { fontSize: '24px', fontWeight: 'bold', color: '#ef4444', textAlign: 'center' },
  progress: { width: '300px', height: '20px', backgroundColor: '#e5e7eb', borderRadius: '9999px' },
  social: { display: 'flex', fontSize: '24px', color: '#3b82f6' },
  form: { width: '400px', padding: '24px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' },
  table: { width: '100%', border: '1px solid #e5e7eb' },
  code: { padding: '16px', backgroundColor: '#ffffff', color: '#111827', borderRadius: '8px', width: '400px' },
  avatar: { width: '100px', height: '100px', borderRadius: '50%' },
  hero: { padding: '40px 20px', textAlign: 'center', backgroundColor: '#f3f4f6', borderRadius: '12px', width: '400px' },
  stat: { textAlign: 'center', padding: '20px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', width: '200px' },
  steps: { width: '300px' },
  rating: { color: '#fbbf24', fontSize: '24px' },
  newsletter: { padding: '24px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', width: '350px' },
  marquee: { width: '400px', backgroundColor: '#1f2937', color: '#ffffff', padding: '10px' },
  profile: { padding: '24px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb', textAlign: 'center', width: '300px' },
  iframe: { width: '400px', height: '300px', border: 'none' },
  breadcrumbs: { fontSize: '14px', color: '#6b7280' },
  tags: { display: 'flex', gap: '8px', flexWrap: 'wrap', width: '300px' },
  search: { width: '300px', padding: '10px', borderRadius: '9999px', border: '1px solid #d1d5db' },
  banner: { width: '400px', padding: '12px', backgroundColor: '#3b82f6', color: '#ffffff', textAlign: 'center', borderRadius: '8px' },
  footer: { width: '400px', padding: '24px', backgroundColor: '#111827', color: '#9ca3af', textAlign: 'center', borderRadius: '8px' },
  logo: { width: '150px', height: 'auto' },
  callout: { padding: '16px', backgroundColor: '#fef3c7', borderRadius: '8px', display: 'flex', gap: '12px', alignItems: 'center', width: '300px' },
  checklist: { width: '300px' },
  spinner: { color: '#3b82f6', fontSize: '16px', fontWeight: 'bold' },
  toggle: { display: 'flex', alignItems: 'center', gap: '12px' },
  signature: { fontFamily: 'cursive', fontSize: '32px', color: '#111827' },
  auth_form: { width: '350px', padding: '24px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' },
  loading_screen: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100vw', height: '100vh', backgroundColor: '#ffffff', position: 'fixed', top: '0', left: '0', zIndex: '9999' },
};

export const useBuilderStore = create<BuilderState>((set) => ({
  elements: [],
  variables: [],
  selectedElementId: null,
  isDragging: false,
  setElements: (elements) => set({ elements }),
  setVariables: (variables) => set({ variables }),
  addElement: (type, position) => set((state) => ({
    elements: [
      ...state.elements,
      {
        id: uuidv4(),
        type,
        content: defaultContent[type],
        style: { ...defaultStyle[type] },
        position,
        events: type === 'button' ? [{ id: uuidv4(), trigger: 'onClick', actions: [] }] 
              : type === 'loading_screen' ? [{ id: uuidv4(), trigger: 'onLoad', actions: [{ id: uuidv4(), type: 'logic_delay', params: { ms: 2000 } }, { id: uuidv4(), type: 'navigate_url', params: { url: '/' } }] }]
              : [],
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
