import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import MarkerDetail from './MarkerDetail';

/**
 * **Validates: Requirements 4.2, 5.2**
 *
 * Property 12: Owner UI controls visibility
 * - Owner sees both Edit and Delete buttons
 * - Non-owner (different authenticated user) sees neither
 * - Visitor (unauthenticated / user=null) sees neither
 */

// Mock ContributionForm as a simple div
vi.mock('../contributions/ContributionForm', () => ({
  default: ({ markerId }) => <div data-testid="contribution-form">{markerId}</div>,
}));

// Mock API modules
vi.mock('../../api/markers', () => ({
  getMarker: vi.fn().mockResolvedValue({ data: null }),
  deleteMarker: vi.fn().mockResolvedValue({}),
}));

vi.mock('../../api/contributions', () => ({
  getContributions: vi.fn().mockResolvedValue({ data: [] }),
}));

// Mock authStore — we'll control its return per test via mockImplementation
const mockAuthStore = vi.fn();
vi.mock('../../store/authStore', () => ({
  default: (selector) => mockAuthStore(selector),
}));

// Arbitraries for generating test data
const objectIdArb = () =>
  fc.hexaString({ minLength: 24, maxLength: 24 });

const userArb = () =>
  objectIdArb().map((_id) => ({ _id, username: `user_${_id.slice(0, 6)}`, email: `${_id.slice(0, 6)}@test.com` }));

const markerWithOwnerIdArb = (ownerId) =>
  fc.record({
    _id: objectIdArb(),
    title: fc.string({ minLength: 1, maxLength: 50 }),
    category: fc.constantFrom('mural', 'graffiti', 'sculpture'),
    location: fc.constant({ type: 'Point', coordinates: [-58.4, -34.6] }),
    owner: fc.constantFrom(
      ownerId,                   // owner as string ID
      { _id: ownerId }           // owner as populated object
    ),
  });

const markerWithDifferentOwnerArb = (userId) =>
  fc.tuple(objectIdArb(), objectIdArb()).filter(([oid]) => oid !== userId).map(([ownerId, markerId]) => ({
    _id: markerId,
    title: 'Some Art',
    category: 'mural',
    location: { type: 'Point', coordinates: [-58.4, -34.6] },
    owner: fc.sample(fc.constantFrom(ownerId, { _id: ownerId }), 1)[0],
  }));

function setupAuthStore(user, token) {
  mockAuthStore.mockImplementation((selector) => {
    const state = { user, token: token || (user ? 'fake-token' : null) };
    return selector(state);
  });
}

describe('Property 12: Owner UI controls visibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('owner sees both Edit and Delete buttons for any valid marker they own', () => {
    fc.assert(
      fc.property(
        userArb(),
        objectIdArb(),
        (user, markerId) => {
          // Create a marker owned by this user (as string or populated object)
          const ownerVariants = [user._id, { _id: user._id }];
          for (const ownerValue of ownerVariants) {
            const marker = {
              _id: markerId,
              title: 'Test Art',
              category: 'mural',
              location: { type: 'Point', coordinates: [-58.4, -34.6] },
              owner: ownerValue,
            };

            setupAuthStore(user, 'fake-token');

            const { unmount } = render(
              <MarkerDetail marker={marker} onEdit={() => {}} onClose={() => {}} />
            );

            const editBtn = screen.queryByRole('button', { name: 'Edit marker' });
            const deleteBtn = screen.queryByRole('button', { name: 'Delete marker' });

            expect(editBtn).toBeInTheDocument();
            expect(deleteBtn).toBeInTheDocument();

            unmount();
          }
        }
      ),
      { numRuns: 30 }
    );
  });

  it('non-owner authenticated user sees neither Edit nor Delete buttons', () => {
    fc.assert(
      fc.property(
        userArb(),
        objectIdArb().filter((id) => id.length === 24),
        (user, differentOwnerId) => {
          // Ensure IDs are different
          fc.pre(differentOwnerId !== user._id);

          const ownerVariants = [differentOwnerId, { _id: differentOwnerId }];
          for (const ownerValue of ownerVariants) {
            const marker = {
              _id: 'aabbccddeeff001122334455',
              title: 'Other Art',
              category: 'graffiti',
              location: { type: 'Point', coordinates: [-58.4, -34.6] },
              owner: ownerValue,
            };

            setupAuthStore(user, 'fake-token');

            const { unmount } = render(
              <MarkerDetail marker={marker} onEdit={() => {}} onClose={() => {}} />
            );

            const editBtn = screen.queryByRole('button', { name: 'Edit marker' });
            const deleteBtn = screen.queryByRole('button', { name: 'Delete marker' });

            expect(editBtn).not.toBeInTheDocument();
            expect(deleteBtn).not.toBeInTheDocument();

            unmount();
          }
        }
      ),
      { numRuns: 30 }
    );
  });

  it('visitor (unauthenticated user=null) sees neither Edit nor Delete buttons', () => {
    fc.assert(
      fc.property(
        objectIdArb(),
        objectIdArb(),
        (markerId, ownerId) => {
          const ownerVariants = [ownerId, { _id: ownerId }];
          for (const ownerValue of ownerVariants) {
            const marker = {
              _id: markerId,
              title: 'Public Art',
              category: 'sculpture',
              location: { type: 'Point', coordinates: [-58.4, -34.6] },
              owner: ownerValue,
            };

            // No user = visitor
            setupAuthStore(null, null);

            const { unmount } = render(
              <MarkerDetail marker={marker} onEdit={() => {}} onClose={() => {}} />
            );

            const editBtn = screen.queryByRole('button', { name: 'Edit marker' });
            const deleteBtn = screen.queryByRole('button', { name: 'Delete marker' });

            expect(editBtn).not.toBeInTheDocument();
            expect(deleteBtn).not.toBeInTheDocument();

            unmount();
          }
        }
      ),
      { numRuns: 30 }
    );
  });
});
