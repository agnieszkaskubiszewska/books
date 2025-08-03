import React, { useEffect } from 'react';
import { NotificationProps } from '../types';

const Notification: React.FC<NotificationProps> = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getNotificationClass = () => {
    const baseClass = 'notification';
    return `${baseClass} ${baseClass}--${type}`;
  };

  return (
    <div className={getNotificationClass()}>
      <span className="notification__message">{message}</span>
      <button className="notification__close" onClick={onClose}>
        ×
      </button>
    </div>
  );
};

export default Notification; 