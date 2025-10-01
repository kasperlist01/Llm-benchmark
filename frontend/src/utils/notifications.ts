export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface NotificationOptions {
  message: string;
  type?: NotificationType;
  title?: string;
  duration?: number;
}

export const showNotification = ({
  message,
  type = 'info',
  title,
  duration = 5000,
}: NotificationOptions): void => {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;

  const headerTitle = title || (type === 'error' ? 'Ошибка' : 'Уведомление');

  notification.innerHTML = `
    <div class="notification-header">
      <strong>${headerTitle}</strong>
      <button class="notification-close">&times;</button>
    </div>
    <div class="notification-body">${message}</div>
  `;

  document.body.appendChild(notification);

  setTimeout(() => notification.classList.add('show'), 10);

  const closeBtn = notification.querySelector('.notification-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    });
  }

  setTimeout(() => {
    if (notification.parentNode) {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }
  }, duration);
};
