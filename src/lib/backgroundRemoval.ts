import { removeBackground } from '@imgly/background-removal';

export async function removeImageBackground(imageUrl: string): Promise<Blob> {
  return removeBackground(imageUrl);
}
