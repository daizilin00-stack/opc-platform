export interface CourseContent {
  title: string;
  duration: string;
  level: string;
  icon: string;
  description: string;
  sections: {
    heading: string;
    paragraphs: string[];
    bullets?: string[];
  }[];
}

export const courseContents: Record<string, CourseContent> = {
  'overview': {
    title: '中新数据港业务概览',
    duration: '15 分钟',
    level: '入门',
    icon: '🏢',
    description: '了解中新数据港背景、跨境数据专线能力、AgentWork 平台定位。',
    sections: [
      {
        heading: '什么是中新数据港',
        paragraphs: [
          '中新数据港（China-Singapore Data Port，CSDP）依托中新（重庆）战略性互联互通示范项目，致力于打造连接中国与东盟的跨境数据流通枢纽。',
          '平台为企业提供合规、稳定、高效的跨境数据通道与 AI 数字员工服务，降低个人创业者和中小企业进入东南亚市场的技术与合规门槛。'
        ],
        bullets: [
          '运营主体：中新数据港重庆公司（中国）与 CHINA-SINGAPORE DATA PORT PTE. LTD.（新加坡）',
          '核心依托：中新（重庆）互联网数据专线',
          '服务对象：跨境电商、内容出海、AI Agent 开发者、企业 IT/合规团队'
        ]
      },
      {
        heading: 'CSDP-WAN 跨境专线能力',
        paragraphs: [
          'CSDP-WAN 是平台提供的合规跨境网络专线，帮助用户在无需自行注册海外账号、无需外币信用卡的情况下，安全访问海外模型与业务系统。',
          '专线采用统一合规管理，按带宽计费（¥300/M/月），当前提供 5M / 10M / 20M 三档。'
        ],
        bullets: [
          '独享带宽、不限流量',
          '可选专属 IP，防关联、可审计',
          '自动配置网络标识，支持多环境隔离',
          '7×24 技术监控与审计日志'
        ]
      },
      {
        heading: 'AgentWork 平台定位',
        paragraphs: [
          'AgentWork 是中新数据港旗下的「AI 数字员工即服务」平台。个人创业者注册后，可调取销售、客服、技术、合规、助理等 AI 数字员工完成跨境业务任务。',
          '平台通过集中采购海外模型 API、封装为标准化服务，让用户以人民币充值即可使用全球 AI 能力。'
        ],
        bullets: [
          'CEO：全局调度、向董事长汇报',
          '销售总监：客户开发、报价、CRM',
          '客服主管：7×24 答疑、工单、回访',
          '技术方案官：方案设计、POC、文档',
          '合规风控官：法规跟踪、资质审核、合同审查',
          '行政助理：日程、提醒、统计、通知'
        ]
      },
      {
        heading: '八大核心服务板块',
        paragraphs: [
          '开园版本重点开放四大核心能力：合规海外模型通道、OpenClaw 部署平台、硅基员工平台、Token 团购中心。后续将逐步完善开发者技能池、政务服务、IP 商业化、内容共创等模块。'
        ]
      }
    ]
  },
  'ai-employee': {
    title: 'AI 数字员工快速上手',
    duration: '20 分钟',
    level: '入门',
    icon: '🤖',
    description: '注册入驻流程、召唤第一个 AI 员工（行政助理）、常见指令示例。',
    sections: [
      {
        heading: '第一步：注册与入驻',
        paragraphs: [
          '访问 http://localhost:3002/register，使用手机号完成注册。注册后需完成企业认证（企业名称、统一社会信用代码、企业类型）并签署平台协议，即可开通全部服务。'
        ],
        bullets: [
          '手机号注册：获取短信验证码后设置密码',
          '企业认证：上传营业执照或填写企业信息',
          '签署协议：阅读并同意平台服务协议与合规承诺',
          '开通服务：认证通过后即可进入工作台'
        ]
      },
      {
        heading: '第二步：认识工作台',
        paragraphs: [
          '登录后进入工作台，可以看到账户余额、信用分、等级、本月 Token 用量等概览数据。快捷操作区域可快速进入数字员工、任务大厅、社区、网络服务、收益、学习中心等模块。'
        ]
      },
      {
        heading: '第三步：召唤第一个 AI 员工',
        paragraphs: [
          '点击工作台「召唤数字员工」或在顶部导航进入「AI 员工」，选择「行政助理」开始对话。行政助理擅长日程安排、提醒、统计、通知等日常事务。'
        ],
        bullets: [
          '输入指令："帮我安排明天下午 3 点的团队会议"',
          '追问细化："参会人包括销售总监、客服主管"',
          '导出结果："把今天的工作安排整理成 Markdown"',
          '切换角色：在对话中可指定由其他 AI 员工接管'
        ]
      },
      {
        heading: '常见指令示例',
        paragraphs: ['以下是不同角色的高频使用场景：'],
        bullets: [
          '销售总监："帮我写一份给新加坡客户的报价单"',
          '客服主管："生成 7×24 客服话术模板，包含退换货场景"',
          '技术方案官："为跨境电商客户设计一份 CSDP-WAN 5M 专线方案"',
          '合规风控官："检查这份合同的数据出境条款是否合规"',
          '行政助理："统计本周任务完成率并发送周报"'
        ]
      }
    ]
  },
  'compliance': {
    title: '跨境合规必修课',
    duration: '30 分钟',
    level: '进阶',
    icon: '🛡️',
    description: '数据出境法规（安全评估 / 标准合同 / 个人信息保护认证）、平台合规机制、客户合规义务。',
    sections: [
      {
        heading: '数据出境的三条合规路径',
        paragraphs: [
          '根据中国《数据出境安全评估办法》《个人信息出境标准合同办法》等法规，数据出境通常需要满足以下三种机制之一。平台为企业客户提供合规通道与辅助文档，但具体合规责任仍由客户承担。'
        ],
        bullets: [
          '数据出境安全评估：适用于重要数据、关键信息基础设施运营者、大规模个人信息出境等场景',
          '个人信息出境标准合同：适用于非 CIIO 的一般企业，向境外提供个人信息',
          '个人信息保护认证：通过专业机构认证，证明出境处理活动符合中国法律要求'
        ]
      },
      {
        heading: '平台合规机制',
        paragraphs: [
          '中新数据港通过 CSDP-WAN 专线、统一合规管理、审计日志、专属 IP 等机制，帮助企业降低数据出境合规风险。平台不直接提供翻墙/VPN，不代用户注册海外个人账号，不掌握用户海外账号密码。'
        ],
        bullets: [
          '所有跨境流量通过 CSDP-WAN 专线统一出口',
          '提供审计日志导出，满足监管检查需求',
          '专属 IP 防关联，降低多账号运营风险',
          'AI 员工对话与数据不用于模型训练'
        ]
      },
      {
        heading: '客户合规义务',
        paragraphs: [
          '客户在使用平台服务时，需确保自身业务符合相关法律法规，并按平台要求完成企业认证与合规承诺。'
        ],
        bullets: [
          '如实填写企业信息，保证业务真实性',
          '对出境数据的合法性、必要性负责',
          '涉及个人信息时，需取得用户授权或具备其他合法基础',
          '配合平台完成合规审查与监管协查'
        ]
      }
    ]
  },
  'token': {
    title: 'Token 计费与成本控制',
    duration: '25 分钟',
    level: '进阶',
    icon: '💎',
    description: '模型定价解析、套餐选择策略、用量监控与优化建议。',
    sections: [
      {
        heading: '什么是 Token',
        paragraphs: [
          'Token 是大模型处理文本的最小计费单位。通常 1 个中文汉字约 0.5~1 个 token，1 个英文单词约 1~1.5 个 token。平台按实际 prompt（输入）和 completion（输出）token 数分别计费。'
        ]
      },
      {
        heading: '模型定价解析',
        paragraphs: [
          '平台模型计费标准展示两个价格：官方价（各模型厂商公开价格）和 CSDP 售价（平台向用户销售的 8 折优惠价）。CSDP 售价 = 官方价 × 0.8。'
        ],
        bullets: [
          '按量计费：输入/输出分别按每 1K Token 计费',
          '按次计费：如图片生成、视频生成等按每次调用计费',
          '动态计费：部分多模态模型按分辨率、参考视频等动态计算',
          '无隐藏加价：markup 统一为 0，账单透明'
        ]
      },
      {
        heading: '套餐选择策略',
        paragraphs: [
          'Token 团购中心提供预充值模式，充值越多赠送比例越高。AI 员工套餐也包含等值 Token 额度。'
        ],
        bullets: [
          '轻量充值 ¥100：到账 ¥110，适合体验',
          '标准充值 ¥500：到账 ¥580，约 8.6 折',
          '企业充值 ¥2000：到账 ¥2400，约 8.3 折',
          '年付充值 ¥10000：到账 ¥13000，约 7.7 折'
        ]
      },
      {
        heading: '用量监控与优化',
        paragraphs: [
          '在工作台「我的用量」可查看本月 Token 消耗。优化建议：为简单任务选择经济模型（如 GPT-5.4-mini、DeepSeek V4 Flash），复杂推理任务再使用 Claude / GPT-5.5 等高端模型。'
        ]
      }
    ]
  },
  'tasks': {
    title: '任务大厅接单指南',
    duration: '20 分钟',
    level: '入门',
    icon: '📋',
    description: '任务类型、报名流程、交付标准、验收规则、收益结算。',
    sections: [
      {
        heading: '任务类型',
        paragraphs: [
          '任务大厅汇集中新数据港生态内的商业撮合与 AI 任务。创业者可接单获取收益，也可发布任务由平台 AI 数字员工或其他用户完成。'
        ],
        bullets: [
          '销售线索任务：客户开发、需求收集、报价跟进',
          '客服任务：工单回复、客户回访、满意度调查',
          '技术方案任务：方案设计、POC 文档、部署配置',
          '合规任务：合同审查、资质审核、法规跟踪',
          '内容任务：文案、脚本、素材、模板创作'
        ]
      },
      {
        heading: '接单流程',
        paragraphs: [
          '登录后进入「任务大厅」，浏览可接任务，点击「接单」即可获得任务处理权限。任务状态包括：进行中、待审核、已完成。'
        ],
        bullets: [
          '浏览任务：查看任务标题、类型、报酬、截止时间、所需技能',
          '点击接单：确认后任务进入「进行中」',
          '交付成果：按要求上传文档或提交结果',
          '等待验收：客户/平台审核通过后结算收益'
        ]
      },
      {
        heading: '交付标准与验收',
        paragraphs: [
          '交付内容需符合任务描述中的格式、质量和时效要求。平台会根据客户反馈、AI 辅助质检等手段进行综合验收。'
        ],
        bullets: [
          '文档类：格式规范、内容完整、无明显错误',
          '客服类：回复及时、态度专业、问题闭环',
          '技术类：方案可落地、参数准确、附带说明',
          '内容类：原创合规、符合目标受众'
        ]
      },
      {
        heading: '收益结算',
        paragraphs: [
          '验收通过后，任务报酬进入钱包余额。可在「收益」页面查看结算记录，并发起提现。收益结算以人民币计价，到账时间取决于提现方式。'
        ]
      }
    ]
  },
  'api': {
    title: 'API 接入与开发',
    duration: '40 分钟',
    level: '高级',
    icon: '⚙️',
    description: '平台 API 鉴权、常见调用示例、Webhook 配置、错误处理。',
    sections: [
      {
        heading: 'API 鉴权',
        paragraphs: [
          '平台 API 通过 Bearer Token 鉴权。用户登录后，前端会保存 token，后续请求需在 HTTP Header 中携带 `Authorization: Bearer <token>`。'
        ],
        bullets: [
          '登录接口：`POST /api/auth/login`',
          '注册接口：`POST /api/auth/register`',
          '所有业务接口需携带 Authorization Header',
          'Token 长期有效，修改密码后建议重新登录'
        ]
      },
      {
        heading: '常见调用示例',
        paragraphs: ['以下是几个高频 API 调用示例：'],
        bullets: [
          '获取用户信息：`GET /api/users/me`',
          '查询钱包：`GET /api/billing/wallet`',
          '调用 AI 员工：`POST /api/agents/invoke`（body: { agentType, prompt }）',
          '模型对话：`POST /api/models/chat`（body: { model, messages, temperature, maxTokens }）',
          '流式对话：`POST /api/models/chat/stream`（SSE 流式返回）'
        ]
      },
      {
        heading: 'Webhook 配置',
        paragraphs: [
          '企业用户可在后台配置 Webhook URL，用于接收任务状态变更、支付结果、合规提醒等事件。Webhook 请求会以 JSON 格式 POST 到指定地址，并附带签名供验证。'
        ]
      },
      {
        heading: '错误处理',
        paragraphs: [
          '平台 API 统一返回 JSON 格式响应。错误时 HTTP 状态码 ≥ 400，body 中包含 `error` 字段描述原因。'
        ],
        bullets: [
          '400：请求参数错误',
          '401：未登录或 token 失效',
          '403：权限不足',
          '404：资源不存在',
          '500：服务端异常，建议稍后重试'
        ]
      }
    ]
  },
  'advanced-models': {
    title: '模型网关高级接入',
    duration: '35 分钟',
    level: '高级',
    icon: '🔌',
    description: '通过 CSDP 模型网关调用全球模型，掌握 OpenAI SDK 兼容接入、流式输出、工具调用与错误处理。',
    sections: [
      {
        heading: 'CSDP 模型网关定位',
        paragraphs: [
          'CSDP 模型网关是平台统一接入全球大模型的入口。用户无需自行注册 OpenAI、Claude、Gemini 等海外账号，无需外币信用卡，只需调用 CSDP 提供的 OpenAI 兼容接口，即可使用 GPT、Claude、Gemini、DeepSeek 等模型。',
          '模型网关底层通过 NewAPI 统一路由，支持国内模型与海外模型。所有跨境流量走 CSDP-WAN 合规专线，平台统一处理数据出境与计费。'
        ],
        bullets: [
          'Base URL：`https://api.opc-platform.com/v1`（本地开发：`http://localhost:3003/api/models`）',
          '鉴权：使用 OPC 登录后获取的 Bearer Token',
          '兼容：OpenAI SDK、LangChain、LlamaIndex 等主流框架',
          '计费：按实际 Token 用量从钱包实时扣费'
        ]
      },
      {
        heading: '非流式对话示例',
        paragraphs: [
          '使用 OPC 模型网关进行非流式对话，只需将 `Authorization` 头替换为从登录接口获取的 token。'
        ],
        bullets: [
          '接口：`POST /api/models/chat`',
          '参数：model、messages、temperature、maxTokens',
          '返回：content、usage、cost、provider、latency'
        ]
      },
      {
        heading: '流式输出（SSE）',
        paragraphs: [
          '对于长文本生成，建议使用流式接口以减少等待时间。CSDP 模型网关的流式接口遵循 Server-Sent Events 格式，前端可通过 `EventSource` 或 `fetch` 读取数据流。'
        ],
        bullets: [
          '接口：`POST /api/models/chat/stream`',
          '请求体与普通对话相同',
          '返回：每个 chunk 包含 `content` 片段，最后返回 `done: true` 与 `usage`、`cost`',
          '客户端需按 SSE 格式解析 `data:` 开头的行'
        ]
      },
      {
        heading: 'OpenAI SDK 兼容接入',
        paragraphs: [
          '如果你已经使用 OpenAI SDK，通常只需修改 `apiKey` 和 `baseURL` 即可接入 CSDP 模型网关。注意：这里使用的是 OPC 登录 token，不是 OpenAI 官方 API Key。'
        ],
        bullets: [
          'JavaScript：`new OpenAI({ apiKey: opcToken, baseURL: "https://api.opc-platform.com/v1" })`',
          'Python：`OpenAI(api_key=opc_token, base_url="https://api.opc-platform.com/v1")`',
          'model 参数填写 OPC 平台支持的模型名称，如 `gpt-5.4`、`deepseek-v4-flash`'
        ]
      },
      {
        heading: '工具调用与结构化输出',
        paragraphs: [
          '部分模型支持 Function Calling（工具调用）和结构化输出（JSON Mode）。能力可用性取决于模型本身，具体以模型计费标准页标注为准。'
        ],
        bullets: [
          '工具调用：在 `tools` 参数中定义函数，模型会返回 `tool_calls`',
          '结构化输出：在请求中指定 `response_format: { type: "json_object" }`',
          '当前支持情况：gpt-5.4、claude-sonnet-5、kimi-k2.5 支持部分能力；deepseek-v4-flash 未完整支持工具调用',
          '多模态与图片生成、音频转写当前渠道暂未开放'
        ]
      },
      {
        heading: '常见问题',
        paragraphs: ['接入模型网关时常见的问题与排查方法：'],
        bullets: [
          '401 Unauthorized：检查 Bearer Token 是否有效，是否已登录',
          '403 Forbidden：检查是否已完成企业认证',
          '模型不存在：确认 model 名称是否为 OPC 平台支持的模型',
          '余额不足：充值 Token 额度后再试',
          '某些参数不生效：不同模型支持的参数不同，请参考模型计费标准'
        ]
      }
    ]
  },
};

export const courseList = Object.entries(courseContents).map(([slug, content]) => ({
  slug,
  ...content,
}));
