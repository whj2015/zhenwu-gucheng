# Cloudflare Pages 部署配置指南

## 📋 当前状态

✅ 代码已推送到分支: `trae/solo-agent-rsdqh4`
✅ PR 描述已准备: [PR_DESCRIPTION.md](../PR_DESCRIPTION.md)
✅ GitHub Actions 自动部署已配置: [.github/workflows/deploy.yml](.github/workflows/deploy.yml)

## 🔧 部署方案总览

### 方案 1：PR 合并后自动部署（推荐）⭐

**工作流程**：
1. 创建 PR → `trae/solo-agent-rsdqh4` → `main`
2. 代码审查通过
3. 合并 PR 到 main
4. GitHub Actions 自动触发部署到 Cloudflare Pages

**优点**：
- ✅ 完全自动化
- ✅ 有代码审查环节
- ✅ 部署历史清晰

**设置步骤**：

#### 步骤 1：创建 PR
在 GitHub 上创建 Pull Request：
- **Base branch**: `main`
- **Compare branch**: `trae/solo-agent-rsdqh4`
- **Title**: `feat: React 最佳实践代码优化`
- **Body**: 复制 [PR_DESCRIPTION.md](../PR_DESCRIPTION.md) 的内容

#### 步骤 2：配置 Cloudflare Secrets
在 GitHub 仓库中添加 Secrets：

1. 进入 GitHub 仓库 → Settings → Secrets and variables → Actions
2. 添加以下 secrets：

**CLOUDFLARE_API_TOKEN**:
```bash
# 在 Cloudflare Dashboard 获取
# 路径: My Profile → API Tokens → Create Token
# 选择模板: "Edit Cloudflare Workers" 或 "Custom"
```

**CLOUDFLARE_ACCOUNT_ID**:
```bash
# 在 Cloudflare Dashboard 右侧栏查看
# 或访问: https://dash.cloudflare.com/?account=YOUR_ACCOUNT_ID
```

#### 步骤 3：合并 PR 触发部署
- 审查并合并 PR 到 main 分支
- GitHub Actions 会自动执行部署

---

### 方案 2：直接从当前分支部署（快速）

如果需要立即测试，可以直接从当前分支部署：

#### 方法 A：使用 Wrangler CLI

```bash
# 安装 wrangler（如未安装）
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 构建项目
npm run build

# 部署到 Cloudflare Pages
wrangler pages deploy dist --project-name=zhenwu-gucheng
```

#### 方法 B：使用 Cloudflare Dashboard 手动部署

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 **Workers & Pages**
3. 点击 **Create application** → **Pages** → **Connect to Git**
4. 选择您的 GitHub 仓库
5. 配置构建设置：
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (或留空)
6. 在 **Settings** 中更改部署分支为 `trae/solo-agent-rsdqh4`（可选）
7. 点击 **Save and Deploy**

---

### 方案 3：配置 CF 使用其他分支作为生产环境

如果您希望长期使用非 main 分支进行开发/部署：

#### 通过 Cloudflare Dashboard 配置

1. 进入您的 Pages 项目
2. 点击 **Settings** → **Builds & deployments**
3. 找到 **Build configuration** 部分
4. 编辑 **Production branch** 设置：
   - 从 `main` 改为 `trae/solo-agent-rsdqh4`
   - 或设置为 `production` / `develop` 等自定义分支

#### 通过 API 配置

```bash
curl -X PATCH "https://api.cloudflare.com/client/v4/accounts/{account_id}/pages/projects/{project_name}" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  --data '{
    "build_config": {
      "production_branch": "trae/solo-agent-rsdqh4"
    }
  }'
```

---

## ⚙️ 自动部署详细配置

### GitHub Actions 工作流说明

已为您创建的 `.github/workflows/deploy.yml` 文件包含以下功能：

#### 触发条件：
- ✅ 推送到 `main` 分支时自动部署
- ✅ PR 合并到 `main` 时自动部署
- ❌ PR 创建/更新时不部署（节省资源）

#### 部署流程：
1. 检出代码
2. 安装 Node.js 20
3. 缓存 npm 依赖（加速构建）
4. 执行 `npm ci`（干净安装）
5. 执行 `npm run build`（构建项目）
6. 使用 Wrangler 部署到 Cloudflare Pages

#### 环境变量需求：
- `CLOUDFLARE_API_TOKEN`: Cloudflare API Token
- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare Account ID

---

## 🚀 快速开始检查清单

- [ ] 代码已推送到远程分支 ✅
- [ ] PR 已创建（使用 PR_DESCRIPTION.md 内容）
- [ ] Cloudflare Secrets 已配置
- [ ] GitHub Actions 工作流已启用
- [ ] PR 已合并到 main
- [ ] 部署成功完成

---

## 🔍 故障排除

### 常见问题

**Q1: 部署失败 - API Token 无效**
```bash
# 解决方案：
# 1. 检查 token 权限是否包含 "Cloudflare Pages: Edit"
# 2. 确认 token 未过期
# 3. 重新生成 token 并更新 GitHub Secret
```

**Q2: 构建失败 - TypeScript 错误**
```bash
# 解决方案：
# 本地运行 npm run lint 检查错误
# 确保 tsconfig.json 配置正确
# 检查 @types/react 和 @types/react-dom 是否安装
```

**Q3: 部署缓慢**
```bash
# 优化建议：
# 启用 npm 缓存（已在 workflow 中配置）
# 使用 Docker 层缓存
# 减少依赖包数量
```

**Q4: 分支权限问题**
```bash
# 解决方案：
# 检查 GitHub 仓库的分支保护规则
# 确保有写入 main 分支的权限
# 或联系仓库管理员
```

---

## 📚 相关文档

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [React 最佳实践](https://react.dev/learn/thinking-in-react)

---

## 💡 最佳实践建议

1. **使用 PR 进行所有变更** - 不要直接推送到 main
2. **启用分支保护规则** - 要求 CI 通过才能合并
3. **定期更新依赖** - 保持安全性
4. **监控部署日志** - 及时发现问题
5. **使用预览部署** - 在合并前预览效果

---

最后更新: 2026-05-30
