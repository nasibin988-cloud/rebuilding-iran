'use client';

/**
 * IRAN 14XX - Map View
 *
 * Interactive map of Iran showing regions, control, and events.
 */

import React from 'react';
import { useGame } from '../../context/GameContext';
import { useGameStore } from '../../hooks/useGameStore';
import { IranMap } from '../IranMap';

// Province name mapping for details panel
const PROVINCE_NAMES: Record<string, { fa: string; en: string }> = {
  west_azerbaijan: { fa: 'آذربایجان غربی', en: 'West Azerbaijan' },
  east_azerbaijan: { fa: 'آذربایجان شرقی', en: 'East Azerbaijan' },
  ardabil: { fa: 'اردبیل', en: 'Ardabil' },
  zanjan: { fa: 'زنجان', en: 'Zanjan' },
  kurdistan: { fa: 'کردستان', en: 'Kurdistan' },
  kermanshah: { fa: 'کرمانشاه', en: 'Kermanshah' },
  ilam: { fa: 'ایلام', en: 'Ilam' },
  gilan: { fa: 'گیلان', en: 'Gilan' },
  mazandaran: { fa: 'مازندران', en: 'Mazandaran' },
  golestan: { fa: 'گلستان', en: 'Golestan' },
  north_khorasan: { fa: 'خراسان شمالی', en: 'North Khorasan' },
  razavi_khorasan: { fa: 'خراسان رضوی', en: 'Razavi Khorasan' },
  south_khorasan: { fa: 'خراسان جنوبی', en: 'South Khorasan' },
  tehran: { fa: 'تهران', en: 'Tehran' },
  alborz: { fa: 'البرز', en: 'Alborz' },
  qazvin: { fa: 'قزوین', en: 'Qazvin' },
  qom: { fa: 'قم', en: 'Qom' },
  markazi: { fa: 'مرکزی', en: 'Markazi' },
  hamedan: { fa: 'همدان', en: 'Hamedan' },
  lorestan: { fa: 'لرستان', en: 'Lorestan' },
  isfahan: { fa: 'اصفهان', en: 'Isfahan' },
  chaharmahal: { fa: 'چهارمحال و بختیاری', en: 'Chaharmahal & Bakhtiari' },
  kohgiluyeh: { fa: 'کهگیلویه و بویراحمد', en: 'Kohgiluyeh & Boyer-Ahmad' },
  khuzestan: { fa: 'خوزستان', en: 'Khuzestan' },
  fars: { fa: 'فارس', en: 'Fars' },
  bushehr: { fa: 'بوشهر', en: 'Bushehr' },
  hormozgan: { fa: 'هرمزگان', en: 'Hormozgan' },
  semnan: { fa: 'سمنان', en: 'Semnan' },
  yazd: { fa: 'یزد', en: 'Yazd' },
  kerman: { fa: 'کرمان', en: 'Kerman' },
  sistan: { fa: 'سیستان و بلوچستان', en: 'Sistan & Baluchestan' },
};

export function MapView() {
  const { t, language } = useGame();
  const store = useGameStore();
  const gameState = store.gameState;

  // Get region data from game state
  const getRegionData = (regionId: string) => {
    if (!gameState?.world?.regions) return null;
    return gameState.world.regions.get(regionId);
  };

  const selectedRegionData = store.selectedRegion
    ? getRegionData(store.selectedRegion)
    : null;

  const selectedRegionName = store.selectedRegion
    ? PROVINCE_NAMES[store.selectedRegion]
    : null;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold">
          {t({ fa: 'نقشه ایران', en: 'Map of Iran' })}
        </h2>
        <p className="text-gray-400">
          {t({
            fa: 'برای مشاهده جزئیات روی استان‌ها کلیک کنید',
            en: 'Click on provinces to view details',
          })}
        </p>
      </div>

      {/* Map Container */}
      <div className="flex-1 bg-gray-800 rounded-xl overflow-hidden relative min-h-[400px]">
        <IranMap
          selectedProvince={store.selectedRegion}
          onProvinceClick={(provinceId) => {
            if (store.selectedRegion === provinceId) {
              store.selectRegion(null);
            } else {
              store.selectRegion(provinceId);
            }
          }}
        />
      </div>

      {/* Region Details Panel */}
      {store.selectedRegion && selectedRegionName && (
        <div className="mt-4 bg-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold">
              {t(selectedRegionName)}
            </h3>
            <button
              onClick={() => store.selectRegion(null)}
              className="p-1 rounded hover:bg-gray-700"
            >
              ✕
            </button>
          </div>

          {selectedRegionData ? (
            <div className="space-y-4">
              {/* Political Status */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="bg-gray-700 rounded p-2">
                  <div className="text-gray-400">
                    {t({ fa: 'کنترل رژیم', en: 'Regime Control' })}
                  </div>
                  <div className="font-medium">
                    {selectedRegionData.control?.regimeControl ?? 70}%
                  </div>
                </div>
                <div className="bg-gray-700 rounded p-2">
                  <div className="text-gray-400">
                    {t({ fa: 'حضور مخالفان', en: 'Opposition Presence' })}
                  </div>
                  <div className="font-medium">
                    {selectedRegionData.control?.oppositionPresence ?? 30}%
                  </div>
                </div>
                <div className="bg-gray-700 rounded p-2">
                  <div className="text-gray-400">
                    {t({ fa: 'سطح ناآرامی', en: 'Unrest Level' })}
                  </div>
                  <div className={`font-medium ${
                    (selectedRegionData.activity?.protestLevel ?? 20) > 60
                      ? 'text-red-400'
                      : (selectedRegionData.activity?.protestLevel ?? 20) > 30
                      ? 'text-yellow-400'
                      : 'text-green-400'
                  }`}>
                    {selectedRegionData.activity?.protestLevel ?? 20}%
                  </div>
                </div>
                <div className="bg-gray-700 rounded p-2">
                  <div className="text-gray-400">
                    {t({ fa: 'حضور امنیتی', en: 'Security Presence' })}
                  </div>
                  <div className="font-medium">
                    {selectedRegionData.control?.militaryPresence ?? 50}%
                  </div>
                </div>
              </div>

              {/* Demographics */}
              {selectedRegionData.demographics && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">
                    {t({ fa: 'جمعیت‌شناسی', en: 'Demographics' })}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                    <div className="bg-gray-700/50 rounded px-2 py-1">
                      <span className="text-gray-400">{t({ fa: 'جمعیت:', en: 'Population:' })}</span>{' '}
                      <span className="text-white">
                        {(selectedRegionData.demographics.population / 1000000).toFixed(1)}M
                      </span>
                    </div>
                    {selectedRegionData.demographics.urbanization !== undefined && (
                      <div className="bg-gray-700/50 rounded px-2 py-1">
                        <span className="text-gray-400">{t({ fa: 'شهری:', en: 'Urban:' })}</span>{' '}
                        <span className="text-white">{selectedRegionData.demographics.urbanization}%</span>
                      </div>
                    )}
                    {selectedRegionData.demographics.educationLevel !== undefined && (
                      <div className="bg-gray-700/50 rounded px-2 py-1">
                        <span className="text-gray-400">{t({ fa: 'تحصیلات:', en: 'Education:' })}</span>{' '}
                        <span className="text-white">{selectedRegionData.demographics.educationLevel}%</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Economic Conditions */}
              {selectedRegionData.conditions && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">
                    {t({ fa: 'شرایط اقتصادی', en: 'Economic Conditions' })}
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-gray-700/50 rounded px-2 py-1">
                      <span className="text-gray-400">{t({ fa: 'سلامت اقتصادی:', en: 'Economic Health:' })}</span>{' '}
                      <span className="text-white">{selectedRegionData.conditions.economicHealth ?? 50}%</span>
                    </div>
                    <div className="bg-gray-700/50 rounded px-2 py-1">
                      <span className="text-gray-400">{t({ fa: 'زیرساخت:', en: 'Infrastructure:' })}</span>{' '}
                      <span className="text-white">{selectedRegionData.conditions.infrastructure ?? 50}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-400 text-sm">
              {t({
                fa: 'اطلاعات این استان در حال بارگذاری است...',
                en: 'Loading province information...',
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
