// OPC 部署平台定价配置

export const DEPLOY_PACKAGES = [
  {
    id: 'deploy-experience',
    name: '体验版',
    tagline: '个人开发者快速验证',
    price: 99,
    period: '月',
    agentCount: 1,
    monthlyCalls: 1000,
    overageCallPrice: 0.099, // 超出套餐后按量单价（元/次）
    concurrentRequests: 5,
    knowledgeBases: 1,
    knowledgeBaseSize: '100MB',
    models: ['Kimi', '通义', '文心', 'DeepSeek'],
    teamSize: 1,
    workflowNodes: 5,
    customDomain: false,
    apiAccess: false,
    monitoring: '基础',
    support: '社区',
    sla: null,
    isFree: false,
  },
  {
    id: 'deploy-startup',
    name: '创业版',
    tagline: '中小团队生产环境',
    price: 299,
    period: '月',
    agentCount: 5,
    monthlyCalls: 10000,
    overageCallPrice: 0.03,
    concurrentRequests: 30,
    knowledgeBases: 3,
    knowledgeBaseSize: '1GB',
    models: ['Kimi', '通义', '文心', 'DeepSeek', 'GPT-4o-mini', 'Claude 3.5 Haiku'],
    teamSize: 3,
    workflowNodes: 20,
    customDomain: true,
    apiAccess: true,
    monitoring: '标准监控',
    support: '在线客服',
    sla: '99.5%',
    isPopular: true,
  },
  {
    id: 'deploy-team',
    name: '团队版',
    tagline: '成长企业规模化部署',
    price: 999,
    period: '月',
    agentCount: 20,
    monthlyCalls: 100000,
    overageCallPrice: 0.01,
    concurrentRequests: 200,
    knowledgeBases: 10,
    knowledgeBaseSize: '10GB',
    models: ['全模型支持', 'GPT-4o', 'Claude 4.8', '专属微调'],
    teamSize: 10,
    workflowNodes: 100,
    customDomain: true,
    apiAccess: true,
    monitoring: '高级监控+审计',
    support: '优先响应（4小时）',
    sla: '99.9%',
  },
  {
    id: 'deploy-enterprise',
    name: '企业版',
    tagline: '大企业私有化定制',
    price: null,
    period: '定制',
    agentCount: null, // 无限
    monthlyCalls: null, // 无限
    overageCallPrice: null, // 企业版按合同定价
    concurrentRequests: null, // 无限
    knowledgeBases: null, // 无限
    knowledgeBaseSize: '无限',
    models: ['私有化模型', '专属GPU', '模型微调'],
    teamSize: null, // 无限
    workflowNodes: null, // 无限
    customDomain: true,
    apiAccess: true,
    monitoring: '企业级监控',
    support: '专属客户成功经理',
    sla: '99.99%',
    isEnterprise: true,
  },
];

export const DEPLOY_ADDONS = [
  {
    id: 'addon-agent',
    name: 'Agent 扩展位',
    price: 50,
    unit: '月/个',
    description: '超出套餐后增加 Agent 数量',
  },
  {
    id: 'addon-calls',
    name: 'API 调用超额',
    price: null, // 改为分档计价，此处仅作展示占位
    unit: '按套餐档位',
    description: '体验版 ¥0.099/次、创业版 ¥0.03/次、团队版 ¥0.01/次，企业版另议',
  },
  {
    id: 'addon-storage',
    name: '知识库容量',
    price: 10,
    unit: '月/GB',
    description: '超出套餐后增加存储容量',
  },
  {
    id: 'addon-member',
    name: '团队成员',
    price: 30,
    unit: '月/人',
    description: '超出套餐后增加团队人数',
  },
];
