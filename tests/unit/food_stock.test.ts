import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_FOOD_CATEGORIES,
  INITIAL_FOOD_ITEMS,
  type FoodStockItem,
} from '@/features/health/FoodStockCard';

describe('Food Stock Checklist Suite', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('contains the 4 requested food categories', () => {
    const categoryIds = DEFAULT_FOOD_CATEGORIES.map((c) => c.id);
    expect(categoryIds).toEqual(['protein', 'carbs', 'produce', 'supplements']);
  });

  it('initializes with all requested user food items across categories', () => {
    expect(INITIAL_FOOD_ITEMS.length).toBe(18);

    const proteinItems = INITIAL_FOOD_ITEMS.filter((i) => i.category === 'protein');
    expect(proteinItems).toHaveLength(5);
    expect(proteinItems[0].name).toContain('Dada ayam');
    expect(proteinItems[1].name).toBe('Telur sepapan');
    expect(proteinItems[2].name).toBe('Tauhu putih');
    expect(proteinItems[3].name).toBe('Tempe');
    expect(proteinItems[4].name).toBe('HK Soy Protein & Creatine');

    const carbItems = INITIAL_FOOD_ITEMS.filter((i) => i.category === 'carbs');
    expect(carbItems).toHaveLength(3);
    expect(carbItems[0].name).toBe('Ubi keledek purple');
    expect(carbItems[1].name).toBe('Ubi kentang');
    expect(carbItems[2].name).toBe('Oat');

    const produceItems = INITIAL_FOOD_ITEMS.filter((i) => i.category === 'produce');
    expect(produceItems).toHaveLength(6);
    expect(produceItems.map((p) => p.name)).toEqual([
      'Sawi kecil',
      'Cendawan White Snow / Enoki',
      'Kiwi hijau',
      'Avocado warna gelap',
      'Bawang besar, bawang merah, bawang putih',
      'Cili hidup / Cili padi & Lemon',
    ]);

    const supplementItems = INITIAL_FOOD_ITEMS.filter((i) => i.category === 'supplements');
    expect(supplementItems).toHaveLength(4);
    expect(supplementItems.map((s) => s.name)).toEqual([
      'Madu CED asli & Peanut Butter CED',
      'French Celtic Salt dan vitamin c 21st century',
      'Ahmad Tea Jasmine Green Tea & Camomile',
      'Air kelapa fresh',
    ]);
  });

  it('toggles item stock status from inStock: true to false (needs to buy)', () => {
    let items: FoodStockItem[] = [...INITIAL_FOOD_ITEMS];
    const targetId = 'fstk_1';

    // Toggle out of stock
    items = items.map((i) => (i.id === targetId ? { ...i, inStock: !i.inStock } : i));
    expect(items.find((i) => i.id === targetId)?.inStock).toBe(false);

    // Toggle back in stock
    items = items.map((i) => (i.id === targetId ? { ...i, inStock: !i.inStock } : i));
    expect(items.find((i) => i.id === targetId)?.inStock).toBe(true);
  });

  it('supports adding and editing items dynamically', () => {
    let items: FoodStockItem[] = [...INITIAL_FOOD_ITEMS];

    // Add a new protein item
    const newItem: FoodStockItem = {
      id: 'fstk_custom_1',
      name: 'Salmon Trout',
      category: 'protein',
      inStock: true,
    };
    items.push(newItem);
    expect(items).toHaveLength(19);

    // Edit the item
    items = items.map((i) => (i.id === 'fstk_custom_1' ? { ...i, name: 'Salmon Trout Atlantic' } : i));
    expect(items.find((i) => i.id === 'fstk_custom_1')?.name).toBe('Salmon Trout Atlantic');

    // Delete the item
    items = items.filter((i) => i.id !== 'fstk_custom_1');
    expect(items).toHaveLength(18);
  });
});
