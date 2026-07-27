import axiosInstance from './axiosInstance';

export const postContribution = (id, data) =>
  axiosInstance.post(`/markers/${id}/contributions`, data);

export const getContributions = (id) =>
  axiosInstance.get(`/markers/${id}/contributions`);
