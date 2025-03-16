# 1. 建立前端 (React) 應用程式
FROM node:18 AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install
COPY frontend ./
RUN npm run build

# 2. 設定後端 (Express) 並整合前端的靜態檔案
FROM node:18 AS backend
WORKDIR /app
COPY backend/package.json backend/package-lock.json ./
RUN npm install

# 複製後端程式碼
COPY backend ./

# 將前端 `build` 出來的靜態檔案複製到後端 `public` 資料夾，讓 Express 提供前端內容
COPY --from=frontend-build /app/frontend/build ./public

# 設定運行 Port
ENV PORT=3001
EXPOSE 3001

# 啟動 Express 伺服器
CMD ["node", "index.js"]
