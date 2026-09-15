import { BuddyProfile } from '../buddy/types';
export type Category = 'color' | 'hat' | 'faceAccessory' | 'clothing';
export interface Cosmetic { id: string; name: string; category: Category; price: number; asset: string; color?: string }
// Assets are semantic keys rendered by CosmeticLayers; replace the renderer for final art.
export const catalog: Cosmetic[] = [
  { id: 'color_lavender', name: 'Lavender', category: 'color', price: 0, asset: 'body', color: '#AB91CF' },
  { id: 'color_mint', name: 'Mint', category: 'color', price: 20, asset: 'body', color: '#86B8A0' },
  { id: 'color_peach', name: 'Peach', category: 'color', price: 20, asset: 'body', color: '#E1A184' },
  { id: 'color_sky', name: 'Sky', category: 'color', price: 20, asset: 'body', color: '#85ADD5' },
  { id: 'color_rose', name: 'Rose', category: 'color', price: 25, asset: 'body', color: '#CE8EAA' },
  { id: 'hat_baseball', name: 'Baseball cap', category: 'hat', price: 75, asset: 'cap' },
  { id: 'hat_beanie', name: 'Beanie', category: 'hat', price: 50, asset: 'beanie' },
  { id: 'hat_cowboy', name: 'Cowboy hat', category: 'hat', price: 90, asset: 'cowboy' },
  { id: 'hat_crown', name: 'Crown', category: 'hat', price: 150, asset: 'crown' },
  { id: 'face_sunglasses', name: 'Sunglasses', category: 'faceAccessory', price: 60, asset: 'sunglasses' },
  { id: 'face_round', name: 'Round glasses', category: 'faceAccessory', price: 40, asset: 'round' },
  { id: 'clothing_hoodie', name: 'Hoodie', category: 'clothing', price: 80, asset: 'hoodie' },
  { id: 'clothing_suit', name: 'Suit', category: 'clothing', price: 120, asset: 'suit' },
  { id: 'clothing_pajamas', name: 'Pajamas', category: 'clothing', price: 65, asset: 'pajamas' },
];
export const starterItems = catalog.filter(item => item.price === 0).map(item => item.id);
export const categories: { id: Category; title: string }[] = [
  { id: 'color', title: 'Body' }, { id: 'hat', title: 'Head' }, { id: 'faceAccessory', title: 'Face' }, { id: 'clothing', title: 'Outfit' },
];
export function isEquipped(profile: BuddyProfile, item: Cosmetic) {
  return item.category === 'color' ? profile.color === item.color : profile[item.category] === item.id;
}
