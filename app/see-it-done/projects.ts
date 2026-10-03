export type ShowcaseProject = {
  id: string;
  title: string;
  category: 'kitchen' | 'closet' | 'bathroom' | 'built-in' | 'other';
  summary: string;
  locationArea: string;
  crew?: string;
  beforeMedia?: { src: string; alt: string };
  afterMedia?: { src: string; alt: string };
  conceptVideo?: { src: string; poster: string; posterAlt: string; transcript: string };
  materials: { name: string; amazonUrl?: string; note?: string }[];
  sample: boolean;
};

// Concept media is illustrative, not a customer job or proof of completed work.
// Replace samples only with consented, verified real projects and materials.
export const showcaseProjects: ShowcaseProject[] = [
  {
    id: 'built-in-bedroom-concept',
    title: 'Built-in bedroom idea',
    category: 'built-in',
    summary: 'An AI-made visualization of a cluttered room becoming a tidy bedroom with a built-in bunk, drawers, and shelves. It shows a design direction—not a completed job or a guaranteed result.',
    locationArea: 'Subcontractor availability depends on your location and scope',
    conceptVideo: {
      src: '/see-it-done/built-in-bedroom-concept.mp4',
      poster: '/see-it-done/built-in-bedroom-poster.jpg',
      posterAlt: 'AI concept of a built-in bedroom with bunk bed and shelving',
      transcript: 'A cluttered room clears. A white built-in bunk bed with drawers and bookshelves appears as the room changes into a styled bedroom. This is an AI visualization, not footage of construction work.',
    },
    materials: [{ name: 'Design inspiration only', note: 'No product or material has been verified for a real installation.' }],
    sample: true,
  },
  {
    id: 'kitchen-transformation-concept',
    title: 'Kitchen transformation idea',
    category: 'kitchen',
    summary: 'An AI-made visualization of a busy kitchen becoming a clean space with updated cabinetry, counters, and lighting. It is inspiration, not footage of an installation or a promised result.',
    locationArea: 'Subcontractor availability depends on your location and scope',
    conceptVideo: {
      src: '/see-it-done/kitchen-transformation-concept.mp4',
      poster: '/see-it-done/kitchen-transformation-poster.jpg',
      posterAlt: 'AI concept of a kitchen with dark lower cabinets, pale upper cabinets, and clear counters',
      transcript: 'A cluttered kitchen changes into a clean, modern-looking kitchen. Cabinets, counters, flooring, and lighting visually shift during the AI transformation. This is an illustrative visualization, not actual construction footage.',
    },
    materials: [{ name: 'Design inspiration only', note: 'No product or material has been verified for a real installation.' }],
    sample: true,
  },
];

export function getShowcaseProject(id: string) {
  return showcaseProjects.find(project => project.id === id);
}
