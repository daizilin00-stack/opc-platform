'use client';

import { useState } from 'react';
import Link from 'next/link';

const forumSections = [
  {
    id: 'business',
    name: '跨境商机',
    icon: '💼',
    description: '官方认证商机、商业合作、市场拓展',
    posts: 128,
  },
  {
    id: 'experience',
    name: '出海经验',
    icon: '🚢',
    description: '成功出海案例、踩坑记录、实战经验',
    posts: 256,
  },
  {
    id: 'resources',
    name: '资源对接',
    icon: '🔗',
    description: '物流、仓储、支付、本地服务商',
    posts: 89,
  },
  {
    id: 'tech',
    name: '技术交流',
    icon: '⚙️',
    description: 'AI工具、跨境技术方案、开发讨论',
    posts: 167,
  },
  {
    id: 'help',
    name: '新手问答',
    icon: '❓',
    description: '注册、合规、税务、法律问题',
    posts: 342,
  },
];

const hotPosts = [
  {
    id: 'P001',
    title: '新加坡某美妆品牌寻找中国代理商，预算¥50万',
    author: '新加坡品牌方',
    section: 'business',
    replies: 23,
    views: 1205,
    isOfficial: true,
  },
  {
    id: 'P002',
    title: '我的火锅品牌出海新加坡经验：从0到3家门店',
    author: '出海餐饮人',
    section: 'experience',
    replies: 45,
    views: 3400,
    isOfficial: false,
  },
  {
    id: 'P003',
    title: 'TikTok Shop新加坡站入驻攻略（2026最新）',
    author: '跨境电商老兵',
    section: 'resources',
    replies: 67,
    views: 5600,
    isOfficial: false,
  },
  {
    id: 'P004',
    title: '如何通过平台合规调用GPT-4o？实测对比',
    author: 'AI开发者',
    section: 'tech',
    replies: 34,
    views: 2100,
    isOfficial: false,
  },
  {
    id: 'P005',
    title: '【官方】平台防跳单机制说明与信用体系介绍',
    author: '平台运营',
    section: 'help',
    replies: 89,
    views: 7800,
    isOfficial: true,
  },
];

export default function CommunityPage() {
  const [activeSection, setActiveSection] = useState('all');

  const filteredPosts = activeSection === 'all' 
    ? hotPosts 
    : hotPosts.filter((p) => p.section === activeSection);

  return (
    <div className="min-h-screen bg-slate-50">
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-3">跨境社区</h1>
          <p className="text-slate-600">连接中国与全球商业机会，分享经验、对接资源</p>
        </div>

        {/* 板块 */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {forumSections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`card text-left hover:shadow-md transition-shadow ${
                activeSection === section.id ? 'ring-2 ring-brand-500' : ''
              }`}
            >
              <div className="text-2xl mb-2">{section.icon}</div>
              <h3 className="font-bold text-slate-900 mb-1">{section.name}</h3>
              <p className="text-xs text-slate-500 mb-2">{section.description}</p>
              <span className="text-xs text-slate-400">{section.posts} 帖子</span>
            </button>
          ))}
        </div>

        {/* 帖子列表 */}
        <div className="card bg-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900">热门帖子</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveSection('all')}
                className={`text-sm px-3 py-1 rounded-full transition-colors ${
                  activeSection === 'all' ? 'bg-brand-100 text-brand-700' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                全部
              </button>
              {forumSections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`text-sm px-3 py-1 rounded-full transition-colors ${
                    activeSection === s.id ? 'bg-brand-100 text-brand-700' : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredPosts.map((post) => (
              <div key={post.id} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-lg transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {post.isOfficial && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 font-medium">
                        官方
                      </span>
                    )}
                    <h4 className="font-medium text-slate-900">{post.title}</h4>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>{post.author}</span>
                    <span>·</span>
                    <span>{post.replies} 回复</span>
                    <span>·</span>
                    <span>{post.views} 浏览</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 发布提示 */}
        <div className="mt-6 card bg-accent-50 border border-accent-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-accent-700 mb-1">有跨境需求？</h3>
              <p className="text-sm text-accent-600">
                发布任务到任务大厅，获得精准匹配。社区讨论请遵守平台规则，禁止发布联系方式诱导私下交易。
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/tasks" className="btn-primary text-sm">
                发布任务
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
