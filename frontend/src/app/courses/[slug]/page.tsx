import { notFound } from 'next/navigation';
import Link from 'next/link';
import { trainingCourses } from '../content';

interface CourseDetailPageProps {
  params: Promise<{ slug: string }> | { slug: string };
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { slug } = await params;
  const course = trainingCourses.find((c) => c.slug === slug);
  if (!course) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/courses" className="text-sm text-brand-600 hover:text-brand-700 mb-6 inline-block">
          ← 返回培训学院
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：课程信息 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm mb-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="text-5xl">{course.cover}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        course.isFree
                          ? 'bg-green-50 text-green-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {course.isFree ? '免费' : '付费'}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                      {course.level}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                      {course.category}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900">{course.title}</h1>
                  <p className="text-slate-500 mt-1">{course.subtitle}</p>
                </div>
              </div>

              <p className="text-slate-600 leading-relaxed mb-6">{course.description}</p>

              <div className="flex flex-wrap gap-2 mb-6">
                {course.tags.map((tag) => (
                  <span key={tag} className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-600">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4 text-center border-t border-slate-100 pt-6">
                <div>
                  <div className="text-lg font-bold text-slate-900">{course.lessons}</div>
                  <div className="text-xs text-slate-500">课程节数</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-900">{course.totalDuration}</div>
                  <div className="text-xs text-slate-500">总时长</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-900">{course.students.toLocaleString()}</div>
                  <div className="text-xs text-slate-500">学习人数</div>
                </div>
              </div>
            </div>

            {/* 课程大纲 */}
            <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm mb-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">课程大纲</h2>
              <ol className="list-decimal list-inside space-y-2 text-slate-600">
                {course.outline.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ol>
            </div>

            {/* 视频列表 */}
            <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4">视频目录</h2>
              <div className="space-y-3">
                {course.videos.map((video, idx) => (
                  <div
                    key={video.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-sm font-bold">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{video.title}</div>
                        <div className="text-xs text-slate-500">{video.duration}</div>
                      </div>
                    </div>
                    <button className="text-sm text-brand-600 hover:text-brand-700 font-medium">
                      播放
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-4">
                * 视频播放功能需接入视频服务后启用，当前展示为课程目录。
              </p>
            </div>
          </div>

          {/* 右侧：购买卡片 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm sticky top-24">
              <div className="text-center mb-6">
                {course.isFree ? (
                  <div className="text-3xl font-bold text-green-600">免费</div>
                ) : (
                  <>
                    <div className="flex items-center justify-center gap-2 mb-1">
                      {course.originalPrice && (
                        <span className="text-sm text-slate-400 line-through">
                          ¥{course.originalPrice}
                        </span>
                      )}
                      <div className="text-3xl font-bold text-brand-600">¥{course.price}</div>
                    </div>
                    <div className="text-xs text-slate-500">购买后永久有效</div>
                  </>
                )}
              </div>

              <Link
                href={course.isFree ? '#' : `/order?service=course&plan=${course.slug}`}
                className={`block w-full text-center py-3 rounded-lg font-medium transition-colors ${
                  course.isFree
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-brand-600 text-white hover:bg-brand-700'
                }`}
              >
                {course.isFree ? '立即开始学习' : '立即购买课程'}
              </Link>

              <div className="mt-6">
                <h3 className="font-bold text-slate-900 mb-3">你将学到</h3>
                <ul className="space-y-2">
                  {course.whatYouWillLearn.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="text-accent-500 font-bold">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100">
                <div className="text-sm text-slate-500">
                  <div className="font-medium text-slate-900 mb-1">讲师</div>
                  <div>{course.instructor}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function generateStaticParams() {
  return trainingCourses.map((course) => ({ slug: course.slug }));
}

export function generateMetadata({ params }: CourseDetailPageProps) {
  const slug = typeof params === 'object' && 'slug' in params ? params.slug : '';
  const course = trainingCourses.find((c) => c.slug === slug);
  return {
    title: course ? `${course.title} - 培训学院` : '培训学院',
  };
}
