'use client';

/**
 * IRAN 14XX - Production-Quality Interactive SVG Map of Iran
 *
 * Uses accurate geographic data from MapSVG (CC BY 4.0 license).
 * All 31 provinces with accurate boundaries.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { useGameStore } from '../hooks/useGameStore';

// Province metadata with bilingual names
const PROVINCE_DATA: Record<string, { nameFa: string; nameEn: string; capital: string }> = {
  'IR-01': { nameFa: 'آذربایجان شرقی', nameEn: 'East Azerbaijan', capital: 'Tabriz' },
  'IR-02': { nameFa: 'آذربایجان غربی', nameEn: 'West Azerbaijan', capital: 'Urmia' },
  'IR-03': { nameFa: 'اردبیل', nameEn: 'Ardabil', capital: 'Ardabil' },
  'IR-04': { nameFa: 'اصفهان', nameEn: 'Isfahan', capital: 'Isfahan' },
  'IR-05': { nameFa: 'ایلام', nameEn: 'Ilam', capital: 'Ilam' },
  'IR-06': { nameFa: 'بوشهر', nameEn: 'Bushehr', capital: 'Bushehr' },
  'IR-07': { nameFa: 'تهران', nameEn: 'Tehran', capital: 'Tehran' },
  'IR-08': { nameFa: 'چهارمحال و بختیاری', nameEn: 'Chaharmahal and Bakhtiari', capital: 'Shahrekord' },
  'IR-10': { nameFa: 'خوزستان', nameEn: 'Khuzestan', capital: 'Ahvaz' },
  'IR-11': { nameFa: 'زنجان', nameEn: 'Zanjan', capital: 'Zanjan' },
  'IR-12': { nameFa: 'سمنان', nameEn: 'Semnan', capital: 'Semnan' },
  'IR-13': { nameFa: 'سیستان و بلوچستان', nameEn: 'Sistan and Baluchestan', capital: 'Zahedan' },
  'IR-14': { nameFa: 'فارس', nameEn: 'Fars', capital: 'Shiraz' },
  'IR-15': { nameFa: 'کرمان', nameEn: 'Kerman', capital: 'Kerman' },
  'IR-16': { nameFa: 'کردستان', nameEn: 'Kurdistan', capital: 'Sanandaj' },
  'IR-17': { nameFa: 'کرمانشاه', nameEn: 'Kermanshah', capital: 'Kermanshah' },
  'IR-18': { nameFa: 'کهگیلویه و بویراحمد', nameEn: 'Kohgiluyeh and Boyer-Ahmad', capital: 'Yasuj' },
  'IR-19': { nameFa: 'گیلان', nameEn: 'Gilan', capital: 'Rasht' },
  'IR-20': { nameFa: 'لرستان', nameEn: 'Lorestan', capital: 'Khorramabad' },
  'IR-21': { nameFa: 'مازندران', nameEn: 'Mazandaran', capital: 'Sari' },
  'IR-22': { nameFa: 'مرکزی', nameEn: 'Markazi', capital: 'Arak' },
  'IR-23': { nameFa: 'هرمزگان', nameEn: 'Hormozgan', capital: 'Bandar Abbas' },
  'IR-24': { nameFa: 'همدان', nameEn: 'Hamadan', capital: 'Hamadan' },
  'IR-25': { nameFa: 'یزد', nameEn: 'Yazd', capital: 'Yazd' },
  'IR-26': { nameFa: 'قم', nameEn: 'Qom', capital: 'Qom' },
  'IR-27': { nameFa: 'گلستان', nameEn: 'Golestan', capital: 'Gorgan' },
  'IR-28': { nameFa: 'قزوین', nameEn: 'Qazvin', capital: 'Qazvin' },
  'IR-29': { nameFa: 'خراسان جنوبی', nameEn: 'South Khorasan', capital: 'Birjand' },
  'IR-30': { nameFa: 'خراسان رضوی', nameEn: 'Razavi Khorasan', capital: 'Mashhad' },
  'IR-31': { nameFa: 'خراسان شمالی', nameEn: 'North Khorasan', capital: 'Bojnurd' },
  'IR-32': { nameFa: 'البرز', nameEn: 'Alborz', capital: 'Karaj' },
};

// Map ISO code to our internal IDs
const ISO_TO_ID: Record<string, string> = {
  'IR-01': 'east_azerbaijan',
  'IR-02': 'west_azerbaijan',
  'IR-03': 'ardabil',
  'IR-04': 'isfahan',
  'IR-05': 'ilam',
  'IR-06': 'bushehr',
  'IR-07': 'tehran',
  'IR-08': 'chaharmahal',
  'IR-10': 'khuzestan',
  'IR-11': 'zanjan',
  'IR-12': 'semnan',
  'IR-13': 'sistan',
  'IR-14': 'fars',
  'IR-15': 'kerman',
  'IR-16': 'kurdistan',
  'IR-17': 'kermanshah',
  'IR-18': 'kohgiluyeh',
  'IR-19': 'gilan',
  'IR-20': 'lorestan',
  'IR-21': 'mazandaran',
  'IR-22': 'markazi',
  'IR-23': 'hormozgan',
  'IR-24': 'hamedan',
  'IR-25': 'yazd',
  'IR-26': 'qom',
  'IR-27': 'golestan',
  'IR-28': 'qazvin',
  'IR-29': 'south_khorasan',
  'IR-30': 'razavi_khorasan',
  'IR-31': 'north_khorasan',
  'IR-32': 'alborz',
};

const ID_TO_ISO: Record<string, string> = Object.fromEntries(
  Object.entries(ISO_TO_ID).map(([iso, id]) => [id, iso])
);

interface IranMapProps {
  onProvinceClick?: (provinceId: string) => void;
  selectedProvince?: string | null;
}

export function IranMap({ onProvinceClick, selectedProvince }: IranMapProps) {
  const { t, language } = useGame();
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const gameState = useGameStore((state) => state.gameState);

  // Load SVG content
  useEffect(() => {
    fetch('/maps/iran-provinces.svg')
      .then(res => res.text())
      .then(svg => setSvgContent(svg))
      .catch(() => setMapError(t({ fa: 'خطا در بارگذاری نقشه', en: 'Failed to load map' })));
  }, [t]);

  // Get province status data from game state
  const getProvinceStatus = useMemo(() => {
    if (!gameState?.world?.regions) return () => null;
    return (provinceId: string) => {
      const region = gameState.world.regions.get(provinceId);
      return region || null;
    };
  }, [gameState]);

  // Calculate color based on regime control and unrest
  const getProvinceColor = (isoCode: string): string => {
    const provinceId = ISO_TO_ID[isoCode];
    if (!provinceId) return '#4b5563';

    const status = getProvinceStatus(provinceId);
    if (!status) return '#4b5563'; // Default gray

    const regimeControl = status.control?.regimeControl ?? 70;
    const unrest = status.activity?.protestLevel ?? 20;

    if (unrest > 60) {
      return '#ef4444'; // Red - high unrest
    } else if (regimeControl < 40) {
      return '#22c55e'; // Green - opposition leaning
    } else if (regimeControl < 60) {
      return '#f59e0b'; // Yellow/orange - contested
    } else {
      return '#6b7280'; // Gray - regime controlled
    }
  };

  // Get tooltip content
  const getTooltipContent = (isoCode: string) => {
    const provinceData = PROVINCE_DATA[isoCode];
    const provinceId = ISO_TO_ID[isoCode];

    if (!provinceData) return null;

    const name = language === 'fa' ? provinceData.nameFa : provinceData.nameEn;
    const status = provinceId ? getProvinceStatus(provinceId) : null;

    return {
      name,
      capital: provinceData.capital,
      details: status ? {
        control: status.control?.regimeControl ?? 70,
        unrest: status.activity?.protestLevel ?? 20,
        support: status.control?.oppositionPresence ?? 30,
      } : null
    };
  };

  // Handle mouse move for tooltip
  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  // Process SVG to add interactivity
  const processedSvg = useMemo(() => {
    if (!svgContent) return null;

    // Parse the SVG and modify paths
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, 'image/svg+xml');
    const svg = doc.querySelector('svg');

    if (!svg) return null;

    // Remove existing styles
    const existingStyles = svg.querySelectorAll('style');
    existingStyles.forEach(s => s.remove());

    // Update viewBox for better fit
    svg.setAttribute('viewBox', '0 0 654.51147 593.71021');
    svg.setAttribute('class', 'w-full h-full');
    svg.removeAttribute('width');
    svg.removeAttribute('height');

    // Get all paths
    const paths = svg.querySelectorAll('path');

    paths.forEach(path => {
      const isoCode = path.getAttribute('id');
      if (!isoCode) return;

      const provinceId = ISO_TO_ID[isoCode];
      const isSelected = selectedProvince === provinceId;
      const isHovered = hoveredProvince === isoCode;

      // Set fill color
      path.setAttribute('fill', getProvinceColor(isoCode));

      // Set stroke
      if (isSelected) {
        path.setAttribute('stroke', '#fbbf24');
        path.setAttribute('stroke-width', '3');
      } else if (isHovered) {
        path.setAttribute('stroke', '#ffffff');
        path.setAttribute('stroke-width', '2');
      } else {
        path.setAttribute('stroke', '#374151');
        path.setAttribute('stroke-width', '0.5');
      }

      // Set opacity
      path.setAttribute('opacity', isHovered || isSelected ? '1' : '0.85');

      // Add cursor and transition
      path.style.cursor = 'pointer';
      path.style.transition = 'all 0.2s ease';
    });

    return new XMLSerializer().serializeToString(svg);
  }, [svgContent, selectedProvince, hoveredProvince, getProvinceStatus]);

  // Handle path interactions
  const handlePathEvent = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as SVGPathElement;
    if (target.tagName === 'path') {
      const isoCode = target.getAttribute('id');
      if (isoCode) {
        if (e.type === 'mouseenter') {
          setHoveredProvince(isoCode);
        } else if (e.type === 'click') {
          const provinceId = ISO_TO_ID[isoCode];
          if (provinceId && onProvinceClick) {
            onProvinceClick(provinceId);
          }
        }
      }
    }
    if (e.type === 'mouseleave' && (e.target as Element).tagName === 'path') {
      setHoveredProvince(null);
    }
  };

  const tooltipContent = hoveredProvince ? getTooltipContent(hoveredProvince) : null;

  // Show error state
  if (mapError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-800" role="alert">
        <div className="text-center">
          <span className="text-5xl mb-4 block" aria-hidden="true">⚠️</span>
          <p className="text-red-400 font-medium mb-2">{mapError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
          >
            {t({ fa: 'تلاش مجدد', en: 'Retry' })}
          </button>
        </div>
      </div>
    );
  }

  // Show loading state
  if (!processedSvg) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-800" role="status" aria-live="polite">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" aria-hidden="true" />
          <p className="text-gray-400">{t({ fa: 'در حال بارگذاری نقشه...', en: 'Loading map...' })}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-gray-900"
      onMouseMove={handleMouseMove}
      onMouseOver={handlePathEvent}
      onMouseOut={handlePathEvent}
      onClick={handlePathEvent}
    >
      {/* SVG Map */}
      <div
        className="w-full h-full p-4"
        dangerouslySetInnerHTML={{ __html: processedSvg }}
      />

      {/* Tooltip */}
      {tooltipContent && (
        <div
          className="absolute bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-xl pointer-events-none z-50 min-w-48"
          style={{
            left: mousePos.x + 15,
            top: mousePos.y + 15,
            transform: mousePos.x > (containerRef.current?.clientWidth || 0) / 2 ? 'translateX(-100%)' : undefined
          }}
        >
          <div className="font-bold text-white mb-1">{tooltipContent.name}</div>
          <div className="text-xs text-gray-400 mb-2">
            {t({ fa: 'مرکز:', en: 'Capital:' })} {tooltipContent.capital}
          </div>
          {tooltipContent.details && (
            <div className="text-sm space-y-1 border-t border-gray-700 pt-2 mt-2">
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">{t({ fa: 'کنترل رژیم:', en: 'Regime Control:' })}</span>
                <span className="text-white font-medium">{tooltipContent.details.control}%</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">{t({ fa: 'ناآرامی:', en: 'Unrest:' })}</span>
                <span className={`font-medium ${tooltipContent.details.unrest > 50 ? 'text-red-400' : 'text-white'}`}>
                  {tooltipContent.details.unrest}%
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">{t({ fa: 'حمایت:', en: 'Support:' })}</span>
                <span className={`font-medium ${tooltipContent.details.support > 50 ? 'text-green-400' : 'text-white'}`}>
                  {tooltipContent.details.support}%
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-gray-800/95 rounded-lg p-3 text-sm border border-gray-700">
        <div className="font-semibold mb-2">{t({ fa: 'راهنما', en: 'Legend' })}</div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-500" />
            <span>{t({ fa: 'کنترل رژیم', en: 'Regime Control' })}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500" />
            <span>{t({ fa: 'مورد مناقشه', en: 'Contested' })}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500" />
            <span>{t({ fa: 'گرایش اپوزیسیون', en: 'Opposition' })}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500" />
            <span>{t({ fa: 'ناآرامی بالا', en: 'High Unrest' })}</span>
          </div>
        </div>
      </div>

      {/* Map Attribution */}
      <div className="absolute bottom-4 right-4 text-xs text-gray-500">
        Map data: MapSVG (CC BY 4.0)
      </div>
    </div>
  );
}

export default IranMap;
