import { notFound } from 'next/navigation';
import Link from 'next/link';
import { courseContents } from '../content';

interface CoursePageProps {
  params: Promise<{ slug: string }> | { slug: string };
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { slug } = await params;
  const course = courseContents[slug];
  if (!course) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/learn" className="text-sm text-brand-600 hover:text-brand-700 mb-6 inline-block">
          ← 返回学习中心
        </Link>

        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
          <div className="flex items-start gap-4 mb-6">
            <div className="text-4xl">{course.icon}</div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{course.title}</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs px-2 py-1 rounded-full bg-brand-50 text-brand-700 font-medium">
                  {course.level}
                </span>
                <span className="text-sm text-slate-500">{course.duration}</span>
              </div>
            </div>
          </div>

          <p className="text-slate-600 mb-8 leading-relaxed">{course.description}</p>

          <div className="space-y-8">
            {course.sections.map((section, idx) => (
              <section key={idx}>
                <h2 className="text-lg font-bold text-slate-900 mb-3">
                  {idx + 1}. {section.heading}
                </h2>
                {section.paragraphs.map((p, pIdx) => (
                  <p key={pIdx} className="text-slate-600 mb-3 leading-relaxed">
                    {p}
                  </p>
                ))}
                {section.bullets && section.bullets.length > 0 && (
                  <ul className="list-disc list-inside space-y-1.5 text-slate-600 mt-3">
                    {section.bullets.map((b, bIdx) => (
                      <li key={bIdx}>{b}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function generateStaticParams() {
  return Object.keys(courseContents).map((slug) => ({ slug }));
}

export function generateMetadata({ params }: CoursePageProps) {
  const slug = typeof params === 'object' && 'slug' in params ? params.slug : '';
  const course = courseContents[slug];
  return {
    title: course ? `${course.title} - 学习中心` : '学习中心',
  };
}
