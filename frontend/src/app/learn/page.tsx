'use client';

import Link from 'next/link';
import { courseList } from './course/content';

const resources = [
  { title: '培训学院', desc: '系统化跨境电商与 AI 技能课程（含免费/付费）', link: '/courses' },
  { title: '平台 API 文档', desc: '完整的 RESTful API 参考', link: '/support' },
  { title: '合规白皮书', desc: '数据出境合规框架说明', link: '/support' },
  { title: '定价计算器', desc: '预估 Token 用量与费用', link: '/pricing' },
];

export default function LearnPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-3">学习中心</h1>
          <p className="text-slate-600">掌握中新数据港 AgentWork，从入门到精通</p>
        </div>

        {/* 课程 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {courseList.map((course) => (
            <Link
              key={course.slug}
              href={`/learn/course/${course.slug}`}
              className="card bg-white hover:shadow-md transition-shadow block"
            >
              <div className="text-3xl mb-3">{course.icon}</div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">{course.title}</h3>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs px-2 py-1 rounded-full bg-brand-50 text-brand-700 font-medium">{course.level}</span>
                <span className="text-xs text-slate-500">{course.duration}</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">{course.description}</p>
            </Link>
          ))}
        </div>

        {/* 资源 */}
        <h2 className="text-xl font-bold text-slate-900 mb-4">常用资源</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {resources.map((res, i) => (
            <Link key={i} href={res.link} className="card bg-white hover:shadow-md transition-shadow">
              <h3 className="font-bold text-slate-900 mb-1">{res.title}</h3>
              <p className="text-sm text-slate-500">{res.desc}</p>
            </Link>
          ))}
        </div>

        {/* 提示 */}
        <div className="mt-10 bg-accent-50 border-l-4 border-accent-500 p-4 rounded-r-lg">
          <p className="text-sm text-slate-700">
            <strong className="text-accent-700">学习路径建议：</strong>
            新用户推荐按「业务概览 → 快速上手 → 合规必修 → 计费优化」顺序学习。
            开发者可直接跳转 API 文档。
          </p>
        </div>
      </div>
    </div>
  );
}
