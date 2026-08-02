const logger = require('../utils/logger');

// 404 处理
const notFound = (req, res, next) => {
  res.status(404).json({
    error: '接口不存在',
    path: req.originalUrl,
    method: req.method
  });
};

// 全局错误处理
// 安全策略：仅在开发环境返回 stack trace，生产环境绝不返回敏感信息
const errorHandler = (err, req, res, next) => {
  logger.error(err.stack);

  const statusCode = err.statusCode || 500;
  const isDev = process.env.NODE_ENV === 'development';

  // 生产环境：统一错误消息，避免泄露内部信息
  const message = isDev
    ? (err.message || '服务器内部错误')
    : (statusCode < 500 ? (err.message || '请求错误') : '服务器内部错误，请稍后重试');

  const response = { error: message };
  if (isDev) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = { notFound, errorHandler };