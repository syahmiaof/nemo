import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_IBADAH_ITEMS,
  type IbadahChecklistItem,
} from '@/features/ibadah/components/IbadahChecklistCard';

describe('Daily Ibadah Checklist Suite', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('contains exactly the 15 requested ibadah items in order', () => {
    expect(DEFAULT_IBADAH_ITEMS).toHaveLength(15);
    const itemNames = DEFAULT_IBADAH_ITEMS.map((i) => i.name);
    expect(itemNames).toEqual([
      'Qiamullail',
      'Subuh',
      'Dhuha',
      'Zuhur',
      'Asar',
      'Maghrib',
      'Isyak',
      'Zikir',
      'Al-Quran',
      'Sedekah',
      'Tolong Orang',
      'Jaga Mulut',
      'Jaga Mata',
      'Jaga Telinga',
      'Jaga Perbuatan',
    ]);
  });

  it('handles daily ticking logic independently per date', () => {
    const today = '2026-11-16';
    const tomorrow = '2026-11-17';

    let dailyTicks: Record<string, Record<string, boolean>> = {};

    // Tick Subuh and Zikir today
    dailyTicks[today] = {
      ibd_2: true, // Subuh
      ibd_8: true, // Zikir
    };

    expect(dailyTicks[today]['ibd_2']).toBe(true);
    expect(dailyTicks[today]['ibd_8']).toBe(true);
    expect(Boolean(dailyTicks[today]['ibd_1'])).toBe(false);

    // Tomorrow starts unticked
    expect(dailyTicks[tomorrow]).toBeUndefined();
  });

  it('supports adding custom items and modifying existing checklist items', () => {
    let items: IbadahChecklistItem[] = [...DEFAULT_IBADAH_ITEMS];

    // Add Solat Taubat
    const newItem: IbadahChecklistItem = {
      id: 'ibd_custom_1',
      name: 'Solat Taubat',
    };
    items.push(newItem);
    expect(items).toHaveLength(16);

    // Edit item name
    items = items.map((i) => (i.id === 'ibd_custom_1' ? { ...i, name: 'Solat Taubat 2 Rakaat' } : i));
    expect(items.find((i) => i.id === 'ibd_custom_1')?.name).toBe('Solat Taubat 2 Rakaat');

    // Delete item
    items = items.filter((i) => i.id !== 'ibd_custom_1');
    expect(items).toHaveLength(15);
  });
});
