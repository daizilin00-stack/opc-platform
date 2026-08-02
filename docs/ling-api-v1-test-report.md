# LingAPI 高级专项测试报告

> 测试时间：2026-07-17 16:36  
> 测试人：团坐009  
> 测试脚本：`opc-platform/scripts/test-ling-api-advanced.py`  
> 完整日志：`opc-platform/log/test-ling-api-advanced-2026-07-17.log`  
> 环境：`http://118.196.5.14:5208`，账号 `Celine_dev_use`

---

## 1. Function Calling / Tools

| 模型 | 状态 | 备注 |
|------|------|------|
| gpt-5.4 | ✅ 支持 | 正确返回 `tool_calls` |
| claude-sonnet-5 | ✅ 支持 | 正确返回 `tool_calls` |
| deepseek-v4-flash | ❌ 未支持 | 返回普通内容，`finish_reason=length` |
| kimi-k2.5 | ✅ 支持 | 正确返回 `tool_calls` |

---

## 2. JSON Mode / Structured Output

| 模型 | 状态 | 备注 |
|------|------|------|
| gpt-5.4 | ✅ 支持 | 返回合法 JSON |
| claude-sonnet-5 | ❌ 未支持 | 返回文本+XML 标签，未按 JSON 格式 |
| deepseek-v4-flash | ✅ 支持 | 返回合法 JSON |
| kimi-k2.5 | ✅ 支持 | 返回合法 JSON |

---

## 3. 品牌隔离

- 响应头暴露 `X-New-Api-Version: v0.0.0` 和 `X-Oneapi-Request-Id`，存在 NewAPI/OneAPI 品牌痕迹。
- 错误信息包含 `type: new_api_error`，未做脱敏。
- **结论**：当前网关品牌隔离未完全做好，需要配置自定义响应头/错误信息重写。

---

## 4. Usage 计费精度

- **gpt-5.4**：非流式有 `usage`；流式 `usage` 为 `null`（需要确认是否所有模型流式都缺失）。
- **deepseek-v4-flash**：非流式与流式均返回 `usage`，精度一致。
- **注意**：gpt-5.4 普通请求的 `prompt_tokens` 异常偏高（4397+），推测网关内部注入了大量系统提示，需要进一步确认是否影响计费。

---

## 5. 并发压测（gpt-5.4-mini，10 workers，30 请求）

| 指标 | 结果 |
|------|------|
| 成功率 | 100%（30/30） |
| 平均延迟 | 2185 ms |
| 最大延迟 | 4590 ms |
| RPS | 4.19 |
| 限流 | 未触发 |

**结论**：网关可承受 10 并发，未触发限流。

---

## 6. 后续待办

- [ ] 更新 `docs/ling-api-v1-follow-up.md`：把 Function Calling / JSON Mode 状态从「待确认」改为具体结果。
- [x] 更新 `infra/config/ling-api-test.env` checklist：连接测试、获取 API Key 已勾选。
- [ ] 本地 NewAPI 上游渠道配置（需 docker 环境）。
- [ ] 处理 gpt-5.4 流式无 usage 和 prompt_tokens 偏高的问题。
- [ ] 处理品牌隔离暴露 NewAPI/OneAPI 头的问题。

---

**状态**：测试已完成，关键问题已记录，待网关配置和商务确认后推进集成。
