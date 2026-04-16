export class Expo {
  static isExpoPushToken(token: string): boolean {
    return typeof token === 'string' && token.length > 0;
  }

  async sendPushNotificationsAsync(messages: unknown[]) {
    return messages.map((_, index) => ({
      status: 'ok',
      id: `mock-ticket-${index + 1}`,
    }));
  }
}

export type ExpoPushMessage = Record<string, unknown>;
export type ExpoPushTicket = {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: Record<string, unknown>;
};