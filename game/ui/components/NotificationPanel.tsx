'use client';

/**
 * IRAN 14XX - Notification Panel
 */

import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { useNotifications } from '../hooks/useGameStore';

export function NotificationPanel() {
  const { t } = useGame();
  const { notifications, markNotificationRead, clearNotifications } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (!isOpen && unreadCount === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40" role="region" aria-label={t({ fa: 'اعلان‌ها', en: 'Notifications' })}>
      {/* Toggle Button */}
      {!isOpen && unreadCount > 0 && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 rounded-full p-3 shadow-lg"
          aria-label={t({
            fa: `${unreadCount} اعلان خوانده نشده - کلیک برای مشاهده`,
            en: `${unreadCount} unread notifications - click to view`
          })}
        >
          <span className="text-xl" aria-hidden="true">🔔</span>
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center" aria-hidden="true">
            {unreadCount}
          </span>
        </button>
      )}

      {/* Panel */}
      {isOpen && (
        <div
          className="bg-gray-800 rounded-xl w-80 max-h-96 overflow-hidden shadow-xl"
          role="dialog"
          aria-labelledby="notifications-title"
          aria-live="polite"
        >
          <div className="p-3 border-b border-gray-700 flex items-center justify-between">
            <h3 id="notifications-title" className="font-medium">
              {t({ fa: 'اعلان‌ها', en: 'Notifications' })}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={clearNotifications}
                className="text-xs text-gray-400 hover:text-white"
                aria-label={t({ fa: 'پاک کردن همه اعلان‌ها', en: 'Clear all notifications' })}
              >
                {t({ fa: 'پاک کردن همه', en: 'Clear all' })}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white"
                aria-label={t({ fa: 'بستن پنل اعلان‌ها', en: 'Close notifications panel' })}
              >
                ✕
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {t({ fa: 'اعلانی وجود ندارد', en: 'No notifications' })}
              </div>
            ) : (
              <ul className="divide-y divide-gray-700" role="list" aria-label={t({ fa: 'لیست اعلان‌ها', en: 'Notifications list' })}>
                {notifications.map((notif) => (
                  <li
                    key={notif.id}
                    onClick={() => markNotificationRead(notif.id)}
                    onKeyDown={(e) => e.key === 'Enter' && markNotificationRead(notif.id)}
                    tabIndex={0}
                    role="button"
                    aria-label={`${notif.type}: ${t(notif.message)}${!notif.read ? t({ fa: ' - خوانده نشده', en: ' - unread' }) : ''}`}
                    className={`p-3 cursor-pointer hover:bg-gray-750 ${
                      !notif.read ? 'bg-gray-700/50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span aria-hidden="true">
                        {notif.type === 'urgent'
                          ? '🚨'
                          : notif.type === 'warning'
                          ? '⚠️'
                          : notif.type === 'success'
                          ? '✅'
                          : 'ℹ️'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm">{t(notif.message)}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(notif.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
