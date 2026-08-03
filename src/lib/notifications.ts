import { api } from "@/lib/api";

export type NotificationItem = {
  id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  workflow_id?: string | null;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
};

export type NotificationList = {
  items: NotificationItem[];
  unread_count: number;
};

export async function getNotifications(unreadOnly = false, limit = 20): Promise<NotificationList> {
  const { data } = await api.get<NotificationList>("/api/v1/notifications", {
    params: { unread_only: unreadOnly, limit },
  });
  return data;
}

export async function markNotificationAsRead(notificationId: string): Promise<NotificationItem> {
  const { data } = await api.post<NotificationItem>(`/api/v1/notifications/${notificationId}/read`);
  return data;
}

export async function markAllNotificationsAsRead(): Promise<{ updated: number }> {
  const { data } = await api.post<{ updated: number }>("/api/v1/notifications/read-all");
  return data;
}
