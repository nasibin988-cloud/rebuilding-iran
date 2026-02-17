'use client';

/**
 * IRAN 14XX - Tutorial System
 *
 * Interactive tutorial to teach players the game mechanics.
 */

import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';

// Tutorial steps
interface TutorialStep {
  id: string;
  title: { fa: string; en: string };
  content: { fa: string; en: string };
  target?: string; // CSS selector for highlighting
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: 'click' | 'view' | 'any';
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: {
      fa: 'به ایران ۱۴XX خوش آمدید',
      en: 'Welcome to IRAN 14XX'
    },
    content: {
      fa: `در این بازی، شما نقش یک فعال سیاسی در ایران را بازی می‌کنید که تلاش می‌کند تغییرات دموکراتیک را به ارمغان بیاورد.

هر تصمیم شما عواقبی دارد. هر روز مهم است.`,
      en: `In this game, you play as a political activist in Iran trying to bring about democratic change.

Every decision has consequences. Every day matters.`
    },
    position: 'center'
  },
  {
    id: 'resources',
    title: {
      fa: 'منابع شما',
      en: 'Your Resources'
    },
    content: {
      fa: `در نوار بالا، منابع خود را می‌بینید:
• 💰 پول - برای فعالیت‌ها و کمک‌رسانی
• 🌟 نفوذ - قدرت تاثیرگذاری شما
• ❤️ سلامت - وضعیت جسمی و روحی
• 🔓 آزادی - میزان امنیت شما از رژیم`,
      en: `In the top bar, you see your resources:
• 💰 Money - For activities and aid
• 🌟 Influence - Your power to affect change
• ❤️ Health - Physical and mental state
• 🔓 Freedom - Your security from the regime`
    },
    target: '[data-tutorial="resources"]',
    position: 'bottom'
  },
  {
    id: 'map',
    title: {
      fa: 'نقشه ایران',
      en: 'Map of Iran'
    },
    content: {
      fa: `نقشه نشان می‌دهد که هر استان تحت چه کنترلی است:
• خاکستری = کنترل رژیم
• نارنجی = مورد مناقشه
• سبز = گرایش به اپوزیسیون
• قرمز = ناآرامی بالا`,
      en: `The map shows control of each province:
• Gray = Regime control
• Orange = Contested
• Green = Opposition leaning
• Red = High unrest`
    },
    target: '[data-tutorial="map"]',
    position: 'right'
  },
  {
    id: 'factions',
    title: {
      fa: 'جناح‌ها',
      en: 'Factions'
    },
    content: {
      fa: `جناح‌های مختلف در بازی وجود دارند:
• سپاه، روحانیون، اصلاح‌طلبان
• کارگران، دانشجویان، زنان
• اقوام مختلف

روابط شما با آنها مهم است!`,
      en: `Different factions exist in the game:
• IRGC, Clergy, Reformists
• Workers, Students, Women
• Various ethnic groups

Your relationships with them matter!`
    },
    target: '[data-tutorial="factions"]',
    position: 'left'
  },
  {
    id: 'events',
    title: {
      fa: 'رویدادها و تصمیمات',
      en: 'Events & Decisions'
    },
    content: {
      fa: `هر نوبت، رویدادهایی رخ می‌دهد که باید تصمیم بگیرید.
گزینه‌های مختلف عواقب متفاوتی دارند.

بعضی عواقب فوری هستند، بعضی با تاخیر ظاهر می‌شوند.`,
      en: `Each turn, events occur that require your decision.
Different options have different consequences.

Some consequences are immediate, some appear later.`
    },
    position: 'center'
  },
  {
    id: 'eudaimonia',
    title: {
      fa: 'خوشبختی (یودایمونیا)',
      en: 'Eudaimonia'
    },
    content: {
      fa: `هدف نهایی، شکوفایی انسانی است. هفت بعد را پیگیری می‌کنیم:
آزادی، عدالت، رفاه، جامعه، معنا، سلامت، دانش

هر تصمیم شما بر این ابعاد تاثیر می‌گذارد.`,
      en: `The ultimate goal is human flourishing. We track seven dimensions:
Freedom, Justice, Prosperity, Community, Meaning, Health, Knowledge

Every decision affects these dimensions.`
    },
    target: '[data-tutorial="eudaimonia"]',
    position: 'left'
  },
  {
    id: 'advisor',
    title: {
      fa: 'مشاور هوش مصنوعی',
      en: 'AI Advisor'
    },
    content: {
      fa: `در هر لحظه می‌توانید از مشاور هوش مصنوعی کمک بخواهید.
سوالات استراتژیک بپرسید، وضعیت را تحلیل کنید، یا درباره تاریخ بپرسید.`,
      en: `At any time, you can ask the AI advisor for help.
Ask strategic questions, analyze the situation, or inquire about history.`
    },
    target: '[data-tutorial="advisor"]',
    position: 'left'
  },
  {
    id: 'ending',
    title: {
      fa: 'پایان‌ها',
      en: 'Endings'
    },
    content: {
      fa: `بازی می‌تواند به روش‌های مختلفی پایان یابد:
• پیروزی دموکراتیک
• ادامه استبداد
• فروپاشی و هرج‌ومرج
• و بسیاری دیگر...

سرنوشت ایران در دست شماست!`,
      en: `The game can end in many ways:
• Democratic victory
• Continued authoritarianism
• Collapse and chaos
• And many more...

Iran's fate is in your hands!`
    },
    position: 'center'
  },
  {
    id: 'ready',
    title: {
      fa: 'آماده هستید؟',
      en: 'Ready?'
    },
    content: {
      fa: `حالا آماده شروع هستید!

به یاد داشته باشید:
• صبور باشید - تغییر زمان می‌برد
• احتیاط کنید - رژیم همه جا چشم دارد
• همبستگی بسازید - تنها نمی‌توانید پیروز شوید

موفق باشید!`,
      en: `Now you're ready to begin!

Remember:
• Be patient - change takes time
• Be careful - the regime has eyes everywhere
• Build solidarity - you can't win alone

Good luck!`
    },
    position: 'center'
  }
];

interface TutorialProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function Tutorial({ onComplete, onSkip }: TutorialProps) {
  const { t, isRTL } = useGame();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const step = TUTORIAL_STEPS[currentStep];
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;
  const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100;

  const handleNext = () => {
    if (isLastStep) {
      setIsVisible(false);
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    setIsVisible(false);
    onSkip();
  };

  // Highlight target element
  useEffect(() => {
    if (step.target) {
      const element = document.querySelector(step.target);
      if (element) {
        element.classList.add('tutorial-highlight');
        return () => element.classList.remove('tutorial-highlight');
      }
    }
  }, [step.target]);

  if (!isVisible) return null;

  const getPositionClasses = () => {
    switch (step.position) {
      case 'top':
        return 'bottom-auto top-24';
      case 'bottom':
        return 'top-auto bottom-24';
      case 'left':
        return 'right-8 left-auto';
      case 'right':
        return 'left-8 right-auto';
      default:
        return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
    }
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/70 z-40" />

      {/* Tutorial Card */}
      <div
        className={`fixed z-50 w-full max-w-md bg-gray-800 rounded-xl shadow-2xl border border-gray-600 ${getPositionClasses()}`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Progress bar */}
        <div className="h-1 bg-gray-700 rounded-t-xl overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step indicator */}
          <div className="text-xs text-gray-400 mb-2">
            {currentStep + 1} / {TUTORIAL_STEPS.length}
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold mb-4">
            {t(step.title)}
          </h2>

          {/* Body */}
          <div className="text-gray-300 whitespace-pre-line mb-6">
            {t(step.content)}
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center">
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-white text-sm"
            >
              {t({ fa: 'رد کردن آموزش', en: 'Skip Tutorial' })}
            </button>

            <div className="flex gap-2">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
                >
                  {t({ fa: 'قبلی', en: 'Previous' })}
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                {isLastStep
                  ? t({ fa: 'شروع بازی', en: 'Start Game' })
                  : t({ fa: 'بعدی', en: 'Next' })}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tutorial highlight styles */}
      <style jsx global>{`
        .tutorial-highlight {
          position: relative;
          z-index: 41;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5);
          animation: tutorial-pulse 2s infinite;
        }

        @keyframes tutorial-pulse {
          0%, 100% {
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.3);
          }
        }
      `}</style>
    </>
  );
}

// Hook to manage tutorial state
const TUTORIAL_COMPLETED_KEY = 'iran14xx_tutorial_completed';

export function useTutorial() {
  const [showTutorial, setShowTutorial] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(true); // Default to true to avoid flash

  useEffect(() => {
    const completed = localStorage.getItem(TUTORIAL_COMPLETED_KEY) === 'true';
    setHasCompleted(completed);
    if (!completed) {
      setShowTutorial(true);
    }
  }, []);

  const completeTutorial = () => {
    localStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true');
    setHasCompleted(true);
    setShowTutorial(false);
  };

  const skipTutorial = () => {
    localStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true');
    setHasCompleted(true);
    setShowTutorial(false);
  };

  const restartTutorial = () => {
    localStorage.removeItem(TUTORIAL_COMPLETED_KEY);
    setHasCompleted(false);
    setShowTutorial(true);
  };

  return {
    showTutorial,
    hasCompleted,
    completeTutorial,
    skipTutorial,
    restartTutorial
  };
}

export default Tutorial;
