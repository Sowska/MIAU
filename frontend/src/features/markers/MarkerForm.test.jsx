import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MarkerForm from './MarkerForm';

vi.mock('../../api/markers', () => ({
  createMarker: vi.fn(),
  updateMarker: vi.fn(),
}));

import { createMarker, updateMarker } from '../../api/markers';

describe('MarkerForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the create form with empty fields by default', () => {
    render(<MarkerForm coordinates={{ lat: 40.0, lng: -3.7 }} />);

    expect(screen.getByRole('heading', { name: /create marker/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toHaveValue('');
    expect(screen.getByLabelText(/category/i)).toHaveValue('');
    expect(screen.getByLabelText(/description/i)).toHaveValue('');
    expect(screen.getByLabelText(/author/i)).toHaveValue('');
    expect(screen.getByLabelText(/creation date/i)).toHaveValue('');
  });

  it('renders the edit form with pre-populated fields', () => {
    const marker = {
      _id: '123',
      title: 'Cool Mural',
      category: 'mural',
      description: 'A nice mural',
      author: 'Artist',
      date: '2024-03-15T00:00:00.000Z',
    };

    render(<MarkerForm marker={marker} />);

    expect(screen.getByText('Edit Marker')).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toHaveValue('Cool Mural');
    expect(screen.getByLabelText(/category/i)).toHaveValue('mural');
    expect(screen.getByLabelText(/description/i)).toHaveValue('A nice mural');
    expect(screen.getByLabelText(/author/i)).toHaveValue('Artist');
    expect(screen.getByLabelText(/creation date/i)).toHaveValue('2024-03-15');
  });

  it('shows validation error when title is empty on submit', async () => {
    render(<MarkerForm coordinates={{ lat: 40.0, lng: -3.7 }} />);

    fireEvent.click(screen.getByRole('button', { name: /create marker/i }));

    expect(await screen.findByText('Title is required')).toBeInTheDocument();
    expect(createMarker).not.toHaveBeenCalled();
  });

  it('shows validation error when category is not selected on submit', async () => {
    render(<MarkerForm coordinates={{ lat: 40.0, lng: -3.7 }} />);

    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Test' } });
    fireEvent.click(screen.getByRole('button', { name: /create marker/i }));

    expect(await screen.findByText('Category is required')).toBeInTheDocument();
    expect(createMarker).not.toHaveBeenCalled();
  });

  it('preserves user-entered values after validation failure', async () => {
    render(<MarkerForm coordinates={{ lat: 40.0, lng: -3.7 }} />);

    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'My Art' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Nice piece' } });
    fireEvent.click(screen.getByRole('button', { name: /create marker/i }));

    await screen.findByText('Category is required');
    expect(screen.getByLabelText(/title/i)).toHaveValue('My Art');
    expect(screen.getByLabelText(/description/i)).toHaveValue('Nice piece');
  });

  it('calls createMarker with FormData on valid create submission', async () => {
    createMarker.mockResolvedValue({ data: { _id: '456' } });

    render(<MarkerForm coordinates={{ lat: 40.0, lng: -3.7 }} />);

    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'New Mural' } });
    fireEvent.change(screen.getByLabelText(/category/i), { target: { value: 'mural' } });
    fireEvent.click(screen.getByRole('button', { name: /create marker/i }));

    await waitFor(() => {
      expect(createMarker).toHaveBeenCalledTimes(1);
    });

    const formData = createMarker.mock.calls[0][0];
    expect(formData).toBeInstanceOf(FormData);
    expect(formData.get('title')).toBe('New Mural');
    expect(formData.get('category')).toBe('mural');
    expect(formData.get('longitude')).toBe('-3.7');
    expect(formData.get('latitude')).toBe('40');
  });

  it('calls updateMarker with FormData on valid edit submission', async () => {
    updateMarker.mockResolvedValue({ data: { _id: '123' } });

    const marker = {
      _id: '123',
      title: 'Old Title',
      category: 'graffiti',
      description: '',
      author: '',
      date: null,
    };

    render(<MarkerForm marker={marker} />);

    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Updated Title' } });
    fireEvent.click(screen.getByRole('button', { name: /update marker/i }));

    await waitFor(() => {
      expect(updateMarker).toHaveBeenCalledTimes(1);
    });

    expect(updateMarker.mock.calls[0][0]).toBe('123');
    const formData = updateMarker.mock.calls[0][1];
    expect(formData).toBeInstanceOf(FormData);
    expect(formData.get('title')).toBe('Updated Title');
  });

  it('disables the submit button while loading', async () => {
    createMarker.mockImplementation(() => new Promise(() => {})); // never resolves

    render(<MarkerForm coordinates={{ lat: 40.0, lng: -3.7 }} />);

    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/category/i), { target: { value: 'sculpture' } });
    fireEvent.click(screen.getByRole('button', { name: /create marker/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled();
    });
  });

  it('shows success message after successful creation', async () => {
    createMarker.mockResolvedValue({ data: { _id: '789' } });

    render(<MarkerForm coordinates={{ lat: 40.0, lng: -3.7 }} />);

    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Art' } });
    fireEvent.change(screen.getByLabelText(/category/i), { target: { value: 'mural' } });
    fireEvent.click(screen.getByRole('button', { name: /create marker/i }));

    expect(await screen.findByText('Marker created successfully')).toBeInTheDocument();
  });

  it('shows API error message on failure', async () => {
    createMarker.mockRejectedValue({
      response: { data: { error: 'Server error' } },
    });

    render(<MarkerForm coordinates={{ lat: 40.0, lng: -3.7 }} />);

    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Art' } });
    fireEvent.change(screen.getByLabelText(/category/i), { target: { value: 'mural' } });
    fireEvent.click(screen.getByRole('button', { name: /create marker/i }));

    expect(await screen.findByText('Server error')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(<MarkerForm coordinates={{ lat: 40.0, lng: -3.7 }} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('does not render cancel button when onCancel is not provided', () => {
    render(<MarkerForm coordinates={{ lat: 40.0, lng: -3.7 }} />);
    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
  });

  it('calls onSuccess callback after successful creation', async () => {
    createMarker.mockResolvedValue({ data: { _id: '789' } });
    const onSuccess = vi.fn();

    render(<MarkerForm coordinates={{ lat: 40.0, lng: -3.7 }} onSuccess={onSuccess} />);

    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Art' } });
    fireEvent.change(screen.getByLabelText(/category/i), { target: { value: 'mural' } });
    fireEvent.click(screen.getByRole('button', { name: /create marker/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('has accessible error markup with aria-invalid and aria-describedby', async () => {
    render(<MarkerForm coordinates={{ lat: 40.0, lng: -3.7 }} />);

    fireEvent.click(screen.getByRole('button', { name: /create marker/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByLabelText(/title/i)).toHaveAttribute('aria-describedby', 'marker-title-error');
    });
  });
});
