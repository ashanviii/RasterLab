export interface SampleImage {
  id: string;
  name: string;
  src: string;
}

/**
 * Drop image files into public/samples/ using these exact filenames
 * and they'll automatically appear in the "Try one of these" row.
 */
export const SAMPLE_IMAGES: SampleImage[] = [
  { id: 'sample-1', name: 'sample-1.jpg', src: '/samples/sample-1.jpg' },
  { id: 'sample-2', name: 'sample-2.jpg', src: '/samples/sample-2.jpg' },
  { id: 'sample-3', name: 'sample-3.jpg', src: '/samples/sample-3.jpg' },
  { id: 'sample-4', name: 'sample-4.jpg', src: '/samples/sample-4.jpg' },
];
