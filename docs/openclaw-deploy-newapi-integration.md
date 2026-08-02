# OpenClaw 部署平台 × NewAPI 集成设计

> 版本：V1.0  
> 时间：2026-06-29  
> 状态：实施中

---

## 一、集成架构

```
用户创建 Agent → 选择模型 → 自动分配 API Key
                    ↓
            ┌───────┴───────┐
            ↓               ↓
        计算资源          模型调用
     (Docker容器)      (NewAPI网关)
            ↓               ↓
     固定费用(¥/小时)   按token计费
            └───────┬───────┘
                    ↓
              OPC 统一账单
```

---

## 二、核心组件

### 2.1 部署服务 (Deploy Service)

**职责**：管理 Agent 容器的生命周期

| 功能 | 说明 |
|------|------|
| 创建 | 基于模板创建 Docker 容器 |
| 启动/停止 | 控制容器运行状态 |
| 销毁 | 释放资源 |
| 监控 | CPU/内存/网络用量 |

### 2.2 模型网关 (Model Gateway)

**职责**：代理模型调用请求到 NewAPI

| 功能 | 说明 |
|------|------|
| 请求转发 | OpenAI格式 → NewAPI |
| 认证注入 | 自动附加API Key |
| 用量记录 | 记录token消耗 |
| 错误处理 | 统一错误响应 |

### 2.3 计费聚合 (Billing Aggregator)

**职责**：合并计算资源费和模型调用费

| 费用类型 | 计费方式 | 示例 |
|---------|---------|------|
| 计算资源 | 按小时固定 | ¥0.05/小时 |
| 模型调用 | 按token浮动 | ¥0.004/1K tokens |
| 存储 | 按容量 | ¥0.1/GB/月 |

---

## 三、API 设计

### 3.1 创建 Agent

```http
POST /api/v1/deploy/agents
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "name": "客服助手",
  "description": "7x24小时客服Agent",
  "template": "customer-service-v1",
  "model": "gpt-4o",
  "config": {
    "system_prompt": "你是一个专业的客服助手...",
    "temperature": 0.7,
    "max_tokens": 2000
  },
  "resources": {
    "cpu": "1核",
    "memory": "2GB",
    "storage": "10GB"
  }
}
```

**响应**：
```json
{
  "id": "agent_abc123",
  "name": "客服助手",
  "status": "creating",
  "endpoint": "https://agent-abc123.agents.opc-platform.com",
  "api_key": "opc-agt-***",
  "model_config": {
    "model": "gpt-4o",
    "base_url": "https://api.opc-platform.com/v1",
    "api_key": "opc-agt-***"
  },
  "pricing": {
    "compute": {
      "hourly": 0.05,
      "currency": "CNY"
    },
    "model": {
      "input": 0.004,
      "output": 0.0098,
      "currency": "CNY/1K_tokens"
    }
  },
  "created_at": "2026-06-29T10:00:00Z"
}
```

### 3.2 调用 Agent

```http
POST https://agent-abc123.agents.opc-platform.com/chat
Authorization: Bearer opc-agt-***
Content-Type: application/json

{
  "messages": [
    {"role": "user", "content": "你好"}
  ],
  "stream": true
}
```

**流程**：
1. 请求到达 Agent 容器
2. Agent 处理业务逻辑
3. 调用模型时 → 转发到 Model Gateway
4. Model Gateway → NewAPI → LingAPI
5. 返回响应，同时记录用量

### 3.3 获取用量统计

```http
GET /api/v1/deploy/agents/agent_abc123/usage
Authorization: Bearer <user_token>
```

**响应**：
```json
{
  "agent_id": "agent_abc123",
  "period": "2026-06-01 to 2026-06-29",
  "compute": {
    "hours": 720,
    "cost": 36.00
  },
  "model": {
    "prompt_tokens": 150000,
    "completion_tokens": 80000,
    "cost": 1.39
  },
  "total_cost": 37.39,
  "currency": "CNY"
}
```

---

## 四、数据库设计

### 4.1 agents 表

```sql
CREATE TABLE deploy_agents (
  id VARCHAR(32) PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template VARCHAR(100),
  status ENUM('creating', 'running', 'stopped', 'error', 'destroyed'),
  model VARCHAR(50),
  system_prompt TEXT,
  endpoint VARCHAR(255),
  api_key_hash VARCHAR(255),
  container_id VARCHAR(255),
  cpu_limit VARCHAR(20),
  memory_limit VARCHAR(20),
  storage_limit VARCHAR(20),
  hourly_price DECIMAL(10,4),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status)
);
```

### 4.2 agent_usage 表

```sql
CREATE TABLE deploy_agent_usage (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  agent_id VARCHAR(32) NOT NULL,
  date DATE NOT NULL,
  hours DECIMAL(10,2) DEFAULT 0,
  prompt_tokens BIGINT DEFAULT 0,
  completion_tokens BIGINT DEFAULT 0,
  compute_cost DECIMAL(10,4) DEFAULT 0,
  model_cost DECIMAL(10,4) DEFAULT 0,
  total_cost DECIMAL(10,4) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_agent_date (agent_id, date),
  INDEX idx_date (date)
);
```

---

## 五、部署模板

### 5.1 预设模板

| 模板ID | 名称 | 配置 | 适用场景 |
|--------|------|------|---------|
| `minimal` | 最小化 | 0.5核/1GB/5GB | 测试、原型 |
| `standard` | 标准 | 1核/2GB/10GB | 生产环境 |
| `performance` | 高性能 | 2核/4GB/20GB | 高并发 |
| `gpu` | GPU加速 | 2核/8GB/50GB+T4 | AI推理 |

### 5.2 模板配置示例

```yaml
# templates/customer-service-v1.yml
name: 客服助手模板
description: 适用于电商/企业客服场景

resources:
  cpu: 1
  memory: 2G
  storage: 10G

runtime:
  image: opc/agent-base:v1
  port: 8080
  env:
    - MODEL_PROVIDER=opc
    - MODEL_BASE_URL=https://api.opc-platform.com/v1

model:
  default: gpt-4o
  fallback: gpt-4o-mini
  options:
    - gpt-4o
    - claude-3.5-sonnet
    - qwen-max

scaling:
  min_instances: 1
  max_instances: 5
  auto_scale: true
  cpu_threshold: 70%
```

---

## 六、安全设计

### 6.1 API Key 管理

```
Agent API Key 格式：opc-agt-{agent_id}-{random}
示例：opc-agt-abc123-x7k9m2

权限：
- 只能调用该Agent的聊天接口
- 不能访问其他Agent
- 不能访问平台管理接口
- 支持限速（100 req/min）
```

### 6.2 网络隔离

```
每个Agent运行在独立Docker网络
┌─────────────┐     ┌─────────────┐
│  Agent A    │     │  Agent B    │
│  容器       │     │  容器       │
│  172.18.1.2 │     │  172.18.2.2 │
└──────┬──────┘     └──────┬──────┘
       │                   │
       └───────┬───────────┘
               │
        ┌──────┴──────┐
        │  Model      │
        │  Gateway    │
        │  (共享)     │
        └─────────────┘
```

---

## 七、实施步骤

### Phase 1：基础部署（本周）
- [ ] 创建 deploy_agents 和 agent_usage 表
- [ ] 实现 Agent 创建/删除 API
- [ ] 集成 Docker API 管理容器
- [ ] 实现基础监控

### Phase 2：模型集成（下周）
- [ ] 实现 Model Gateway
- [ ] 对接 NewAPI
- [ ] 实现用量记录
- [ ] 集成到Agent运行时

### Phase 3：计费对接（第3周）
- [ ] 计算资源计费
- [ ] 模型调用计费
- [ ] 统一账单生成
- [ ] 钱包扣款集成

### Phase 4：前端界面（第4周）
- [ ] Agent 管理页面
- [ ] 创建向导
- [ ] 用量统计面板
- [ ] 实时监控

---

**CEO 签批**：团坐009  
**状态**：待开发实施
