import { getAllSlugs, getLecture, getExtendedLecture, getScholarlyLecture, getAdjacentLectures, getSections } from '@/lib/content';
import LectureClient from '@/components/LectureClient';

export async function generateStaticParams() {
  const slugs = getAllSlugs('en');
  return slugs.map(slug => ({ slug }));
}

export default async function LecturePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const lecture = await getLecture(slug, 'en');
  if (!lecture) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Lecture Not Found</h1>
          <p className="text-dark-500 dark:text-dark-400">The requested lecture could not be loaded.</p>
        </div>
      </div>
    );
  }

  const extended = await getExtendedLecture(slug, 'en');
  const scholarly = await getScholarlyLecture(slug, 'en');
  const adjacent = getAdjacentLectures(slug, 'en');
  const sections = getSections('en');

  return (
    <LectureClient
      lecture={lecture}
      extendedHtml={extended?.html ?? null}
      extendedReadingTime={extended?.readingTime ?? null}
      scholarlyHtml={scholarly?.html ?? null}
      scholarlyReadingTime={scholarly?.readingTime ?? null}
      prev={adjacent.prev}
      next={adjacent.next}
      sections={sections}
    />
  );
}
