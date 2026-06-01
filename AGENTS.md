# 版本控制规则

## 核心原则

每次对项目代码进行修改后，**必须**执行以下两个步骤：
1. 更新项目版本号
2. 将变更内容记录到更新公告（CHANGELOG）中

---

## 版本管理文件

- **版本定义文件**: `src/version.ts`
  - 包含当前版本号 `CURRENT_VERSION`
  - 包含更新日志数组 `CHANGELOG`
  - 包含版本信息接口 `VersionInfo`

- **包管理文件**: `package.json`
  - 包含 `version` 字段，需与 `src/version.ts` 保持同步

- **版本更新脚本**: `scripts/update-version.js`
  - 自动化版本号升级和 CHANGELOG 更新
  - 支持三种版本类型：major、minor、patch

- **更新公告组件**: `src/components/UpdateLog.tsx`
  - 用于在 UI 中展示版本更新历史

---

## 版本号规范

采用 [语义化版本](https://semver.org/lang/zh-CN/) 格式：`MAJOR.MINOR.PATCH`

### 版本升级策略

| 类型 | 格式 | 使用场景 | 触发方式 |
|------|------|----------|----------|
| **major** | x.0.0 | 不兼容的重大改动、架构重构、核心功能重写 | `--major` |
| **minor** | x.y.0 | 向下兼容的新功能、重要模块添加 | `--minor` |
| **patch** | x.y.z | 向下兼容的问题修复、小优化、bug修复 | 默认/`--patch` |

### 判断标准

#### 必须升级 major 版本：
- 重构核心架构或数据结构
- 移除或改变现有 API 接口
- 数据库结构变更
- 技术栈重大更换

#### 应该升级 minor 版本：
- 新增独立功能模块
- 添加新的页面或组件
- 增加重要的业务逻辑
- 新增配置项或选项

#### 升级 patch 版本：
- 修复已知 bug
- UI/UX 小优化
- 性能微调
- 文档或注释更新
- 代码重构但不影响功能

---

## 操作流程

### 方式一：使用自动化脚本（推荐）

```bash
# 补丁版本（默认）
node scripts/update-version.js "修复了登录页面的验证问题"

# 次版本
node scripts/update-version.js --minor "新增用户权限管理系统"

# 主版本
node scripts/update-version.js --major "重构整个认证系统为 OAuth2.0"
```

脚本会自动：
1. ✅ 读取当前版本号
2. ✅ 根据类型递增版本号
3. ✅ 更新 `src/version.ts` 中的 `CURRENT_VERSION`
4. ✅ 在 `CHANGELOG` 数组头部添加新条目
5. ✅ 同步更新 `package.json` 的 version 字段

### 方式二：手动更新

如果需要手动更新，必须同时修改以下位置：

#### 1. 更新 `src/version.ts`

```typescript
// 修改 CURRENT_VERSION
export const CURRENT_VERSION = '0.3.0';  // ← 更新这里

// 在 CHANGELOG 数组最前面添加新条目
export const CHANGELOG: VersionInfo[] = [
  {
    version: '0.3.0',           // ← 新版本号
    date: '2026-06-01',         // ← 今天日期 (YYYY-MM-DD)
    type: 'minor',              // ← 版本类型
    changes: [
      '✨ 具体的变更描述1',
      '🐛 具体的变更描述2',
      '⚡ 具体的变更描述3'
    ]
  },
  // ... 保留旧的 changelog 条目
];
```

#### 2. 更新 `package.json`

```json
{
  "version": "0.3.0"  // ← 必须与 version.ts 一致
}
```

---

## 变更描述规范

### 描述格式要求

每条变更记录应遵循以下格式：

```
[emoji] [简短明确的描述]
```

### 推荐使用的 emoji 前缀

| 类型 | Emoji | 含义 |
|------|-------|------|
| 新功能 | ✨ | 新增功能或特性 |
| 修复 | 🐛 | 修复 bug |
| 优化 | ⚡ | 性能优化 |
| 重构 | 🔧 | 代码重构 |
| 样式 | 🎨 | UI/UX 改进 |
| 文档 | 📝 | 文档更新 |
| 删除 | ❌ | 移除功能或代码 |
| 安全 | 🔒 | 安全相关更新 |
| 测试 | ✅ | 测试相关 |

### 描述撰写原则

✅ **好的描述示例**：
- `"✨ 新增用户头像上传功能"`
- `"🐛 修复购物车数量计算错误"`
- `"⚡ 优化首页加载速度，提升 30%"`
- `"🎨 重新设计设置页面布局"`

❌ **不好的描述示例**：
- `"修bug"` （太模糊）
- `"改了一些东西"` （不明确）
- `"update"` （无实际意义）
- `"fix issue #123"` （应补充具体内容）

---

## 强制检查清单

在完成任何代码修改后，提交前**必须**确认：

- [ ] 已判断本次修改的版本升级类型（major/minor/patch）
- [ ] 已使用脚本或手动更新 `src/version.ts` 的 `CURRENT_VERSION`
- [ ] 已在 `CHANGELOG` 添加新的变更记录，包含：
  - [ ] 正确的版本号
  - [ ] 今天的日期（YYYY-MM-DD 格式）
  - [ ] 正确的版本类型
  - [ ] 清晰的变更描述列表
- [ ] 已同步更新 `package.json` 的 version 字段
- [ ] 版本号在两个文件中保持一致

---

## 示例场景

### 场景 1：修复一个小 bug

**操作**：
```bash
node scripts/update-version.js "🐛 修复英雄属性显示错误的bug"
```

**结果**：版本从 `0.2.0` → `0.2.1`

### 场景 2：新增市场交易功能

**操作**：
```bash
node scripts/update-version.js --minor "✨ 新增市场交易系统，支持资源买卖"
```

**结果**：版本从 `0.2.0` → `0.3.0`

### 场景 3：重构整个战斗系统

**操作**：
```bash
node scripts/update-version.js --major "⚔️ 重构战斗系统为实时战斗模式"
```

**结果**：版本从 `0.2.0` → `1.0.0`

---

## 注意事项

1. **不要跳过版本号**：即使是很小的改动也必须更新版本号
2. **保持一致性**：`version.ts` 和 `package.json` 的版本号必须始终一致
3. **及时记录**：修改代码后立即更新版本，不要积累多个改动后再一次性更新
4. **描述准确**：CHANGELOG 是给用户看的，要清晰易懂
5. **日期正确**：使用当天日期，不要使用未来或过去的日期
6. **单一职责**：每次版本更新应该对应一次具体的代码修改任务

---

## 违规处理

如果发现以下情况，必须立即修正：
- 代码已修改但版本号未更新
- CHANGELOG 缺少本次修改的记录
- `version.ts` 和 `package.json` 版本号不一致
- 变更描述模糊或不完整
