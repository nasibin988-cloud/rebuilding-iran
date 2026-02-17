'use client';

/**
 * IRAN 14XX - Character Selection Screen
 * Sleek, cinematic design with all 27 playable characters
 */

import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { useGameStore } from '../hooks/useGameStore';

interface Character {
  id: string;
  name: { fa: string; en: string };
  title: { fa: string; en: string };
  description: { fa: string; en: string };
  difficulty: 'easy' | 'normal' | 'hard' | 'expert';
  traits: string[];
  category: 'playable' | 'regime' | 'opposition' | 'society' | 'diaspora' | 'ethnic';
}

// All 27 characters from YAML content files
const allCharacters: Character[] = [
  // PLAYABLE CHARACTERS (6)
  {
    id: 'reformist_politician',
    name: { fa: 'آرش پارسایی', en: 'Arash Parsaei' },
    title: { fa: 'نماینده سابق مجلس', en: 'Former MP' },
    description: {
      fa: 'یک سیاستمدار میانه‌رو که زمانی در قلب نظام قرار داشت. شبکه‌ای از ارتباطات دارید اما زیر نظر هستید.',
      en: 'A moderate politician who was once at the heart of the system. You have a network of connections but are under surveillance.',
    },
    difficulty: 'normal',
    traits: ['pragmatic', 'patient', 'diplomatic'],
    category: 'playable',
  },
  {
    id: 'student_activist',
    name: { fa: 'روشنک آزادی', en: 'Roshanak Azadi' },
    title: { fa: 'فعال دانشجویی', en: 'Student Activist' },
    description: {
      fa: 'یک دانشجوی ۲۴ ساله که در خیزش ۱۴۰۱ به خیابان آمد و دیگر برنگشت. شما در شبکه‌های زیرزمینی فعال هستید.',
      en: 'A 24-year-old student who took to the streets in the 2022 uprising and never returned to normal life. You are active in underground networks.',
    },
    difficulty: 'hard',
    traits: ['courageous', 'idealistic', 'charismatic'],
    category: 'playable',
  },
  {
    id: 'diaspora_intellectual',
    name: { fa: 'داریوش مهرگان', en: 'Dariush Mehregan' },
    title: { fa: 'روشنفکر در تبعید', en: 'Intellectual in Exile' },
    description: {
      fa: 'یک نویسنده و تحلیلگر سیاسی که سال‌هاست در خارج زندگی می‌کند. شما ارتباطات بین‌المللی دارید اما از داخل دور هستید.',
      en: 'A writer and political analyst who has lived abroad for years. You have international connections but are far from inside.',
    },
    difficulty: 'easy',
    traits: ['intellectual', 'connected', 'media_savvy'],
    category: 'playable',
  },
  {
    id: 'journalist',
    name: { fa: 'پریسا بهرامی', en: 'Parisa Bahrami' },
    title: { fa: 'روزنامه‌نگار زیرزمینی', en: 'Underground Journalist' },
    description: {
      fa: 'یک روزنامه‌نگار که پس از بسته شدن روزنامه‌اش به فعالیت زیرزمینی روی آورده است. خطر همیشه در کمین است اما حقیقت باید گفته شود.',
      en: 'A journalist who turned to underground activities after her newspaper was shut down. Danger is always lurking but the truth must be told.',
    },
    difficulty: 'hard',
    traits: ['truth-seeker', 'courageous', 'networked'],
    category: 'playable',
  },
  {
    id: 'bazaari',
    name: { fa: 'بهمن کیانی', en: 'Bahman Kiani' },
    title: { fa: 'تاجر بازار', en: 'Bazaar Merchant' },
    description: {
      fa: 'یک تاجر سنتی در بازار بزرگ تهران که نسل‌ها پیشینه تجاری دارد. بازار همیشه قدرت داشته است.',
      en: 'A traditional merchant in Tehran\'s Grand Bazaar with generations of trading heritage. The bazaar has always had power.',
    },
    difficulty: 'normal',
    traits: ['wealthy', 'traditional', 'connected'],
    category: 'playable',
  },
  {
    id: 'cleric',
    name: { fa: 'آیت‌الله مهرداد فرزانه', en: 'Ayatollah Mehrdad Farzaneh' },
    title: { fa: 'روحانی منتقد', en: 'Dissident Cleric' },
    description: {
      fa: 'یک روحانی میانه‌رو که در حوزه علمیه قم تحصیل کرده و معتقد است که اسلام سیاسی فعلی انحراف از اصول واقعی است.',
      en: 'A moderate cleric educated in Qom seminary who believes current political Islam is a deviation from true principles.',
    },
    difficulty: 'expert',
    traits: ['religious', 'reformist', 'scholarly'],
    category: 'playable',
  },

  // REGIME - SUPREME LEADER'S OFFICE (5)
  {
    id: 'khamenei',
    name: { fa: 'آیت‌الله علی خامنه‌ای', en: 'Ayatollah Ali Khamenei' },
    title: { fa: 'رهبر معظم انقلاب اسلامی', en: 'Supreme Leader' },
    description: {
      fa: 'رهبر جمهوری اسلامی از سال ۱۳۶۸. اکنون در دهه نهم زندگی است و سلامت او موضوع گمانه‌زنی‌های فراوان است.',
      en: 'Leader of the Islamic Republic since 1989. Now in his ninth decade, his health is subject to much speculation.',
    },
    difficulty: 'expert',
    traits: ['suspicious', 'strategic', 'paranoid'],
    category: 'regime',
  },
  {
    id: 'mojtaba_khamenei',
    name: { fa: 'حجت‌الاسلام مجتبی خامنه‌ای', en: 'Hojatoleslam Mojtaba Khamenei' },
    title: { fa: 'فرزند رهبر', en: 'Son of the Supreme Leader' },
    description: {
      fa: 'پسر دوم رهبر، که گفته می‌شود نقش مهمی در پشت صحنه قدرت دارد. برخی او را جانشین احتمالی می‌دانند.',
      en: 'The Leader\'s second son, said to play an important behind-the-scenes role in power. Some consider him the likely successor.',
    },
    difficulty: 'expert',
    traits: ['ambitious', 'secretive', 'ruthless'],
    category: 'regime',
  },
  {
    id: 'ahmad_jannati',
    name: { fa: 'آیت‌الله احمد جنتی', en: 'Ayatollah Ahmad Jannati' },
    title: { fa: 'دبیر شورای نگهبان', en: 'Guardian Council Secretary' },
    description: {
      fa: 'دبیر شورای نگهبان و رئیس مجلس خبرگان رهبری. نقش کلیدی در رد صلاحیت نامزدهای اصلاح‌طلب.',
      en: 'Secretary of the Guardian Council and Chairman of the Assembly of Experts. Key role in disqualifying reformist candidates.',
    },
    difficulty: 'expert',
    traits: ['ultraconservative', 'uncompromising', 'powerful'],
    category: 'regime',
  },
  {
    id: 'sadegh_larijani',
    name: { fa: 'آیت‌الله صادق لاریجانی', en: 'Ayatollah Sadegh Larijani' },
    title: { fa: 'رئیس سابق قوه قضاییه', en: 'Former Judiciary Chief' },
    description: {
      fa: 'رئیس سابق قوه قضاییه و عضو مجمع تشخیص مصلحت نظام. محافظه‌کار سرسخت که مخالف هرگونه اصلاحات است.',
      en: 'Former Judiciary Chief and member of the Expediency Council. A staunch conservative who opposes any reforms.',
    },
    difficulty: 'hard',
    traits: ['authoritarian', 'calculating', 'conservative'],
    category: 'regime',
  },
  {
    id: 'beyt_chief_of_staff',
    name: { fa: 'حجت‌الاسلام محمد محمدی گلپایگانی', en: 'Hojatoleslam Mohammad Mohammadi Golpayegani' },
    title: { fa: 'رئیس دفتر رهبر', en: 'Chief of Supreme Leader\'s Office' },
    description: {
      fa: 'رئیس دفتر مقام معظم رهبری و مدیر بیت رهبری. کنترل‌کننده دسترسی به رهبر.',
      en: 'Chief of the Supreme Leader\'s Office and manager of the Beyt. Controls access to the Leader.',
    },
    difficulty: 'hard',
    traits: ['discreet', 'loyal', 'influential'],
    category: 'regime',
  },

  // REGIME - IRGC & SECURITY (5)
  {
    id: 'irgc_commander',
    name: { fa: 'سرلشکر حسین سلامی', en: 'Major General Hossein Salami' },
    title: { fa: 'فرمانده کل سپاه پاسداران', en: 'IRGC Commander-in-Chief' },
    description: {
      fa: 'فرمانده کل سپاه پاسداران انقلاب اسلامی. کنترل‌کننده یکی از قوی‌ترین نیروهای نظامی منطقه و امپراتوری اقتصادی گسترده.',
      en: 'Commander-in-Chief of the IRGC. Controller of one of the most powerful military forces in the region and a vast economic empire.',
    },
    difficulty: 'expert',
    traits: ['disciplined', 'ambitious', 'hardline'],
    category: 'regime',
  },
  {
    id: 'basij_commander',
    name: { fa: 'سردار غلامرضا سلیمانی', en: 'Brigadier General Gholamreza Soleimani' },
    title: { fa: 'فرمانده سازمان بسیج', en: 'Basij Organization Commander' },
    description: {
      fa: 'فرمانده سازمان بسیج مستضعفین. مسئول میلیون‌ها عضو بسیج که در سرکوب اعتراضات نقش کلیدی دارند.',
      en: 'Commander of the Basij Organization. Responsible for millions of Basij members who play a key role in suppressing protests.',
    },
    difficulty: 'hard',
    traits: ['zealous', 'ruthless', 'ideological'],
    category: 'regime',
  },
  {
    id: 'quds_force_commander',
    name: { fa: 'سردار اسماعیل قاآنی', en: 'Brigadier General Esmail Ghaani' },
    title: { fa: 'فرمانده نیروی قدس سپاه', en: 'Quds Force Commander' },
    description: {
      fa: 'فرمانده نیروی قدس سپاه پاسداران، مسئول عملیات برون‌مرزی ایران. جانشین سردار سلیمانی.',
      en: 'Commander of IRGC Quds Force, responsible for Iran\'s external operations. Successor to General Soleimani.',
    },
    difficulty: 'expert',
    traits: ['secretive', 'strategic', 'experienced'],
    category: 'regime',
  },
  {
    id: 'irgc_intelligence_chief',
    name: { fa: 'سردار حسین طائب', en: 'Brigadier General Hossein Taeb' },
    title: { fa: 'رئیس سازمان اطلاعات سپاه', en: 'IRGC Intelligence Chief' },
    description: {
      fa: 'رئیس سازمان اطلاعات سپاه پاسداران. مسئول نظارت امنیتی داخلی و مقابله با مخالفان. یکی از مخوف‌ترین چهره‌های امنیتی.',
      en: 'Chief of IRGC Intelligence Organization. Responsible for internal security surveillance and countering dissidents. One of Iran\'s most feared security figures.',
    },
    difficulty: 'expert',
    traits: ['paranoid', 'ruthless', 'powerful'],
    category: 'regime',
  },
  {
    id: 'intelligence_advisor',
    name: { fa: 'حجت‌الاسلام علی‌اکبر ولایتی', en: 'Hojatoleslam Ali Akbar Velayati' },
    title: { fa: 'مشاور امور بین‌الملل رهبر', en: 'Leader\'s Foreign Affairs Advisor' },
    description: {
      fa: 'مشاور ارشد رهبری در امور بین‌الملل و امنیتی. وزیر خارجه سابق با تجربه طولانی در دیپلماسی.',
      en: 'Senior advisor to the Leader on international and security affairs. Former Foreign Minister with long diplomatic experience.',
    },
    difficulty: 'hard',
    traits: ['diplomatic', 'experienced', 'calculating'],
    category: 'regime',
  },

  // OPPOSITION - GREEN MOVEMENT & REFORMISTS (5)
  {
    id: 'mir_hossein_mousavi',
    name: { fa: 'میرحسین موسوی', en: 'Mir Hossein Mousavi' },
    title: { fa: 'نخست‌وزیر سابق و رهبر جنبش سبز', en: 'Former PM & Green Movement Leader' },
    description: {
      fa: 'نخست‌وزیر ایران در دوران جنگ و نامزد ریاست‌جمهوری ۱۳۸۸. از ۱۳۸۹ در حصر خانگی. نماد مقاومت مدنی.',
      en: 'Iran\'s Prime Minister during the war and 2009 presidential candidate. Under house arrest since 2010. Symbol of civil resistance.',
    },
    difficulty: 'expert',
    traits: ['principled', 'resilient', 'symbolic'],
    category: 'opposition',
  },
  {
    id: 'mehdi_karroubi',
    name: { fa: 'مهدی کروبی', en: 'Mehdi Karroubi' },
    title: { fa: 'رئیس سابق مجلس و رهبر جنبش سبز', en: 'Former Speaker & Green Movement Leader' },
    description: {
      fa: 'روحانی اصلاح‌طلب و رئیس سابق مجلس. پس از اعتراضات ۱۳۸۸ به همراه موسوی به حصر خانگی رفت.',
      en: 'Reformist cleric and former Speaker of Parliament. Placed under house arrest along with Mousavi after 2009 protests.',
    },
    difficulty: 'expert',
    traits: ['outspoken', 'courageous', 'defiant'],
    category: 'opposition',
  },
  {
    id: 'former_president_khatami',
    name: { fa: 'سید محمد خاتمی', en: 'Seyyed Mohammad Khatami' },
    title: { fa: 'رئیس‌جمهور سابق', en: 'Former President' },
    description: {
      fa: 'رئیس‌جمهور اصلاح‌طلب ایران از ۱۳۷۶ تا ۱۳۸۴. اکنون تحت محدودیت رسانه‌ای است اما همچنان نفوذ دارد.',
      en: 'Reformist President of Iran from 1997 to 2005. Now under media ban but still maintains influence.',
    },
    difficulty: 'hard',
    traits: ['intellectual', 'moderate', 'respected'],
    category: 'opposition',
  },
  {
    id: 'imprisoned_reformist',
    name: { fa: 'نسرین ستوده', en: 'Nasrin Sotoudeh' },
    title: { fa: 'وکیل حقوق بشر و زندانی سیاسی', en: 'Human Rights Lawyer & Political Prisoner' },
    description: {
      fa: 'وکیل برجسته حقوق بشر که از حقوق زنان و کودکان دفاع کرده است. بارها به زندان افتاده. نماد مقاومت.',
      en: 'Prominent human rights lawyer who has defended women\'s and children\'s rights. Imprisoned multiple times. Symbol of resistance.',
    },
    difficulty: 'expert',
    traits: ['fearless', 'principled', 'iconic'],
    category: 'opposition',
  },
  {
    id: 'reformist_cleric',
    name: { fa: 'حجت‌الاسلام حسن یوسفی اشکوری', en: 'Hojatoleslam Hassan Yousefi Eshkevari' },
    title: { fa: 'روحانی روشنفکر', en: 'Intellectual Cleric' },
    description: {
      fa: 'روحانی روشنفکر که خواهان بازخوانی اسلام و سازگاری آن با دموکراسی است. به دلیل دیدگاه‌هایش از لباس روحانیت خلع شد.',
      en: 'Intellectual cleric calling for reinterpretation of Islam compatible with democracy and human rights. Defrocked for his views.',
    },
    difficulty: 'hard',
    traits: ['intellectual', 'progressive', 'brave'],
    category: 'opposition',
  },

  // SOCIETY - CIVIL SOCIETY (2)
  {
    id: 'student_leader',
    name: { fa: 'سارا میرزایی', en: 'Sara Mirzaei' },
    title: { fa: 'فعال دانشجویی', en: 'Student Activist' },
    description: {
      fa: 'فعال دانشجویی برجسته از دانشگاه تهران. صدای نسل جدید دانشجویان که خواهان آزادی و برابری هستند.',
      en: 'Prominent student activist from University of Tehran. Voice of the new generation of students demanding freedom and equality.',
    },
    difficulty: 'hard',
    traits: ['courageous', 'charismatic', 'outspoken'],
    category: 'society',
  },
  {
    id: 'bazaar_guild_leader',
    name: { fa: 'حاج محمدرضا بهشتی', en: 'Haj Mohammadreza Beheshti' },
    title: { fa: 'رئیس اتحادیه بازاریان تهران', en: 'Head of Tehran Merchants Guild' },
    description: {
      fa: 'رئیس اتحادیه بازاریان تهران با ارتباطات گسترده با روحانیون و حکومت. نماینده منافع طبقه تجار سنتی.',
      en: 'Head of Tehran Merchants Guild with extensive connections to clergy and government. Represents traditional merchant class interests.',
    },
    difficulty: 'normal',
    traits: ['pragmatic', 'wealthy', 'connected'],
    category: 'society',
  },

  // ETHNIC - KURDISH PARTIES (2)
  {
    id: 'kdpi_leader',
    name: { fa: 'مصطفی هجری', en: 'Mostafa Hijri' },
    title: { fa: 'دبیرکل حزب دموکرات کردستان ایران', en: 'KDPI Secretary-General' },
    description: {
      fa: 'دبیرکل حزب دموکرات کردستان ایران. رهبر یکی از قدیمی‌ترین احزاب کردی ایران که خواهان خودمختاری است.',
      en: 'Secretary-General of Kurdistan Democratic Party of Iran. Leader of one of Iran\'s oldest Kurdish parties demanding autonomy.',
    },
    difficulty: 'hard',
    traits: ['determined', 'nationalist', 'diplomatic'],
    category: 'ethnic',
  },
  {
    id: 'komala_leader',
    name: { fa: 'عبدالله مهتدی', en: 'Abdullah Mohtadi' },
    title: { fa: 'دبیرکل کومه‌له', en: 'Komala Secretary-General' },
    description: {
      fa: 'دبیرکل حزب کومه‌له کردستان ایران. رهبر حزب چپ‌گرای کرد که خواهان فدرالیسم و حقوق برابر است.',
      en: 'Secretary-General of Komala Party of Iranian Kurdistan. Leader of the leftist Kurdish party demanding federalism and equal rights.',
    },
    difficulty: 'hard',
    traits: ['intellectual', 'leftist', 'experienced'],
    category: 'ethnic',
  },

  // DIASPORA (2)
  {
    id: 'diaspora_leader',
    name: { fa: 'مسیح علی‌نژاد', en: 'Masih Alinejad' },
    title: { fa: 'روزنامه‌نگار و فعال حقوق زنان', en: 'Journalist & Women\'s Rights Activist' },
    description: {
      fa: 'روزنامه‌نگار و فعال حقوق زنان ایرانی مقیم آمریکا. بنیانگذار کمپین‌های ضد حجاب اجباری. صدای بلند ایرانیان خارج.',
      en: 'Iranian journalist and women\'s rights activist based in America. Founder of campaigns against mandatory hijab. Loud voice of Iranians abroad.',
    },
    difficulty: 'normal',
    traits: ['outspoken', 'media_savvy', 'influential'],
    category: 'diaspora',
  },
  {
    id: 'exiled_journalist',
    name: { fa: 'رضا خاتمی', en: 'Reza Khatami' },
    title: { fa: 'روزنامه‌نگار و تحلیلگر سیاسی', en: 'Journalist & Political Analyst' },
    description: {
      fa: 'روزنامه‌نگار سابق روزنامه‌های اصلاح‌طلب که پس از سرکوب مطبوعات به خارج مهاجرت کرد.',
      en: 'Former journalist of reformist newspapers who emigrated after the press crackdown. Now works for Persian-language media.',
    },
    difficulty: 'normal',
    traits: ['analytical', 'well_informed', 'connected'],
    category: 'diaspora',
  },
];

const difficultyConfig = {
  easy: { label: { fa: 'آسان', en: 'Easy' }, color: 'from-emerald-500 to-green-600', bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  normal: { label: { fa: 'متوسط', en: 'Normal' }, color: 'from-sky-500 to-blue-600', bg: 'bg-sky-500/20', text: 'text-sky-400' },
  hard: { label: { fa: 'سخت', en: 'Hard' }, color: 'from-amber-500 to-orange-600', bg: 'bg-amber-500/20', text: 'text-amber-400' },
  expert: { label: { fa: 'خبره', en: 'Expert' }, color: 'from-rose-500 to-red-600', bg: 'bg-rose-500/20', text: 'text-rose-400' },
};

const categoryConfig = {
  playable: { label: { fa: 'شخصیت اصلی', en: 'Protagonist' }, icon: '◆', color: 'text-cyan-400', border: 'border-cyan-500/30', glow: 'shadow-cyan-500/20' },
  regime: { label: { fa: 'حکومت', en: 'Regime' }, icon: '▲', color: 'text-red-400', border: 'border-red-500/30', glow: 'shadow-red-500/20' },
  opposition: { label: { fa: 'اپوزیسیون', en: 'Opposition' }, icon: '●', color: 'text-green-400', border: 'border-green-500/30', glow: 'shadow-green-500/20' },
  society: { label: { fa: 'جامعه', en: 'Society' }, icon: '■', color: 'text-yellow-400', border: 'border-yellow-500/30', glow: 'shadow-yellow-500/20' },
  ethnic: { label: { fa: 'قومی', en: 'Ethnic' }, icon: '★', color: 'text-orange-400', border: 'border-orange-500/30', glow: 'shadow-orange-500/20' },
  diaspora: { label: { fa: 'دیاسپورا', en: 'Diaspora' }, icon: '◇', color: 'text-purple-400', border: 'border-purple-500/30', glow: 'shadow-purple-500/20' },
};

export function CharacterSelect() {
  const { t, isRTL } = useGame();
  const store = useGameStore();
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [hoveredCharacter, setHoveredCharacter] = useState<string | null>(null);

  const filteredCharacters = filterCategory
    ? allCharacters.filter(c => c.category === filterCategory)
    : allCharacters;

  const selectedChar = allCharacters.find(c => c.id === selectedCharacter);
  const displayChar = selectedChar || (hoveredCharacter ? allCharacters.find(c => c.id === hoveredCharacter) : null);

  const handleStart = () => {
    if (selectedCharacter && selectedChar) {
      store.startNewGame(selectedCharacter, selectedChar.difficulty);
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col overflow-hidden"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-slate-800/20 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 pt-8 pb-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-light tracking-tight">
              <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                {t({ fa: 'ایران', en: 'IRAN' })}
              </span>
              <span className="text-slate-500 mx-2">14XX</span>
            </h1>
            <p className="text-slate-500 text-sm mt-1 tracking-widest uppercase">
              {t({ fa: 'انتخاب شخصیت', en: 'Select Character' })}
            </p>
          </div>
          <button
            onClick={() => store.setLanguage(store.language === 'fa' ? 'en' : 'fa')}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded-lg transition-all duration-300"
          >
            {store.language === 'fa' ? 'EN' : 'فا'}
          </button>
        </div>
      </header>

      {/* Category Filter */}
      <nav className="relative z-10 px-6 py-3">
        <div className="max-w-7xl mx-auto flex gap-2 flex-wrap justify-center">
          <button
            onClick={() => setFilterCategory(null)}
            className={`px-4 py-2 text-sm rounded-full transition-all duration-300 ${
              filterCategory === null
                ? 'bg-white/10 text-white border border-white/20'
                : 'text-slate-400 hover:text-white border border-transparent hover:border-slate-700'
            }`}
          >
            {t({ fa: 'همه', en: 'All' })}
            <span className="ml-2 text-xs text-slate-500">{allCharacters.length}</span>
          </button>
          {Object.entries(categoryConfig).map(([key, config]) => {
            const count = allCharacters.filter(c => c.category === key).length;
            return (
              <button
                key={key}
                onClick={() => setFilterCategory(key)}
                className={`px-4 py-2 text-sm rounded-full transition-all duration-300 flex items-center gap-2 ${
                  filterCategory === key
                    ? `bg-white/10 ${config.color} border ${config.border}`
                    : 'text-slate-400 hover:text-white border border-transparent hover:border-slate-700'
                }`}
              >
                <span className="text-xs">{config.icon}</span>
                {t(config.label)}
                <span className="text-xs text-slate-500">{count}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex relative z-10 overflow-hidden">
        {/* Character Grid */}
        <div className="flex-1 overflow-auto px-6 py-4">
          <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredCharacters.map((character) => {
              const catConfig = categoryConfig[character.category];
              const diffConfig = difficultyConfig[character.difficulty];
              const isSelected = selectedCharacter === character.id;
              const isHovered = hoveredCharacter === character.id;

              return (
                <button
                  key={character.id}
                  onClick={() => setSelectedCharacter(character.id)}
                  onMouseEnter={() => setHoveredCharacter(character.id)}
                  onMouseLeave={() => setHoveredCharacter(null)}
                  className={`group relative text-start rounded-xl p-3 transition-all duration-300 border backdrop-blur-sm ${
                    isSelected
                      ? `bg-white/10 ${catConfig.border} shadow-lg ${catConfig.glow}`
                      : 'bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/50 hover:border-slate-600'
                  }`}
                >
                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 shadow-lg shadow-cyan-500/50" />
                  )}

                  {/* Category Icon */}
                  <div className={`text-xs ${catConfig.color} opacity-60 mb-2`}>
                    {catConfig.icon}
                  </div>

                  {/* Avatar */}
                  <div className={`w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br ${diffConfig.color} flex items-center justify-center text-white text-lg font-medium shadow-lg`}>
                    {t(character.name).charAt(0)}
                  </div>

                  {/* Name */}
                  <h3 className="text-sm font-medium text-center truncate group-hover:text-white transition-colors">
                    {t(character.name)}
                  </h3>

                  {/* Title */}
                  <p className="text-xs text-slate-500 text-center truncate mt-0.5">
                    {t(character.title)}
                  </p>

                  {/* Difficulty Dot */}
                  <div className="flex justify-center mt-2">
                    <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${diffConfig.color}`} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Character Detail Panel */}
        <aside className={`w-80 bg-slate-900/80 backdrop-blur-xl border-l border-slate-700/50 flex flex-col transition-all duration-500 ${
          displayChar ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
        }`}>
          {displayChar && (
            <>
              {/* Character Header */}
              <div className="p-6 border-b border-slate-700/50">
                <div className={`text-xs ${categoryConfig[displayChar.category].color} flex items-center gap-2 mb-3`}>
                  <span>{categoryConfig[displayChar.category].icon}</span>
                  {t(categoryConfig[displayChar.category].label)}
                </div>

                <div className={`w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br ${difficultyConfig[displayChar.difficulty].color} flex items-center justify-center text-white text-3xl font-light shadow-2xl`}>
                  {t(displayChar.name).charAt(0)}
                </div>

                <h2 className="text-xl font-medium text-center">{t(displayChar.name)}</h2>
                <p className="text-sm text-slate-400 text-center mt-1">{t(displayChar.title)}</p>

                {/* Difficulty Badge */}
                <div className="flex justify-center mt-3">
                  <span className={`px-3 py-1 text-xs rounded-full ${difficultyConfig[displayChar.difficulty].bg} ${difficultyConfig[displayChar.difficulty].text}`}>
                    {t(difficultyConfig[displayChar.difficulty].label)}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="flex-1 p-6 overflow-auto">
                <p className="text-sm text-slate-300 leading-relaxed">
                  {t(displayChar.description)}
                </p>

                {/* Traits */}
                <div className="mt-6">
                  <h4 className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                    {t({ fa: 'ویژگی‌ها', en: 'Traits' })}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {displayChar.traits.map((trait) => (
                      <span
                        key={trait}
                        className="px-2 py-1 text-xs bg-slate-800 text-slate-400 rounded"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Start Button */}
              <div className="p-6 border-t border-slate-700/50">
                <button
                  onClick={handleStart}
                  disabled={!selectedCharacter}
                  className={`w-full py-3 rounded-lg font-medium text-sm uppercase tracking-wider transition-all duration-300 ${
                    selectedCharacter === displayChar.id
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {selectedCharacter === displayChar.id
                    ? t({ fa: 'شروع بازی', en: 'Begin Journey' })
                    : t({ fa: 'برای انتخاب کلیک کنید', en: 'Click to Select' })}
                </button>
              </div>
            </>
          )}

          {/* Empty State */}
          {!displayChar && (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center text-2xl text-slate-600">
                  ?
                </div>
                <p className="text-slate-500 text-sm">
                  {t({ fa: 'یک شخصیت انتخاب کنید', en: 'Select a character' })}
                </p>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Bottom Status Bar */}
      <footer className="relative z-10 px-6 py-3 border-t border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
          <div className="text-slate-500">
            {t({ fa: `${filteredCharacters.length} شخصیت`, en: `${filteredCharacters.length} characters` })}
          </div>
          {selectedChar && (
            <div className="flex items-center gap-2 text-slate-400">
              <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${difficultyConfig[selectedChar.difficulty].color}`} />
              <span>{t(selectedChar.name)}</span>
              <span className="text-slate-600">|</span>
              <span className={categoryConfig[selectedChar.category].color}>
                {t(categoryConfig[selectedChar.category].label)}
              </span>
            </div>
          )}
          <div className="text-slate-600">
            IRAN 14XX
          </div>
        </div>
      </footer>
    </div>
  );
}
