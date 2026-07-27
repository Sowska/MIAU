import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import axios from 'axios';
import axiosInstance from './axiosInstance';

describe('axiosInstance', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should have baseURL set from VITE_API_BASE_URL', () => {
    expect(axiosInstance.defaults.baseURL).toBe('http://localhost:5000/api');
  });

  it('should attach Authorization header when token exists in localStorage', async () => {
    localStorage.setItem('token', 'test-jwt-token');

    // Mock the adapter to capture the config without making a real request
    const mockAdapter = vi.fn().mockRejectedValue({ __test_abort: true });
    axiosInstance.defaults.adapter = mockAdapter;

    try {
      await axiosInstance.get('/test');
    } catch (e) {
      // expected rejection
    }

    expect(mockAdapter).toHaveBeenCalled();
    const requestConfig = mockAdapter.mock.calls[0][0];
    expect(requestConfig.headers.get('Authorization')).toBe('Bearer test-jwt-token');

    // Restore default adapter
    delete axiosInstance.defaults.adapter;
  });

  it('should NOT attach Authorization header when no token in localStorage', async () => {
    const mockAdapter = vi.fn().mockRejectedValue({ __test_abort: true });
    axiosInstance.defaults.adapter = mockAdapter;

    try {
      await axiosInstance.get('/test');
    } catch (e) {
      // expected rejection
    }

    expect(mockAdapter).toHaveBeenCalled();
    const requestConfig = mockAdapter.mock.calls[0][0];
    expect(requestConfig.headers.get('Authorization')).toBeFalsy();

    delete axiosInstance.defaults.adapter;
  });
});
