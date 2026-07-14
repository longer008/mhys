# 梅花易数 AI 解读

基于 Next.js 16、PostgreSQL 与 OpenAI 兼容接口构建，面向 Vercel Hobby
部署。项目提供三种起卦方式、AI 解读、本地历史记录和管理员后台。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Flink0518%2Fmhys&env=OPENAI_API_KEY,OPENAI_BASE_URL,OPENAI_MODEL,DATABASE_URL,ANONYMOUS_SESSION_SECRET,ADMIN_PASSWORD,ADMIN_SESSION_SECRET&envDescription=%E9%83%A8%E7%BD%B2%E5%89%8D%E8%AF%B7%E5%85%88%E5%AE%8C%E6%88%90%E6%95%B0%E6%8D%AE%E5%BA%93%E8%BF%81%E7%A7%BB%EF%BC%8C%E4%B8%A4%E4%B8%AA%20Session%20Secret%20%E5%BF%85%E9%A1%BB%E4%B8%8D%E5%90%8C&envLink=https%3A%2F%2Fgithub.com%2Flink0518%2Fmhys%23vercel-%E4%B8%80%E9%94%AE%E9%83%A8%E7%BD%B2&project-name=meihua-yishu&repository-name=meihua-yishu)

## 功能

- 手动、随机、时间三种起卦方式
- 服务端计算卦象并构造固定提示词
- 默认使用站点配置的 OpenAI 兼容服务
- 用户可在前台设置自己的 OpenAI 兼容 API
- 自定义 API 地址、API Key、模型仅保存在当前浏览器
- 前台历史记录仅保存在当前浏览器，最多 50 条
- 数据库记录仅管理员后台可查看
- AI 用户、IP、全局限流与请求幂等
- 管理员登录、统计面板、记录查询与删除

## 数据边界

```text
浏览器
├─ 起卦参数 ────────────────> /api/interpret
├─ 自定义 API 配置 ─────────> 仅随单次请求临时传输
├─ 前台历史 ────────────────> localStorage
└─ 管理后台 ────────────────> /api/admin/*

服务端
├─ 重新计算卦象 / 限流 / 幂等
├─ 调用默认或用户自定义 OpenAI 兼容接口
└─ 保存问题、卦象和解读结果供管理员审计
```

数据库不会保存用户自定义 API 的地址、API Key 或模型名称。自定义 API 地址必须
使用标准 HTTPS，且不能指向本机、内网或保留地址。

## 技术要求

- Node.js 22.x
- npm
- PostgreSQL
- 支持 `POST /chat/completions` 的 OpenAI 兼容服务

## 本地开发

```powershell
npm ci
Copy-Item ".env.example" ".env.local"
npm run dev
```

执行迁移前，需要在当前终端设置 `DIRECT_DATABASE_URL`。Windows PowerShell
示例：

```powershell
$env:DIRECT_DATABASE_URL="postgresql://..."
npm run db:migrate
Remove-Item Env:DIRECT_DATABASE_URL
```

迁移会修改目标数据库结构，请先确认连接指向正确的数据库。

## 环境变量

### 必填

| 变量 | 说明 |
| --- | --- |
| `OPENAI_API_KEY` | 站点默认 AI 服务的 API Key |
| `OPENAI_BASE_URL` | OpenAI 兼容 API 地址，例如 `https://api.deepseek.com` |
| `OPENAI_MODEL` | 默认模型名称 |
| `DATABASE_URL` | 应用运行时 PostgreSQL 连接 |
| `ANONYMOUS_SESSION_SECRET` | 匿名会话签名密钥，至少 32 字符 |
| `ADMIN_PASSWORD` | 后台管理员密码，至少 7 个字符 |
| `ADMIN_SESSION_SECRET` | 管理员会话签名密钥，至少 32 字符 |

`ANONYMOUS_SESSION_SECRET` 和 `ADMIN_SESSION_SECRET` 必须使用两个不同的随机值。

### 仅迁移使用

| 变量 | 说明 |
| --- | --- |
| `DIRECT_DATABASE_URL` | Session Pooler 或 Direct Connection，不要暴露给前端 |

### 可选

| 变量 | 默认值 |
| --- | --- |
| `SITE_TITLE` | `梅花易数` |
| `AI_USER_LIMIT_PER_10_MINUTES` | `5` |
| `AI_USER_DAILY_LIMIT` | `20` |
| `AI_IP_LIMIT_PER_10_MINUTES` | `20` |
| `AI_GLOBAL_DAILY_LIMIT` | `500` |

## Supabase 连接说明

- 现有 Session Pooler `5432` 可以继续作为 `DATABASE_URL` 使用。
- Vercel 高并发场景更推荐 Transaction Pooler `6543`。
- 项目已关闭预处理语句，并将单实例数据库连接数限制为 1。
- `DIRECT_DATABASE_URL` 只用于执行迁移，不需要配置到 Vercel。

## Vercel 一键部署

点击顶部的 **Deploy with Vercel** 按钮后：

1. Vercel 会克隆当前 GitHub 仓库并创建项目。
2. 按页面提示填写七个必填环境变量。
3. 保持框架为 Next.js、Node.js 为 22.x。
4. 点击部署，构建命令会自动使用 `npm ci` 和 `npm run build`。

数据库迁移不会在 Vercel 构建期间自动执行。首次部署前，必须先在本地或受控 CI
环境运行一次 `npm run db:migrate`。这是为了避免多个 Vercel 构建并发修改数据库。

如果项目已经关联 GitHub，向生产分支（通常是 `main`）推送代码后，Vercel 会
自动构建并发布新版本。环境变量更新后也需要重新部署才会生效。

## 上线前检查

```powershell
npm run check-env
npm run verify
```

验收清单：

- 首页可完成起卦和 AI 解读
- 默认 AI 与用户自定义 OpenAI 兼容 API 均可调用
- 自定义 API 配置只存在当前浏览器，数据库中不包含这些字段
- 前台历史可查看、删除和清空，清除浏览器数据后不会恢复
- 未登录访问后台业务接口返回 `401`
- 管理员可以查看统计、分页检索和删除记录
- AI 超时、上游失败和额度耗尽返回可理解的错误
- GitHub 推送可触发 Vercel 自动部署

## 常用命令

```powershell
npm run dev
npm run check-env
npm run test:run
npm run type-check
npm run lint
npm run build
npm run verify
npm run db:migrate
```

## 隐私说明

- 用户问题会发送给所选 AI 服务，并将问题、卦象与解读结果保存到数据库供管理员
  审计。
- 前台历史副本与用户自定义 API 配置保存在浏览器 `localStorage`。
- 用户自定义 API 配置不会写入数据库或应用日志。
- 自定义 API Key 会随单次解读请求传输到本应用服务端，用于代理调用对应服务，
  请求结束后不持久化。

本项目提供传统文化学习与娱乐解读，不替代医疗、法律、投资或人身安全方面的
专业意见。
