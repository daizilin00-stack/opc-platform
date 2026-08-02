export interface CourseVideo {
  id: string;
  title: string;
  duration: string;
  videoUrl?: string; // 实际视频地址，当前可用占位符
}

export interface TrainingCourse {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  cover: string; // emoji 或图片路径
  level: '入门' | '进阶' | '高级';
  category: string;
  isFree: boolean;
  price: number;
  originalPrice?: number;
  students: number;
  lessons: number;
  totalDuration: string;
  instructor: string;
  tags: string[];
  outline: string[];
  videos: CourseVideo[];
  whatYouWillLearn: string[];
}

export const trainingCourses: TrainingCourse[] = [
  {
    slug: 'cross-border-ecommerce-intro',
    title: '跨境电商独立站入门',
    subtitle: '从 0 到 1 搭建独立站并获取首批订单',
    description: '面向零基础创业者，讲解跨境电商独立站选型、建站工具、支付收款、物流履约、合规要点，帮助你快速启动出海业务。',
    cover: '🛒',
    level: '入门',
    category: '跨境电商',
    isFree: true,
    price: 0,
    students: 1280,
    lessons: 12,
    totalDuration: '3小时20分',
    instructor: 'Celine',
    tags: ['独立站', 'Shopify', '支付收款', '物流'],
    outline: [
      '跨境电商独立站的优势与风险',
      'Shopify / WooCommerce / 自建站选型',
      '域名、服务器、主题配置实战',
      '产品上架与页面优化',
      'PayPal / Stripe / 本地支付接入',
      '物流方案：直邮 vs 海外仓',
      'SEO 与社交媒体引流基础',
      '客户服务与退换货流程',
      '数据合规与税务入门',
      '常见问题与实战案例'
    ],
    videos: [
      { id: 'v1', title: '课程介绍与学习目标', duration: '05:20' },
      { id: 'v2', title: '独立站模式解析', duration: '18:45' },
      { id: 'v3', title: 'Shopify 快速建站', duration: '32:10' },
      { id: 'v4', title: '支付与收款配置', duration: '24:30' },
      { id: 'v5', title: '物流与履约方案', duration: '28:15' },
    ],
    whatYouWillLearn: [
      '掌握独立站建站全流程',
      '了解主流支付与物流方案',
      '学会基础的 SEO 与引流方法',
      '建立合规与风险意识'
    ]
  },
  {
    slug: 'ai-agent-build',
    title: 'AI Agent 搭建实战',
    subtitle: '用 OpenClaw 平台部署你的第一个 AI 数字员工',
    description: '系统讲解 AI Agent 的设计思路、提示词工程、工具调用、多 Agent 协作，并通过 OpenClaw 部署平台完成上线。',
    cover: '🤖',
    level: '进阶',
    category: 'AI 技术',
    isFree: false,
    price: 299,
    originalPrice: 599,
    students: 856,
    lessons: 18,
    totalDuration: '5小时10分',
    instructor: 'agent-solution',
    tags: ['AI Agent', '提示词工程', 'OpenClaw', '部署'],
    outline: [
      'AI Agent 的核心概念与应用场景',
      '提示词工程：角色、任务、约束、输出格式',
      '工具调用（Function Calling）设计',
      '记忆与上下文管理',
      '多 Agent 协作与路由',
      'OpenClaw 部署平台使用指南',
      '接入模型网关与计费配置',
      '监控、日志与持续优化',
      '案例：搭建跨境电商客服 Agent',
      '案例：搭建合规审查 Agent'
    ],
    videos: [
      { id: 'v1', title: 'AI Agent 设计范式', duration: '22:00' },
      { id: 'v2', title: '提示词工程精讲', duration: '38:20' },
      { id: 'v3', title: '工具调用实战', duration: '45:30' },
      { id: 'v4', title: 'OpenClaw 部署平台操作', duration: '35:15' },
      { id: 'v5', title: '客服 Agent 案例拆解', duration: '52:40' },
    ],
    whatYouWillLearn: [
      '独立设计并部署 AI Agent',
      '掌握提示词工程与工具调用',
      '理解多 Agent 协作架构',
      '完成一个可上线的业务 Agent'
    ]
  },
  {
    slug: 'tiktok-content-monetization',
    title: 'TikTok 内容变现指南',
    subtitle: '从内容创作到多渠道变现的完整路径',
    description: '面向东南亚市场（新加坡、马来西亚、泰国等），讲解 TikTok 账号运营、短视频创作、直播带货、流量变现与合规要点。',
    cover: '🎬',
    level: '入门',
    category: '内容出海',
    isFree: true,
    price: 0,
    students: 2340,
    lessons: 10,
    totalDuration: '2小时45分',
    instructor: 'agent-sales',
    tags: ['TikTok', '短视频', '内容出海', '变现'],
    outline: [
      'TikTok 东南亚市场概览',
      '账号定位与人设打造',
      '短视频脚本与拍摄技巧',
      '剪辑、字幕与本地化',
      '发布节奏与算法推荐机制',
      '直播带货入门',
      '广告投流与达人合作',
      '内容变现模式：佣金、打赏、知识付费',
      '合规与版权风险',
      '案例：从 0 到 10 万粉的跨境账号'
    ],
    videos: [
      { id: 'v1', title: 'TikTok 东南亚市场机会', duration: '12:30' },
      { id: 'v2', title: '账号定位与人设', duration: '20:00' },
      { id: 'v3', title: '短视频脚本模板', duration: '28:45' },
      { id: 'v4', title: '发布与算法机制', duration: '22:15' },
      { id: 'v5', title: '变现路径总结', duration: '18:20' },
    ],
    whatYouWillLearn: [
      '理解 TikTok 东南亚内容生态',
      '掌握账号定位与内容创作方法',
      '了解直播、广告、达人合作等变现路径',
      '规避常见合规与版权风险'
    ]
  },
  {
    slug: 'data-compliance-singapore',
    title: '新加坡数据合规实务',
    subtitle: '跨境业务必知的新加坡数据保护法规',
    description: '深入讲解新加坡《个人数据保护法》（PDPA）、数据跨境传输义务、 consent 管理、数据泄露响应机制，以及与中国企业出海相关的合规要点。',
    cover: '⚖️',
    level: '高级',
    category: '合规',
    isFree: false,
    price: 599,
    originalPrice: 999,
    students: 432,
    lessons: 14,
    totalDuration: '4小时30分',
    instructor: 'agent-compliance',
    tags: ['新加坡', 'PDPA', '数据合规', '跨境'],
    outline: [
      '新加坡 PDPA 核心原则',
      'Consent 获取与管理',
      'Purpose Limitation 与数据最小化',
      '数据跨境传输规则',
      '数据主体权利请求处理',
      '数据泄露通知义务',
      'DPO（数据保护官）职责',
      '中国出海企业常见合规差距',
      '平台合规工具与审计日志使用',
      '案例：电商企业 PDPA 合规整改'
    ],
    videos: [
      { id: 'v1', title: 'PDPA 立法背景与适用范围', duration: '25:00' },
      { id: 'v2', title: 'Consent 机制设计', duration: '32:10' },
      { id: 'v3', title: '数据跨境传输规则', duration: '28:40' },
      { id: 'v4', title: '数据泄露响应流程', duration: '35:20' },
      { id: 'v5', title: '中国企业出海合规案例', duration: '45:00' },
    ],
    whatYouWillLearn: [
      '系统理解新加坡 PDPA 核心要求',
      '掌握 Consent 与数据主体权利管理',
      '了解数据跨境传输合规路径',
      '建立数据泄露响应机制'
    ]
  },
  {
    slug: 'token-economics',
    title: '大模型 Token 经济学',
    subtitle: '如何用最低成本用好大模型',
    description: '从 Token 计费原理、模型选择、提示词优化、缓存策略到成本监控，帮助你系统降低 AI 应用成本。',
    cover: '💰',
    level: '进阶',
    category: '成本控制',
    isFree: true,
    price: 0,
    students: 1780,
    lessons: 8,
    totalDuration: '2小时10分',
    instructor: 'agent-ceo',
    tags: ['Token', '成本控制', '提示词优化', '模型选择'],
    outline: [
      'Token 是什么？如何计费？',
      'CSDP 模型定价解析',
      '模型选择：简单任务用经济模型，复杂任务用旗舰模型',
      '提示词压缩与上下文管理',
      'Function Calling 与缓存策略',
      '用量监控与异常预警',
      '成本优化实战案例',
      '常见误区与排坑'
    ],
    videos: [
      { id: 'v1', title: 'Token 计费原理', duration: '15:00' },
      { id: 'v2', title: 'CSDP 定价模型解析', duration: '20:30' },
      { id: 'v3', title: '模型选择策略', duration: '18:45' },
      { id: 'v4', title: '提示词优化技巧', duration: '25:10' },
      { id: 'v5', title: '成本监控与优化', duration: '22:30' },
    ],
    whatYouWillLearn: [
      '理解 Token 计费与模型定价',
      '根据场景选择合适模型',
      '掌握提示词压缩与上下文管理',
      '建立成本监控与优化机制'
    ]
  },
  {
    slug: 'api-integration-master',
    title: '平台 API 集成进阶',
    subtitle: '把 CSDP 模型能力接入你自己的应用',
    description: '面向开发者，讲解 CSDP 模型网关的鉴权、OpenAI SDK 兼容调用、流式输出、错误处理、Webhook 集成，以及生产环境最佳实践。',
    cover: '💻',
    level: '高级',
    category: '开发',
    isFree: false,
    price: 399,
    originalPrice: 799,
    students: 645,
    lessons: 16,
    totalDuration: '6小时00分',
    instructor: 'agent-solution',
    tags: ['API', 'SDK', '流式', 'Webhook', '生产部署'],
    outline: [
      'CSDP 模型网关架构 overview',
      'Bearer Token 鉴权与 token 刷新',
      '使用 OpenAI SDK 调用 CSDP 接口',
      '非流式与流式对话实现',
      'Function Calling 与 JSON Mode',
      '错误处理与重试机制',
      'Webhook 接收事件与签名验证',
      '用量监控与成本告警',
      '生产环境部署建议',
      '案例：把 CSDP 接入自有客服系统'
    ],
    videos: [
      { id: 'v1', title: '模型网关架构与鉴权', duration: '30:00' },
      { id: 'v2', title: 'OpenAI SDK 兼容接入', duration: '45:20' },
      { id: 'v3', title: '流式输出实现', duration: '52:10' },
      { id: 'v4', title: 'Function Calling 实战', duration: '48:30' },
      { id: 'v5', title: 'Webhook 与生产部署', duration: '55:00' },
    ],
    whatYouWillLearn: [
      '掌握 CSDP 模型网关的接入方式',
      '实现 OpenAI SDK 兼容调用',
      '处理流式输出与错误重试',
      '完成生产级 API 集成'
    ]
  }
];
