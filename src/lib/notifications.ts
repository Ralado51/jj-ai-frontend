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
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export type NotificationFilters = {
  page?: number;
  pageSize?: number;
  unreadOnly?: boolean;
  severity?: string;
  type?: string;
};

export type NotificationPreferences = {
  in_app_enabled: boolean;
  email_enabled: boolean;
  critical_only: boolean;
  email_address?: string | null;
};

export type TestEmailResult = {
  status: string;
  recipient: string;
  sent_at: string;
  detail?: string | null;
};

export async function getNotifications(filters: NotificationFilters = {}): Promise<NotificationList> {
  const { data } = await api.get<NotificationList>("/api/v1/notifications", {
    params: {
      page: filters.page ?? 1,
      page_size: filters.pageSize ?? 20,
      unread_only: filters.unreadOnly ?? false,
      ...(filters.severity ? { severity: filters.severity } : {}),
      ...(filters.type ? { type: filters.type } : {}),
    },
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

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const { data } = await api.get<NotificationPreferences>("/api/v1/notifications/preferences");
  return data;
}

export async function updateNotificationPreferences(preferences: NotificationPreferences): Promise<NotificationPreferences> {
  const { data } = await api.put<NotificationPreferences>("/api/v1/notifications/preferences", preferences);
  return data;
}

export async function sendNotificationTestEmail(): Promise<TestEmailResult> {
  const { data } = await api.post<TestEmailResult>("/api/v1/notifications/preferences/test-email");
  return data;
}
