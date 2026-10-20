import { describe, it, expect, beforeEach } from 'vitest';
import { db, resetWorkspaceData } from '@/db/nemoDb';
import { getInitials, saveProfileAvatar, removeProfileAvatar } from '@/lib/avatar';

describe('Profile Avatar System', () => {
  beforeEach(async () => {
    await resetWorkspaceData();
  });

  describe('Initials Generation', () => {
    it('computes initials correctly from various name strings', () => {
      expect(getInitials('Alex Rivers')).toBe('AR');
      expect(getInitials('Alex')).toBe('A');
      expect(getInitials('Jane Mary Doe')).toBe('JD');
      expect(getInitials('')).toBe('N');
      expect(getInitials(null)).toBe('N');
      expect(getInitials(undefined)).toBe('N');
    });
  });

  describe('Avatar Storage and Lifecycle', () => {
    it('stores compressed avatar in db.assetBlobs and updates settings.avatarBlobId', async () => {
      // Create a small mock image blob
      const svgString = '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#A8DCC8"/></svg>';
      const blob = new Blob([svgString], { type: 'image/svg+xml' });

      const newBlobId = await saveProfileAvatar(blob);

      expect(newBlobId).toBeDefined();
      expect(newBlobId).toContain('avatar-');

      // Check settings table
      const settings = await db.settings.get('default');
      expect(settings?.avatarBlobId).toBe(newBlobId);

      // Check assetBlobs table
      const storedBlob = await db.assetBlobs.get(newBlobId);
      expect(storedBlob).toBeDefined();
      expect(storedBlob?.ownerType).toBe('profile');
      expect(storedBlob?.ownerId).toBe('default');
      expect(storedBlob?.data).toBeDefined();
    });

    it('replaces previous avatar and deletes orphan blobs', async () => {
      const blob1 = new Blob(['image 1'], { type: 'image/jpeg' });
      const blob2 = new Blob(['image 2'], { type: 'image/png' });

      const id1 = await saveProfileAvatar(blob1);
      const id2 = await saveProfileAvatar(blob2);

      const allProfileBlobs = await db.assetBlobs.where('ownerType').equals('profile').toArray();
      expect(allProfileBlobs.length).toBe(1);
      expect(allProfileBlobs[0].id).toBe(id2);

      const oldBlob = await db.assetBlobs.get(id1);
      expect(oldBlob).toBeUndefined();

      const settings = await db.settings.get('default');
      expect(settings?.avatarBlobId).toBe(id2);
    });

    it('removes avatar blob cleanly and clears avatarBlobId', async () => {
      const blob = new Blob(['image test'], { type: 'image/jpeg' });
      const blobId = await saveProfileAvatar(blob);

      let settings = await db.settings.get('default');
      expect(settings?.avatarBlobId).toBe(blobId);

      await removeProfileAvatar();

      settings = await db.settings.get('default');
      expect(settings?.avatarBlobId).toBeUndefined();

      const remainingBlobs = await db.assetBlobs.where('ownerType').equals('profile').toArray();
      expect(remainingBlobs.length).toBe(0);
    });
  });
});
