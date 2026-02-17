'use client';

/**
 * IRAN 14XX - Settings View
 */

import React from 'react';
import { useGame } from '../../context/GameContext';
import { useGameStore } from '../../hooks/useGameStore';

export function SettingsView() {
  const { t, language, setLanguage } = useGame();
  const store = useGameStore();

  return (
    <div className="h-full flex flex-col max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">
          {t({ fa: 'تنظیمات', en: 'Settings' })}
        </h2>
      </div>

      <div className="space-y-6">
        {/* Language */}
        <div className="bg-gray-800 rounded-xl p-4">
          <h3 className="font-medium mb-3">{t({ fa: 'زبان', en: 'Language' })}</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setLanguage('fa')}
              className={`px-4 py-2 rounded-lg ${
                language === 'fa' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              فارسی
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-4 py-2 rounded-lg ${
                language === 'en' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* Save/Load */}
        <div className="bg-gray-800 rounded-xl p-4">
          <h3 className="font-medium mb-3">
            {t({ fa: 'ذخیره و بارگذاری', en: 'Save & Load' })}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const saveData = store.saveGame();
                localStorage.setItem('iran14xx_save', saveData);
                alert(t({ fa: 'بازی ذخیره شد', en: 'Game saved' }));
              }}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg"
            >
              {t({ fa: 'ذخیره بازی', en: 'Save Game' })}
            </button>
            <button
              onClick={() => {
                const saveData = localStorage.getItem('iran14xx_save');
                if (saveData) {
                  store.loadGame(saveData);
                }
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              {t({ fa: 'بارگذاری بازی', en: 'Load Game' })}
            </button>
          </div>
        </div>

        {/* About */}
        <div className="bg-gray-800 rounded-xl p-4">
          <h3 className="font-medium mb-3">
            {t({ fa: 'درباره بازی', en: 'About' })}
          </h3>
          <p className="text-gray-400 text-sm">
            {t({
              fa: 'ایران ۱۴XX یک شبیه‌سازی سیاسی است که آینده‌های ممکن ایران را بررسی می‌کند.',
              en: 'IRAN 14XX is a political simulation exploring possible futures for Iran.',
            })}
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Version 1.0.0
          </p>
        </div>
      </div>
    </div>
  );
}
