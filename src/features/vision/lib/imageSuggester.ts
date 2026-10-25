export interface VisionImagePreset {
  id: string;
  url: string;
  thumbnailUrl: string;
  title: string;
  keywords: string[];
  category: 'wealth_finance' | 'career_tech' | 'travel_adventure' | 'health_lifestyle' | 'personal_spiritual' | 'other';
}

export const CURATED_VISION_PRESETS: VisionImagePreset[] = [
  // --- TECH & BATTLESTATION ---
  {
    id: 'tech-desk-1',
    url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=400&q=80',
    title: 'Minimal Dual-Monitor Desk Setup',
    keywords: ['setup', 'desk', 'workspace', 'monitor', 'battlestation', 'office', 'apple', 'macbook', 'pc', 'gaming', 'computer'],
    category: 'career_tech',
  },
  {
    id: 'tech-code-mac',
    url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=400&q=80',
    title: 'Modern Software Engineering Workflow',
    keywords: ['code', 'coding', 'developer', 'software', 'programming', 'laptop', 'coffee', 'saas', 'app', 'freelance'],
    category: 'career_tech',
  },
  {
    id: 'tech-ultrawide',
    url: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=400&q=80',
    title: 'Ultrawide Clean Aesthetic Studio',
    keywords: ['studio', 'ultrawide', 'designer', 'minimalist', 'clean', 'audio', 'mechanical', 'keyboard'],
    category: 'career_tech',
  },

  // --- AUTOMOTIVE & CARS ---
  {
    id: 'car-sport-sedan',
    url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=400&q=80',
    title: 'High-Performance Sports Sedan',
    keywords: ['car', 'civic', 'sedan', 'honda', 'bmw', 'mercedes', 'kereta', 'drive', 'auto', 'vehicle', 'turbo'],
    category: 'wealth_finance',
  },
  {
    id: 'car-supercar',
    url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80',
    title: 'Porsche 911 Mountain Pass',
    keywords: ['porsche', 'supercar', 'speed', 'sportscar', 'ferrari', 'luxury car', 'fast', 'track'],
    category: 'wealth_finance',
  },
  {
    id: 'car-suv',
    url: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=400&q=80',
    title: 'Luxury 4x4 SUV',
    keywords: ['suv', 'gwagon', 'ranger', '4x4', 'offroad', 'land cruiser', 'adventure car', 'jeep'],
    category: 'wealth_finance',
  },

  // --- TRAVEL & PILGRIMAGE ---
  {
    id: 'travel-umrah',
    url: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=400&q=80',
    title: 'Holy Makkah & Umrah Pilgrimage',
    keywords: ['umrah', 'makkah', 'hajj', 'madinah', 'kaaba', 'mosque', 'masjid', 'ziarah', 'spiritual', 'islam', 'islamic'],
    category: 'personal_spiritual',
  },
  {
    id: 'travel-japan-kyoto',
    url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=400&q=80',
    title: 'Kyoto Historic Pagoda & Streets',
    keywords: ['japan', 'kyoto', 'tokyo', 'osaka', 'shibuya', 'asia', 'travel', 'sakura', 'cherry blossom', 'vacation', 'holiday'],
    category: 'travel_adventure',
  },
  {
    id: 'travel-mount-fuji',
    url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=400&q=80',
    title: 'Mount Fuji & Sakura Spring',
    keywords: ['fuji', 'mount fuji', 'japan travel', 'spring', 'blossom', 'nature', 'landscape'],
    category: 'travel_adventure',
  },
  {
    id: 'travel-switzerland',
    url: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=400&q=80',
    title: 'Swiss Alps Mountain Panorama',
    keywords: ['switzerland', 'swiss', 'alps', 'mountains', 'europe', 'snow', 'hike', 'hiking', 'scenic'],
    category: 'travel_adventure',
  },
  {
    id: 'travel-maldives-beach',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',
    title: 'Maldives Crystal Lagoon & Beach',
    keywords: ['beach', 'maldives', 'bali', 'island', 'ocean', 'resort', 'sea', 'summer', 'pantai', 'cuti', 'tropical'],
    category: 'travel_adventure',
  },
  {
    id: 'travel-northern-lights',
    url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=400&q=80',
    title: 'Aurora Borealis in Iceland / Norway',
    keywords: ['aurora', 'northern lights', 'iceland', 'norway', 'stars', 'night', 'wonder'],
    category: 'travel_adventure',
  },

  // --- WEALTH, ASSETS & HOME ---
  {
    id: 'home-modern-villa',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80',
    title: 'Contemporary Architectural Villa',
    keywords: ['house', 'home', 'villa', 'property', 'rumah', 'mansion', 'pool', 'architecture', 'estate', 'real estate', 'dream home'],
    category: 'wealth_finance',
  },
  {
    id: 'wealth-gold-bars',
    url: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=400&q=80',
    title: 'Gold Bullion & Wealth Preservation',
    keywords: ['gold', 'emas', 'bullion', 'wealth', 'rich', 'financial', 'fund', 'reserve', 'millionaire', 'net worth'],
    category: 'wealth_finance',
  },
  {
    id: 'wealth-investments',
    url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=400&q=80',
    title: 'Compounding Investment & Trading Growth',
    keywords: ['invest', 'investment', 'stock', 'crypto', 'portfolio', 'dividend', 'wealth', 'savings', 'emergency fund', 'compound', 'growth'],
    category: 'wealth_finance',
  },
  {
    id: 'home-interior-living',
    url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=400&q=80',
    title: 'Warm Minimalist Scandinavian Living Space',
    keywords: ['interior', 'living room', 'furniture', 'decor', 'sofa', 'aesthetic home', 'comfort'],
    category: 'personal_spiritual',
  },
  {
    id: 'luxury-watch',
    url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80',
    title: 'Horology Timepiece Milestone',
    keywords: ['watch', 'jam', 'rolex', 'omega', 'luxury', 'milestone', 'accessory'],
    category: 'wealth_finance',
  },

  // --- HEALTH & FITNESS ---
  {
    id: 'fitness-strength-gym',
    url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=80',
    title: 'Peak Athletic Strength & Conditioning',
    keywords: ['gym', 'fitness', 'workout', 'barbell', 'strength', 'muscle', 'badan', 'fit', 'training', 'exercise', 'physique'],
    category: 'health_lifestyle',
  },
  {
    id: 'fitness-running-marathon',
    url: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&w=400&q=80',
    title: 'Sunrise Trail Running & Marathon Endurance',
    keywords: ['run', 'running', 'marathon', 'jogging', 'trail', 'endurance', 'cardio', 'stamina'],
    category: 'health_lifestyle',
  },
  {
    id: 'health-healthy-diet',
    url: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=400&q=80',
    title: 'Clean Nutrition & Vibrant Energy',
    keywords: ['food', 'diet', 'nutrition', 'healthy', 'meal prep', 'salad', 'clean eating', 'vitality'],
    category: 'health_lifestyle',
  },
  {
    id: 'wellness-peace-meditation',
    url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=400&q=80',
    title: 'Mindfulness, Clarity & Mental Balance',
    keywords: ['meditation', 'yoga', 'mindfulness', 'peace', 'mental health', 'calm', 'sunrise', 'serenity', 'balance'],
    category: 'personal_spiritual',
  },

  // --- CAREER, KEYNOTE & IMPACT ---
  {
    id: 'career-keynote-stage',
    url: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=400&q=80',
    title: 'Keynote Speaker & Industry Authority',
    keywords: ['stage', 'speaker', 'presentation', 'conference', 'keynote', 'leadership', 'influence', 'audience'],
    category: 'career_tech',
  },
  {
    id: 'career-startup-rocket',
    url: 'https://images.unsplash.com/photo-1517976487504-59a1a349c211?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517976487504-59a1a349c211?auto=format&fit=crop&w=400&q=80',
    title: 'Exponential Business Launch & Scale',
    keywords: ['rocket', 'launch', 'startup', 'scale', 'founder', 'business', 'company', 'exponential', 'success'],
    category: 'career_tech',
  },
];

/**
 * Intelligent image suggestions based on title text and optional category
 */
export function suggestImagesForVision(title: string, category?: string): VisionImagePreset[] {
  const normalized = title.toLowerCase().trim();
  const words = normalized.split(/[\s,.-_]+/).filter(w => w.length > 2);

  // Score each preset
  const scored = CURATED_VISION_PRESETS.map((preset) => {
    let score = 0;

    // Exact title phrase match
    if (normalized.length > 0 && preset.title.toLowerCase().includes(normalized)) {
      score += 10;
    }

    // Keyword match
    for (const word of words) {
      if (preset.keywords.some((k) => k.includes(word) || word.includes(k))) {
        score += 5;
      }
      if (preset.title.toLowerCase().includes(word)) {
        score += 3;
      }
    }

    // Category boost
    if (category && preset.category === category) {
      score += 2;
    }

    return { preset, score };
  });

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  // If top scores have high relevance, return top matches
  const topMatches = scored.filter(s => s.score > 0).map(s => s.preset);

  if (topMatches.length >= 4) {
    return topMatches.slice(0, 6);
  }

  // Otherwise supplement with category or versatile defaults
  const results = [...topMatches];
  for (const item of CURATED_VISION_PRESETS) {
    if (!results.some(r => r.id === item.id)) {
      if (!category || item.category === category) {
        results.push(item);
      }
      if (results.length >= 6) break;
    }
  }

  // If still under 4, add whatever is available
  for (const item of CURATED_VISION_PRESETS) {
    if (!results.some(r => r.id === item.id)) {
      results.push(item);
      if (results.length >= 6) break;
    }
  }

  return results.slice(0, 6);
}
