import axiosInstance from './axiosInstance';

export const getMarkers = () => axiosInstance.get('/markers');
export const getMarker = (id) => axiosInstance.get(`/markers/${id}`);
export const createMarker = (formData) => axiosInstance.post('/markers', formData);
export const updateMarker = (id, fd) => axiosInstance.put(`/markers/${id}`, fd);
export const deleteMarker = (id) => axiosInstance.delete(`/markers/${id}`);
