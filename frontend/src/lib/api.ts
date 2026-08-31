import { getToken } from './store';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export { API_BASE };

async function request(path: string, options: any = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || `请求失败: ${res.status}`);
  }

  return data;
}

export const auth = {
  register: (phone: string, password: string, realName: string, accountType: 'individual' | 'enterprise' = 'individual') =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ phone, password, realName, accountType }),
    }),

  login: (phone: string, password: string) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    }),

  changePassword: (currentPassword: string, newPassword: string) =>
    request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  forgotPassword: (phone: string) =>
    request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),

  resetPassword: (phone: string, code: string, newPassword: string) =>
    request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ phone, code, newPassword }),
    }),

  verifyId: (idCard: string, realName: string) =>
    request('/auth/verify-id', {
      method: 'POST',
      body: JSON.stringify({ idCard, realName }),
    }),

  verifyCompany: (companyName: string, registrationNo: string, companyType: string) =>
    request('/auth/verify-company', {
      method: 'POST',
      body: JSON.stringify({ companyName, registrationNo, companyType }),
    }),

  signContract: (contractVersion: string, agreed: boolean) =>
    request('/auth/sign-contract', {
      method: 'POST',
      body: JSON.stringify({ contractVersion, agreed }),
    }),

  getStatus: () => request('/auth/status'),
};

export const billing = {
  getWallet: () => request('/billing/wallet'),
  recharge: (amount: number, paymentMethod: string) =>
    request('/billing/wallet/recharge', {
      method: 'POST',
      body: JSON.stringify({ amount, paymentMethod }),
    }),
  getTokenUsage: (period = 'current_month') =>
    request(`/billing/token/usage?period=${period}`),
  getTokenDetails: (limit = 50, offset = 0) =>
    request(`/billing/token/details?limit=${limit}&offset=${offset}`),
  recordToken: (agentType: string, modelName: string, promptTokens: number, completionTokens: number, costCny: number) =>
    request('/billing/token/record', {
      method: 'POST',
      body: JSON.stringify({ agentType, modelName, promptTokens, completionTokens, costCny }),
    }),
  getPackages: () => request('/billing/packages'),
};

export const tasks = {
  list: () => request('/tasks'),
  create: (task: any) =>
    request('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    }),
  get: (id: string) => request(`/tasks/${id}`),
  update: (id: string, updates: any) =>
    request(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),
  claim: (id: string) =>
    request(`/tasks/${id}/claim`, {
      method: 'POST',
    }),
};

export const agents = {
  list: () => request('/agents'),
  invoke: (agentType: string, prompt: string) =>
    request('/agents/invoke', {
      method: 'POST',
      body: JSON.stringify({ agentType, prompt }),
    }),
};

export const models = {
  list: () => request('/models'),

  chat: (model: string, messages: Array<{role: string; content: string}>, temperature?: number, maxTokens?: number) =>
    request('/models/chat', {
      method: 'POST',
      body: JSON.stringify({ model, messages, temperature, maxTokens }),
    }),

  chatStream: (model: string, messages: Array<{role: string; content: string}>, onChunk: (chunk: string) => void, temperature?: number, maxTokens?: number) => {
    const token = getToken();
    return new Promise<{ usage: any; cost: any }>((resolve, reject) => {
      const eventSource = new EventSource(
        `${API_BASE}/models/chat/stream`,
      );
      // SSE via fetch because EventSource doesn't support POST
      fetch(`${API_BASE}/models/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ model, messages, temperature, maxTokens }),
      }).then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          reject(new Error(data?.error || `请求失败: ${res.status}`));
          return;
        }
        const reader = res.body?.getReader();
        if (!reader) {
          reject(new Error('无法读取响应流'));
          return;
        }
        const decoder = new TextDecoder();
        let buffer = '';
        let result: any = null;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data: ')) continue;
            const jsonStr = trimmed.slice(6);
            if (jsonStr === '[DONE]') continue;
            try {
              const data = JSON.parse(jsonStr);
              if (data.error) {
                reject(new Error(data.message || '流式响应错误'));
                return;
              }
              if (data.done) {
                result = { usage: data.usage, cost: data.cost };
              } else if (data.content) {
                onChunk(data.content);
              }
            } catch {}
          }
        }
        resolve(result || { usage: null, cost: null });
      }).catch(reject);
    });
  },
};

export const users = {
  getProfile: () => request('/users/me'),
  updateProfile: (updates: any) =>
    request('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),
};

export const products = {
  list: (type?: string) => {
    const query = type ? `?type=${encodeURIComponent(type)}` : '';
    return request(`/products${query}`);
  },
  get: (id: string) => request(`/products/${id}`),
  getSubscriptions: () => request('/products/subscriptions'),
};

export const payment = {
  // 获取支付配置（金额档位 + 可用支付方式）
  getConfig: () => request('/payment/config'),

  // 创建充值订单
  // amount: 元，gateway: 'mock' | 'wechat' | 'alipay'
  // productId: 可选，购买套餐/商品时传入
  createOrder: (amount: number, gateway: string = 'mock', productId?: string) =>
    request('/payment/create', {
      method: 'POST',
      body: JSON.stringify({ amount, gateway, productId }),
    }),

  // 调起支付，获取支付参数
  initiatePay: (orderId: string) =>
    request(`/payment/${orderId}/pay`, {
      method: 'POST',
    }),

  // 模拟支付自动成功（仅测试环境）
  mockAutoPay: (orderNo: string) =>
    request('/payment/mock/auto-pay', {
      method: 'POST',
      body: JSON.stringify({ orderNo }),
    }),

  // 查询订单列表
  listOrders: (params: { status?: string; limit?: number; offset?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.limit !== undefined) query.append('limit', String(params.limit));
    if (params.offset !== undefined) query.append('offset', String(params.offset));
    return request(`/payment/orders?${query.toString()}`);
  },

  // 查询单个订单
  getOrder: (orderId: string) => request(`/payment/orders/${orderId}`),
};

const deploy = {
  createAgent: (data: any) => request('/v1/deploy/agents', { method: 'POST', body: data }),
  listAgents: () => request('/v1/deploy/agents'),
  getAgent: (id: string) => request(`/v1/deploy/agents/${id}`),
  startAgent: (id: string) => request(`/v1/deploy/agents/${id}/start`, { method: 'POST' }),
  stopAgent: (id: string) => request(`/v1/deploy/agents/${id}/stop`, { method: 'POST' }),
  deleteAgent: (id: string) => request(`/v1/deploy/agents/${id}`, { method: 'DELETE' }),
};

const api = { auth, billing, models, tasks, agents, users, products, payment, deploy };
export default api;
