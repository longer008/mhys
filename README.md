# 梅花易数 - AI 智能解卦系统

基于 Next.js 构建的现代化梅花易数解卦应用，结合 AI 大模型提供深度卦象解析。

## ✨ 特性

- 🎯 传统梅花易数起卦算法
- 🤖 AI 智能解卦（支持 OpenAI、DeepSeek 等）
- 🎨 优雅的中国风界面设计
- 📱 响应式布局，支持移动端
- ⚡ 基于 Next.js 14+ 构建，性能优异
- 🔒 支持环境变量配置，保护 API 密钥安全

## 🚀 快速开始

### 本地开发

1. 克隆项目并安装依赖：

```bash
git clone <your-repo-url>
cd meihua-yishu
npm install
```

2. 配置环境变量：

```bash
# 复制环境变量示例文件
cp .env.example .env.local

# 编辑 .env.local，填入你的 API 配置
```

3. 启动开发服务器：

```bash
npm run dev
```

4. 打开浏览器访问 [http://localhost:3000](http://localhost:3000)

### 部署到 Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/meihua-yishu)

**快速部署步骤：**

1. 推送代码到 GitHub
2. 在 [Vercel](https://vercel.com/new) 导入项目
3. 配置环境变量（必填 `OPENAI_API_KEY`）
4. 点击部署

**详细部署步骤：**

#### 步骤 1：在 Vercel 导入项目

1. 访问 [Vercel 控制台](https://vercel.com/dashboard)
2. 点击 **"Add New..."** → **"Project"**
3. 选择你的 GitHub 仓库并点击 **"Import"**

#### 步骤 2：配置环境变量（重要）

在 "Configure Project" 页面添加以下环境变量：

| 变量名 | 必填 | 说明 | 示例值 |
|--------|------|------|--------|
| `OPENAI_API_KEY` | ✅ | OpenAI API 密钥 | `sk-xxxxxxxxxxxxxxxx` |
| `OPENAI_BASE_URL` | ❌ | API 基础地址 | `https://api.openai.com/v1` |
| `OPENAI_MODEL` | ❌ | 使用的模型 | `gpt-3.5-turbo` |

> **提示**：环境变量优先级高于前端设置，建议在 Vercel 中配置以保护密钥安全。

#### 步骤 3：开始部署

点击 **"Deploy"** 按钮，等待 1-3 分钟即可完成部署。

## 🔧 环境变量配置

### 使用 OpenAI 官方 API

```env
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-3.5-turbo
```

### 使用 DeepSeek API

```env
OPENAI_API_KEY=your-deepseek-api-key
OPENAI_BASE_URL=https://api.deepseek.com/v1
OPENAI_MODEL=deepseek-chat
```

### 使用其他兼容服务

大多数兼容 OpenAI API 格式的服务都可以使用，只需修改 `OPENAI_BASE_URL` 即可。

详细配置说明请参考 [.env.example](./.env.example) 文件。

## 📚 技术栈

- **框架**: Next.js 14+ (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **UI 组件**: Radix UI
- **动画**: Framer Motion
- **AI**: OpenAI API (兼容格式)

## 📖 使用说明

1. 在首页输入你想要占卜的问题
2. 随机输入两个数字（或使用随机生成）
3. 点击"起卦"按钮
4. 查看卦象和 AI 解析结果

## 🔍 常见问题

### Q1: 部署后提示 "API Key is missing"？

**解决方案**：
1. 检查 Vercel 控制台中的环境变量是否正确填写
2. 确保 `OPENAI_API_KEY` 变量名拼写正确（区分大小写）
3. 修改环境变量后，需要重新部署（Redeploy）才能生效

### Q2: 如何使用前端设置功能？

项目支持两种配置方式：

1. **环境变量配置**（推荐）：在 Vercel 或 `.env.local` 中配置
2. **前端设置**（备用）：点击页面右上角的设置图标手动输入

**优先级**：环境变量 > 前端设置

### Q3: 支持哪些 AI 模型？

项目支持所有兼容 OpenAI API 格式的服务，包括：

- OpenAI：`gpt-3.5-turbo`、`gpt-4`、`gpt-4-turbo`
- DeepSeek：`deepseek-chat`
- 通义千问、文心一言等（需要使用兼容层）

### Q4: 如何更新已部署项目的环境变量？

1. 进入 Vercel 项目控制台
2. 点击 **"Settings"** → **"Environment Variables"**
3. 修改或添加环境变量并保存
4. 前往 **"Deployments"** 页面，重新部署最新版本

## ⚡ 常用命令

```bash
# 开发
npm run dev          # 启动开发服务器

# 构建
npm run build        # 构建生产版本
npm start            # 运行生产版本

# 检查
npm run check-env    # 检查环境变量配置
npm run lint         # 代码检查
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

---

**注意**：本项目仅供娱乐和学习交流使用，请勿过度迷信。
