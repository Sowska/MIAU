import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import fc from 'fast-check';
import MarkerDetail from './MarkerDetail';

/**
 * Property 18: Contribution form visibility
 *
 * For any Marker, when viewed by a Visitor (unauthenticated) or by an authenticated
 * User who is not the Owner, the Detail View SHALL display the contribution form
 * and SHALL NOT display the contributions list. When viewed by the Owner, the
 * contributions list SHALL be displayed and the form SHALL NOT be shown.
 *
 * **Validates: Requirements 7.3, 7.4, 7.5**
 */

vi.mock('../../api/markers', () => ({
  getMarker: vi.fn(),
  deleteMarker: vi.fn(),
}));

vi.mock('../../api/contributions', () => ({
  getContributions: vi.fn(),
  postContribution: vi.fn(),
}));

vi.mock('../../store/authStore', () => ({
  default: vi.fn(),
}));

vi.mock('../../store/toastStore', () => ({
  default: vi.fn(() => vi.fn()),
}));

import { getContributions } from '../../api/contributions';
import useAuthStore from '../../store/authStore';

// --- Arbitraries ---

/** Generates a random MongoDB-like ObjectId string */
const arbObjectId = fc.hexaString({ minLength: 24, maxLength: 24 });

/** Generates a marker object with a specific owner ID */
const arbMarker = (ownerId) =>
  fc.record({
    _id: arbObjectId,
    title: fc.string({ minLength: 1, maxLength: 80 }),
    category: fc.constantFrom('mural', 'graffiti', 'sculpture'),
    description: fc.string({ maxLength: 200 }),
    author: fc.string({ maxLength: 50 }),
    date: fc.date().map((d) => d.toISOString()),
    location: fc.constant({ type: 'Point', coordinates: [-3.7035, 40.4168] }),
    createdAt: fc.date().map((d) => d.toISOString()),
    updatedAt: fc.date().map((d) => d.toISOString()),
  }).map((m) => ({ ...m, owner: { _id: ownerId } }));

/** Generates an authenticated user */
const arbUser = arbObjectId.map((id) => ({
  _id: id,
  username: `user_${id.slice(0, 6)}`,
  email: `user_${id.slice(0, 6)}@test.com`,
}));

// --- Tests ---

describe('Property 18: Contribution form visibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getContributions.mockResolvedValue({ data: [] });
  });

  it('visitors see contribution form and NOT contributions list', () => {
    fc.assert(
      fc.property(arbObjectId, (ownerId) => {
        const marker = {
          _id: 'marker-xyz',
          title: 'Test Marker',
          category: 'mural',
          description: '',
          author: '',
          location: { type: 'Point', coordinates: [-3.7, 40.4] },
          owner: { _id: ownerId },
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        };

        // Visitor: no user, no token
        useAuthStore.mockImplementation((selector) => {
          const state = { user: null, token: null };
          return selector(state);
        });

        const { unmount } = render(<MarkerDetail marker={marker} />);

        // Contribution form section visible
        expect(screen.getByLabelText(/submit a contribution/i)).toBeInTheDocument();
        // Contributions list section NOT visible
        expect(screen.queryByLabelText(/^contributions$/i)).not.toBeInTheDocument();

        unmount();
      }),
      { numRuns: 20 }
    );
  });

  it('non-owners see contribution form and NOT contributions list', () => {
    fc.assert(
      fc.property(
        arbObjectId,
        arbObjectId.filter((id) => id.length === 24),
        (ownerId, viewerId) => {
          // Ensure viewer is NOT the owner
          fc.pre(viewerId !== ownerId);

          const marker = {
            _id: 'marker-abc',
            title: 'Another Marker',
            category: 'graffiti',
            description: 'Street art',
            author: 'Unknown',
            location: { type: 'Point', coordinates: [-58.38, -34.6] },
            owner: { _id: ownerId },
            createdAt: '2024-03-10T00:00:00.000Z',
            updatedAt: '2024-03-10T00:00:00.000Z',
          };

          const viewerUser = {
            _id: viewerId,
            username: 'viewer',
            email: 'viewer@test.com',
          };

          useAuthStore.mockImplementation((selector) => {
            const state = { user: viewerUser, token: 'jwt-token-valid' };
            return selector(state);
          });

          const { unmount } = render(<MarkerDetail marker={marker} />);

          // Contribution form section visible
          expect(screen.getByLabelText(/submit a contribution/i)).toBeInTheDocument();
          // Contributions list section NOT visible
          expect(screen.queryByLabelText(/^contributions$/i)).not.toBeInTheDocument();

          unmount();
        }
      ),
      { numRuns: 20 }
    );
  });

  it('owner sees contributions list and NOT contribution form', () => {
    fc.assert(
      fc.property(arbObjectId, (ownerId) => {
        const marker = {
          _id: 'marker-own',
          title: 'Owner Marker',
          category: 'sculpture',
          description: 'A sculpture in the park',
          author: 'Owner Artist',
          location: { type: 'Point', coordinates: [2.17, 41.38] },
          owner: { _id: ownerId },
          createdAt: '2024-05-01T00:00:00.000Z',
          updatedAt: '2024-05-01T00:00:00.000Z',
        };

        const ownerUser = {
          _id: ownerId,
          username: 'theowner',
          email: 'owner@test.com',
        };

        useAuthStore.mockImplementation((selector) => {
          const state = { user: ownerUser, token: 'jwt-owner-token' };
          return selector(state);
        });

        const { unmount } = render(<MarkerDetail marker={marker} />);

        // Contributions list section visible
        expect(screen.getByLabelText(/^contributions$/i)).toBeInTheDocument();
        // Contribution form section NOT visible
        expect(screen.queryByLabelText(/submit a contribution/i)).not.toBeInTheDocument();

        unmount();
      }),
      { numRuns: 20 }
    );
  });
});
