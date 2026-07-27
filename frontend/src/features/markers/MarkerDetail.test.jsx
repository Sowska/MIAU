import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import MarkerDetail from './MarkerDetail';

vi.mock('../../api/markers', () => ({
  getMarker: vi.fn(),
  deleteMarker: vi.fn(),
}));

vi.mock('../../api/contributions', () => ({
  getContributions: vi.fn(),
}));

vi.mock('../../store/authStore', () => ({
  default: vi.fn(),
}));

import { getMarker, deleteMarker } from '../../api/markers';
import { getContributions } from '../../api/contributions';
import useAuthStore from '../../store/authStore';

const mockMarker = {
  _id: 'marker-1',
  title: 'Cool Mural',
  category: 'mural',
  description: 'A vibrant mural on 5th street',
  author: 'Jane Artist',
  date: '2024-06-15T00:00:00.000Z',
  imagePath: 'https://s3.example.com/images/mural.jpg',
  location: { type: 'Point', coordinates: [-3.7035, 40.4168] },
  owner: { _id: 'user-1', username: 'jane' },
  createdAt: '2024-06-15T10:00:00.000Z',
  updatedAt: '2024-06-20T14:30:00.000Z',
};

describe('MarkerDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.mockImplementation((selector) => {
      const state = { user: null, token: null };
      return selector(state);
    });
  });

  it('renders loading state when fetching marker by ID', () => {
    getMarker.mockImplementation(() => new Promise(() => {}));

    render(<MarkerDetail markerId="marker-1" />);

    expect(screen.getByRole('status', { name: /loading marker details/i })).toBeInTheDocument();
  });

  it('renders marker details when marker is provided as prop', () => {
    render(<MarkerDetail marker={mockMarker} />);

    expect(screen.getByText('Cool Mural')).toBeInTheDocument();
    expect(screen.getByText('mural')).toBeInTheDocument();
    expect(screen.getByText('Jane Artist')).toBeInTheDocument();
    expect(screen.getByText('A vibrant mural on 5th street')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /artwork: cool mural/i })).toHaveAttribute(
      'src',
      'https://s3.example.com/images/mural.jpg'
    );
  });

  it('displays location coordinates', () => {
    render(<MarkerDetail marker={mockMarker} />);

    expect(screen.getByText(/40\.41680/)).toBeInTheDocument();
    expect(screen.getByText(/-3\.70350/)).toBeInTheDocument();
  });

  it('displays creation and update timestamps', () => {
    render(<MarkerDetail marker={mockMarker} />);

    expect(screen.getByText(/Created:/)).toBeInTheDocument();
    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
  });

  it('fetches marker by ID when marker prop is not provided', async () => {
    getMarker.mockResolvedValue({ data: mockMarker });

    render(<MarkerDetail markerId="marker-1" />);

    await waitFor(() => {
      expect(getMarker).toHaveBeenCalledWith('marker-1');
    });

    expect(await screen.findByText('Cool Mural')).toBeInTheDocument();
  });

  it('displays error message when marker fetch fails', async () => {
    getMarker.mockRejectedValue({
      response: { data: { error: 'Marker not found' } },
    });

    render(<MarkerDetail markerId="bad-id" />);

    expect(await screen.findByText('Marker not found')).toBeInTheDocument();
  });

  it('displays generic error message when fetch fails without API error', async () => {
    getMarker.mockRejectedValue(new Error('Network error'));

    render(<MarkerDetail markerId="marker-1" />);

    expect(await screen.findByText('Unable to load marker. Please try again.')).toBeInTheDocument();
  });

  it('shows edit and delete buttons for the marker owner', () => {
    useAuthStore.mockImplementation((selector) => {
      const state = { user: { _id: 'user-1', username: 'jane' }, token: 'jwt-token' };
      return selector(state);
    });
    getContributions.mockResolvedValue({ data: [] });

    render(<MarkerDetail marker={mockMarker} onEdit={vi.fn()} />);

    expect(screen.getByRole('button', { name: /edit marker/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete marker/i })).toBeInTheDocument();
  });

  it('does not show edit and delete buttons for non-owners', () => {
    useAuthStore.mockImplementation((selector) => {
      const state = { user: { _id: 'user-2', username: 'bob' }, token: 'jwt-token' };
      return selector(state);
    });

    render(<MarkerDetail marker={mockMarker} onEdit={vi.fn()} />);

    expect(screen.queryByRole('button', { name: /edit marker/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete marker/i })).not.toBeInTheDocument();
  });

  it('does not show edit and delete buttons for visitors', () => {
    render(<MarkerDetail marker={mockMarker} onEdit={vi.fn()} />);

    expect(screen.queryByRole('button', { name: /edit marker/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete marker/i })).not.toBeInTheDocument();
  });

  it('calls onEdit with marker when edit button is clicked', () => {
    useAuthStore.mockImplementation((selector) => {
      const state = { user: { _id: 'user-1', username: 'jane' }, token: 'jwt-token' };
      return selector(state);
    });
    getContributions.mockResolvedValue({ data: [] });

    const onEdit = vi.fn();
    render(<MarkerDetail marker={mockMarker} onEdit={onEdit} />);

    fireEvent.click(screen.getByRole('button', { name: /edit marker/i }));
    expect(onEdit).toHaveBeenCalledWith(mockMarker);
  });

  it('calls deleteMarker and onClose on delete confirmation', async () => {
    useAuthStore.mockImplementation((selector) => {
      const state = { user: { _id: 'user-1', username: 'jane' }, token: 'jwt-token' };
      return selector(state);
    });
    getContributions.mockResolvedValue({ data: [] });

    window.confirm = vi.fn(() => true);
    deleteMarker.mockResolvedValue({});
    const onClose = vi.fn();

    render(<MarkerDetail marker={mockMarker} onClose={onClose} onEdit={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /delete marker/i }));

    await waitFor(() => {
      expect(deleteMarker).toHaveBeenCalledWith('marker-1');
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('does not delete when user cancels confirmation', () => {
    useAuthStore.mockImplementation((selector) => {
      const state = { user: { _id: 'user-1', username: 'jane' }, token: 'jwt-token' };
      return selector(state);
    });
    getContributions.mockResolvedValue({ data: [] });

    window.confirm = vi.fn(() => false);

    render(<MarkerDetail marker={mockMarker} onEdit={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /delete marker/i }));
    expect(deleteMarker).not.toHaveBeenCalled();
  });

  it('displays contributions for the owner in chronological order', async () => {
    useAuthStore.mockImplementation((selector) => {
      const state = { user: { _id: 'user-1', username: 'jane' }, token: 'jwt-token' };
      return selector(state);
    });

    const contributions = [
      { _id: 'c2', note: 'Second note', createdAt: '2024-07-02T10:00:00.000Z' },
      { _id: 'c1', note: 'First note', createdAt: '2024-07-01T10:00:00.000Z' },
    ];

    getContributions.mockResolvedValue({ data: contributions });

    render(<MarkerDetail marker={mockMarker} onEdit={vi.fn()} />);

    expect(await screen.findByText('First note')).toBeInTheDocument();
    expect(screen.getByText('Second note')).toBeInTheDocument();

    // Verify chronological order (first note should appear before second)
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('First note');
    expect(items[1]).toHaveTextContent('Second note');
  });

  it('shows contribution form placeholder for non-owners', () => {
    useAuthStore.mockImplementation((selector) => {
      const state = { user: { _id: 'user-2', username: 'bob' }, token: 'jwt-token' };
      return selector(state);
    });

    render(<MarkerDetail marker={mockMarker} />);

    expect(screen.getByLabelText(/submit a contribution/i)).toBeInTheDocument();
  });

  it('shows contribution form placeholder for visitors', () => {
    render(<MarkerDetail marker={mockMarker} />);

    expect(screen.getByLabelText(/submit a contribution/i)).toBeInTheDocument();
  });

  it('calls onClose when back button is clicked', () => {
    const onClose = vi.fn();
    render(<MarkerDetail marker={mockMarker} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: /back to map/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders empty state when no marker ID is provided', () => {
    render(<MarkerDetail />);

    expect(screen.getByText('No marker specified.')).toBeInTheDocument();
  });

  it('does not render image when imagePath is null', () => {
    const markerNoImage = { ...mockMarker, imagePath: null };
    render(<MarkerDetail marker={markerNoImage} />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
