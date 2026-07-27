import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ContributionForm from './ContributionForm';

vi.mock('../../api/contributions', () => ({
  postContribution: vi.fn(),
}));

import { postContribution } from '../../api/contributions';

describe('ContributionForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders textarea and submit button', () => {
    render(<ContributionForm markerId="abc123" />);

    expect(screen.getByLabelText(/note/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit contribution/i })).toBeInTheDocument();
  });

  it('shows validation error for empty note', async () => {
    render(<ContributionForm markerId="abc123" />);

    fireEvent.click(screen.getByRole('button', { name: /submit contribution/i }));

    expect(await screen.findByText('Note is required')).toBeInTheDocument();
    expect(postContribution).not.toHaveBeenCalled();
  });

  it('shows validation error for whitespace-only note', async () => {
    render(<ContributionForm markerId="abc123" />);

    fireEvent.change(screen.getByLabelText(/note/i), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: /submit contribution/i }));

    expect(await screen.findByText('Note is required')).toBeInTheDocument();
    expect(postContribution).not.toHaveBeenCalled();
  });

  it('calls postContribution with correct args on valid submit', async () => {
    postContribution.mockResolvedValue({ data: { _id: 'c1' } });

    render(<ContributionForm markerId="marker456" />);

    fireEvent.change(screen.getByLabelText(/note/i), { target: { value: 'Great mural!' } });
    fireEvent.click(screen.getByRole('button', { name: /submit contribution/i }));

    await waitFor(() => {
      expect(postContribution).toHaveBeenCalledTimes(1);
      expect(postContribution).toHaveBeenCalledWith('marker456', { note: 'Great mural!' });
    });
  });

  it('shows success message after successful submission', async () => {
    postContribution.mockResolvedValue({ data: { _id: 'c1' } });

    render(<ContributionForm markerId="abc123" />);

    fireEvent.change(screen.getByLabelText(/note/i), { target: { value: 'Nice art' } });
    fireEvent.click(screen.getByRole('button', { name: /submit contribution/i }));

    expect(await screen.findByText('Contribution submitted successfully')).toBeInTheDocument();
  });

  it('clears textarea after successful submission', async () => {
    postContribution.mockResolvedValue({ data: { _id: 'c1' } });

    render(<ContributionForm markerId="abc123" />);

    fireEvent.change(screen.getByLabelText(/note/i), { target: { value: 'My note' } });
    fireEvent.click(screen.getByRole('button', { name: /submit contribution/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/note/i)).toHaveValue('');
    });
  });

  it('shows error message when submission fails', async () => {
    postContribution.mockRejectedValue({
      response: { data: { error: 'Marker not found' } },
    });

    render(<ContributionForm markerId="abc123" />);

    fireEvent.change(screen.getByLabelText(/note/i), { target: { value: 'My note' } });
    fireEvent.click(screen.getByRole('button', { name: /submit contribution/i }));

    expect(await screen.findByText('Marker not found')).toBeInTheDocument();
  });

  it('shows generic error message when no API error detail', async () => {
    postContribution.mockRejectedValue(new Error('Network error'));

    render(<ContributionForm markerId="abc123" />);

    fireEvent.change(screen.getByLabelText(/note/i), { target: { value: 'My note' } });
    fireEvent.click(screen.getByRole('button', { name: /submit contribution/i }));

    expect(await screen.findByText('Something went wrong. Please try again.')).toBeInTheDocument();
  });

  it('disables submit button while submitting', async () => {
    postContribution.mockImplementation(() => new Promise(() => {})); // never resolves

    render(<ContributionForm markerId="abc123" />);

    fireEvent.change(screen.getByLabelText(/note/i), { target: { value: 'My note' } });
    fireEvent.click(screen.getByRole('button', { name: /submit contribution/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /submitting/i })).toBeDisabled();
    });
  });
});
