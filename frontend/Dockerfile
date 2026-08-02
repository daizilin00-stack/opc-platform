FROM node:20-alpine

WORKDIR /app

# 复制依赖定义
COPY package.json package-lock.json* ./

# 开发模式：运行时安装依赖（volume 挂载后可能变化）
# 生产模式：RUN npm ci --only=production

EXPOSE 3000

CMD ["sh", "-c", "npm install && npm run dev"]
