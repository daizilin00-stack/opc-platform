'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { trainingCourses } from './content';

export default function CoursesPage() {
  const [filter, setFilter] = useState<'all' | 'free' | 'paid'>('all');
  const isLoggedIn = useStore((state) => state.isLoggedIn);
  const setChatOpen = useStore((state) => state.setChatOpen);

  const filtered = trainingCourses.filter((c) => {
    if (filter === 'free') return c.isFree;
    if (filter === 'paid') return !c.isFree;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-3">培训学院</h1>
          <p className="text-slate-600">系统化的跨境电商、AI 与合规课程，助力创业者快速出海</p>
        </div>

        {/* 筛选 */}
        <div className="flex justify-center gap-2 mb-10">
          {[
            { key: 'all', label: '全部课程' },
            { key: 'free', label: '免费课程' },
            { key: 'paid', label: '付费课程' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === key
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 课程列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((course) => (
            <Link
              key={course.slug}
              href={`/courses/${course.slug}`}
              className="card bg-white hover:shadow-md transition-shadow block"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="text-4xl">{course.cover}</div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    course.isFree
                      ? 'bg-green-50 text-green-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {course.isFree ? '免费' : '付费'}
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-1">{course.title}</h3>
              <p className="text-sm text-slate-500 mb-3">{course.subtitle}</p>

              <div className="flex items-center gap-3 mb-3 text-xs text-slate-500">
                <span className="px-2 py-1 rounded bg-slate-100">{course.level}</span>
                <span>{course.lessons} 节</span>
                <span>{course.totalDuration}</span>
              </div>

              <p className="text-sm text-slate-600 line-clamp-2 mb-4">{course.description}</p>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="text-sm text-slate-500">
                  {course.students.toLocaleString()} 人正在学习
                </div>
                <div className="text-right">
                  {course.isFree ? (
                    <span className="text-green-600 font-semibold">免费</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      {course.originalPrice && (
                        <span className="text-xs text-slate-400 line-through">
                          ¥{course.originalPrice}
                        </span>
                      )}
                      <span className="text-brand-600 font-bold">¥{course.price}</span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-500">暂无该分类下的课程</div>
        )}

        {/* CTA */}
        <div className="mt-12 bg-brand-50 rounded-xl p-8 text-center">
          <h3 className="text-lg font-bold text-slate-900 mb-2">想成为课程讲师？</h3>
          <p className="text-slate-600 mb-4">
            如果你有跨境电商、AI、合规等领域的实战经验，欢迎申请入驻讲师，把你的知识变现。
          </p>
          <button
            onClick={() => setChatOpen(true)}
            className="inline-block px-6 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors"
          >
            {isLoggedIn ? '联系平台运营' : '注册后申请'}
          </button>
          <p className="text-xs text-slate-500 mt-3">
            点击后将打开客服对话框，运营助理会在工作日 9:00-18:00 内回复您的讲师申请。
          </p>
        </div>
      </div>
    </div>
  );
}
