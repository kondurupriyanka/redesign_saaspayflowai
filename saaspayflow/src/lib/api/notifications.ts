import { apiRequest } from './client';

export interface ApiNotification {
  id: string;
  type: 'payment' | 'reminder' | 'alert';
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

export async function fetchNotifications(limit: number = 20) {
  return apiRequest<{ notifications: ApiNotification[]; total: number; hasMore: boolean }>(
    `/notifications?limit=${limit}&offset=0`
  );
}

export async function markNotificationRead(id: string) {
  return apiRequest<ApiNotification>(`/notifications/${id}/read`, 'PUT');
}

export async function clearNotifications() {
  return apiRequest<{ message: string }>('/notifications', 'DELETE');
}
