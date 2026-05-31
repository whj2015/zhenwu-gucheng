<div align="center">

# ⚔️ 镇武孤城 (Zhenwu Lone City)

**架空历史高武世界模拟经营与放置挂机游戏**

[![Version](https://img.shields.io/badge/version-0.2.0-blue.svg)](./src/version.ts)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![License](https://img.shields.io/badge/license-Apache--2.0-green.svg)](./LICENSE)

[功能介绍](#-核心功能) · [快速开始](#-快速开始) · [游戏系统](#-游戏系统) · [开发指南](#-开发指南) · [部署指南](#-部署指南)

</div>

---

## 📖 项目简介

**镇武孤城** 是一款以架空历史为背景的高武世界模拟经营与放置挂机网页游戏。玩家将扮演一座边陲孤城的城主，通过：

- 🏰 **经营管理** - 建设城市设施，发展经济与军事
- ⚔️ **战术战斗** - 招募英雄，布阵迎敌，体验战棋式回合制战斗
- 📋 **任务系统** - 完成每日/每周任务，获取丰厚奖励
- 🔨 **装备锻造** - 打造神兵利器，提升英雄战力

在这个充满挑战的世界中，逐步壮大势力，探索前朝遗迹，最终成为一代霸主！

### ✨ 核心特色

- 🎮 **完整的游戏循环** - 资源生产 → 建筑升级 → 英雄培养 → 战斗探险 → 奖励回收
- 🧠 **策略深度** - 9宫格布阵系统、英雄技能搭配、属性相克机制
- ⏱️ **离线收益** - 支持离线挂机，上线即可领取资源
- 💾 **数据持久化** - localStorage 自动存档，游戏进度永不丢失
- 🎨 **精美UI** - 现代化暗色主题设计，流畅的动画交互
- 📱 **响应式布局** - 完美适配桌面端和移动端设备

---

## 🚀 快速开始

### 环境要求

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0 (或 pnpm/yarn)
- 现代浏览器 (Chrome/Firefox/Safari/Edge 最新版本)

### 安装步骤

```bash
# 1. 克隆项目
git clone <repository-url>
cd zhenwu-lone-city

# 2. 安装依赖
npm install

# 3. 配置环境变量（可选）
cp .env.example .env.local
# 编辑 .env.local 并填入你的 Gemini API Key（如需AI功能）

# 4. 启动开发服务器
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 即可开始游戏！

### 可用脚本

```bash
# 开发模式（热重载）
npm run dev

# 类型检查
npm run lint

# 构建生产版本
npm run build

# 预览构建结果
npm run preview

# 清理构建文件
npm run clean

# 部署到 Cloudflare Workers
npm run deploy
```

---

## 🎮 核心功能

### 🏰 城市建筑系统

| 建筑 | 功能 | 可升级 |
|------|------|--------|
| 🏠 **民居** | 提供人口上限 | ✅ Lv.1-10 |
| 🌾 **农田** | 自动产出粮草 | ✅ Lv.1-10 |
| 🪵 **伐木场** | 自动产出木材 | ✅ Lv.1-10 |
| 🏥 **医馆** | 治疗/救治伤兵，提升治疗效果 | ✅ Lv.1-10 |
| 🏪 **集市** | 资源交易，解锁新路线 | ✅ Lv.1-5 |
| 🔨 **兵甲坊** | 锻造武器/护甲，提升品质概率 | ✅ Lv.1-5 |
| 📦 **库房** | 提升资源存储上限和物品栏位 | ✅ Lv.1-10 |

### 🦸 英雄系统

#### 英雄招募
- **酒馆系统**: 每3位英雄为一组，可花费兵饷刷新
- **品质分级**: 将才 / 良才 / 常才
- **属性体系**:
  - `武力` (Force) - 影响攻击力
  - `体魄` (Physique) - 影响生命值
  - `轻功` (Agility) - 影响闪避/暴击
  - `统帅` (Command) - 影响带兵数/减伤

#### 英雄定位
```typescript
type HeroTrait = 'assault' | 'flank' | 'tank' | 'support' | 'ranged';
```

- **⚔️ assault (突击)** - 正面强攻，适合前排输出
- **🗡️ flank (游击)** - 可切后排直取要害
- **🛡️ tank (坦克)** - 吸引敌火，提供减伤
- **💚 support (辅助)** - 回血治疗，团队续航
- **🏹 ranged (远程)** - 远程攻击，安全输出

#### 技能系统
每个英雄拥有独特技能：
- **被动增益**: 伤害减免、先手加成、额外行动
- **位置效果**: 特定阵位触发强化效果
- **AOE伤害**: 溅射、追击等范围攻击

### ⚔️ 战术战斗系统

#### 战棋布阵
采用 **3×3 九宫格阵型**:

```
┌─────────┬─────────┬─────────┐
│ 前排左   │ 前排中   │ 前排右   │  ← front row
├─────────┼─────────┼─────────┤
│ 中排左   │ 中排中   │ 中排右   │  ← middle row
├─────────┼─────────┼─────────┤
│ 后排左   │ 后排中   │ 后排右   │  ← back row
└─────────┴─────────┴─────────┘
```

**布阵规则**:
- 最多部署 **3-6 名英雄** (根据仓库等级)
- 不同位置提供不同加成
- 坦克适合前排，辅助/远程适合后排
- 游击可绕过前排攻击后排

#### 回合制战斗
1. **玩家回合**: 选择单位 → 选择目标 → 执行攻击
2. **敌方回合**: AI自动反击
3. **特殊机制**:
   - 先手攻击加成 (flank/ranged trait)
   - 兵卒减伤 (每兵卒减伤1.5%，最高70%)
   - 伤兵系统 (部分兵力转为伤兵，可救治)
   - 英雄技能触发

#### 战斗结算
- ✅ **胜利**: 获得经验、资源、装备材料
- ❌ **失败**: 英雄受伤但不会死亡，伤兵增加
- 📊 **详细统计**: 伤害面板、击杀记录、资源收获

### 🗺️ 探险系统

#### 关卡列表
| 关卡名称 | 类型 | 推荐等级 | 层数 | 主要掉落 |
|----------|------|----------|------|----------|
| **黑风山寨** | 讨伐 | Lv.1 | 1层 | 兵饷、铁锭 |
| **遗弃铁矿** | 探索 | Lv.1 | 3层 | 大量铁锭、陨铁 |
| **前朝密库** | 探索 | Lv.3 | 5层 | 陨铁、稀有材料 |
| **前朝旧都** | 探索 | Lv.5 | 7层 | 神器材料、传说装备 |

#### 战争迷雾
- 采用 **Fog of War** 机制
- 只能看见已探索节点和相邻节点
- 节点类型:
  - ⚔️ **战斗节点** - 普通敌人
  - 💀 **BOSS节点** - 强敌首领
  - 🛡️ **军械库** - 获取铁锭/陨铁
  - ⛺ **营地** - 全体回血

### 🔨 锻造系统

#### 锻造配方
| 装备 | 类型 | 消耗 | 时间 | 品质等级 |
|------|------|------|------|----------|
| **长剑** | 武器 | 兵饷×100 + 铁×20 | 30s | normal/fine/epic |
| **重甲** | 护甲 | 兵饷×150 + 铁×40 | 60s | normal/fine/epic |
| **陌刀** | 武器 | 兵饷×300 + 铁×80 | 120s | fine/epic |

#### 品质机制
- **普通 (normal)** - 基础属性
- **精良 (fine)** - 属性×1.2 (连续4次普通后必出)
- **史诗 (epic)** - 属性×1.5 (连续9次精良后必出或5%概率)
- 连续锻造计数会在获得高品质后重置

### 📋 任务系统

#### 任务类型
| 类型 | 说明 | 示例 |
|------|------|------|
| **resource** | 达到指定资源数量 | 拥有5000兵饷 |
| **explore** | 完成探险次数 | 完成3次探险 |
| **craft** | 锻造装备次数 | 锻造5件装备 |
| **recruit** | 招募兵卒数量 | 招募200兵卒 |
| **boss_kill** | 击杀BOSS次数 | 击杀2次BOSS |
| **deep_explore** | 深层探索 | 完成5层关卡 |

#### 任务循环
- **每日任务** (Daily): 每天 00:00 重置，6个任务
- **每周任务** (Weekly): 每周一重置，3个任务
- **难度分级**: 简易(⭐) / 困难(⭐⭐) / 极难(⭐⭐⭐)
- **自动接取**: 非"资源类"任务自动接受

---

## 💰 资源系统

### 六大基础资源

| 资源 | 图标 | 用途 | 获取方式 |
|------|------|------|----------|
| **兵饷** (Bingxiang) | 💰 | 通用货币 | 人口产出、任务奖励、售卖资源 |
| **铁锭** (Iron) | ⚙️ | 锻造、升级 | 仓库产出、探险掉落、市场购买 |
| **陨铁** (Meteorite) | ☄️ | 升级铁匠铺 | 探险深层掉落、市场购买 |
| **粮草** (Food) | 🌾 | 治疗募兵 | 农田产出、市场购买 |
| **木材** (Wood) | 🪵 | 建筑升级 | 伐木场产出、市场购买 |
| **人口** (Population) | 👥 | 影响兵饷产出 | 民居自然增长 |

### 经济循环
```
人口增长 → 兵饷产出 → 招募英雄/锻造 → 提升战力 → 探险 → 资源回报 → 建筑升级 → 循环↑
```

---

## 🏗️ 技术架构

### 技术栈

| 类别 | 技术 | 版本 | 用途 |
|------|------|------|------|
| **框架** | React | 19.x | UI渲染 |
| **语言** | TypeScript | 5.8 | 类型安全 |
| **构建** | Vite | 6.x | 开发/打包工具 |
| **状态管理** | Zustand | 5.x | 全局状态+持久化 |
| **样式** | Tailwind CSS | 4.x | 原子化CSS |
| **图标** | Lucide React | 0.546 | SVG图标库 |
| **动画** | Motion | 12.x | 动画效果 |
| **部署** | Cloudflare Workers | - | 边缘计算托管 |
| **AI** | Google GenAI | 2.4 | Gemini API集成 |

### 项目结构

```
zhenwu-lone-city/
├── src/
│   ├── components/          # React 组件
│   │   ├── gate/           # 城门/探险子系统
│   │   │   ├── BoardView.tsx        # 任务看板
│   │   │   ├── MapExploreView.tsx   # 地图探索(Fog of War)
│   │   │   ├── MissionSelectionView.tsx  # 任务选择
│   │   │   ├── SetupView.tsx        # 战斗布阵(九宫格)
│   │   │   ├── NodeButton.tsx       # 地图节点按钮
│   │   │   └── ResultView.tsx       # 结算界面
│   │   ├── heroes/         # 英雄子系统
│   │   │   ├── HeroDetail.tsx       # 英雄详情
│   │   │   ├── TavernView.tsx       # 酒馆招募
│   │   │   ├── ResidenceView.tsx    # 英雄居所
│   │   │   ├── EquipSlot.tsx        # 装备槽位
│   │   │   └── StatBox.tsx          # 属性显示
│   │   ├── MainUI.tsx              # 主界面框架
│   │   ├── CityPanel.tsx            # 主城面板
│   │   ├── ForgePanel.tsx           # 铁匠铺
│   │   ├── HeroesPanel.tsx          # 英雄管理
│   │   ├── GatePanel.tsx            # 城门入口
│   │   ├── BarracksPanel.tsx        # 募兵营
│   │   ├── HospitalPanel.tsx        # 医院
│   │   ├── MarketPanel.tsx          # 市场
│   │   ├── WarehousePanel.tsx       # 仓库
│   │   ├── BattleResultPanel.tsx    # 战斗结果
│   │   └── UpdateLog.tsx            # 更新日志
│   │
│   ├── data/               # 游戏数据配置
│   │   ├── heroes.json     # 英雄模板 (12位英雄)
│   │   ├── enemies.json    # 敌人模板
│   │   ├── missions.json   # 关卡定义 (4个关卡)
│   │   ├── crafting.json   # 锻造配方
│   │   ├── quests.json     # 任务模板
│   │   ├── positions.json  # 阵位配置
│   │   └── index.ts        # 数据导出+类型定义
│   │
│   ├── engine/             # 游戏引擎
│   │   └── ruins.ts        # 废墟探险引擎+战术战斗逻辑
│   │
│   ├── utils/              # 工具函数
│   │   ├── questEngine.ts  # 任务引擎(追踪/验证/生成)
│   │   ├── utils.ts        # 通用工具(CN合并等)
│   │   └── ts              # 类型声明
│   │
│   ├── store.ts            # Zustand全局状态管理
│   ├── types.ts            # TypeScript类型定义
│   ├── App.tsx             # 应用根组件
│   ├── main.tsx            # 入口文件
│   ├── index.css           # 全局样式
│   └── version.ts          # 版本管理
│
├── public/                 # 静态资源
├── scripts/                # 工具脚本
│   └── update-version.js   # 版本号更新工具
├── dogfood-output/         # 测试截图(可选)
│   ├── screenshots/        # UI截图
│   └── report.md           # 测试报告
├── index.html              # HTML模板
├── package.json            # 项目配置
├── tsconfig.json           # TypeScript配置
├── vite.config.ts          # Vite配置
├── wrangler.jsonc          # Cloudflare Workers配置
├── metadata.json           # 应用元数据
└── README.md               # 项目文档
```

### 数据流架构

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   React UI  │────▶│  Zustand Store│◀────│  Game Engine│
│  (Components)│     │  (State Mgmt)│     │ (ruins.ts)  │
└─────────────┘     └──────┬───────┘     └─────────────┘
                           │
                    ┌──────▼───────┐
                    │ localStorage │
                    │ (Persistence)│
                    └──────────────┘
```

**状态管理设计**:
- 使用 **Zustand** 进行集中式状态管理
- 通过 **persist中间件** 自动持久化到 localStorage
- **防抖写入** (1秒延迟) 避免频繁IO操作
- 支持 **选择性订阅** 优化性能 (避免不必要的重渲染)

### 核心类型系统

```typescript
// 游戏主状态
interface GameState {
  resources: ResourceState;      // 资源状态
  buildings: BuildingState;      // 建筑等级
  crafting: CraftingState;       // 锻造状态
  heroes: HeroState[];           // 英雄列表
  inventory: Equipment[];        // 装备背包
  ruinsRun: RuinsRun | null;     // 当前探险
  tavernPool: string[];          // 酒馆候选
  questState: QuestState;        // 任务状态
}

// 英雄状态
interface HeroState {
  id: string;
  templateId: string;            // 引用英雄模板
  level: number;
  exp: number;
  troops: number;                // 当前兵卒
  wounded: number;                // 伤兵数量
  hp: number;                     // 当前生命值
  equipment: {
    weapon: Equipment | null;
    armor: Equipment | null;
  };
}
```

---

## 🎯 游戏玩法指南

### 新手入门流程

#### 第1阶段：基础建设 (0-30分钟)
1. 🏠 **升级民居** → 提升人口上限 → 增加兵饷产出
2. 🌾 **升级农田** → 确保粮草供应
3. 🪵 **升级伐木场** → 获取木材用于建筑升级
4. 🏪 **开启集市** → 解锁资源交易功能

#### 第2阶段：招兵买马 (30分钟-2小时)
1. 🍺 **前往酒馆** → 查看可用英雄 → 招募第一位英雄
2. ⚔️ **推荐首抽**: 
   - **铁山** (tank) - 高体魄，前期抗伤害
   - **柳一刀** (flank) - 高武力，输出稳定
3. 🏹 **前往募兵营** → 为英雄招募兵卒 (建议50-100人)
4. 🔨 **建造兵甲坊** → 开始锻造基础装备

#### 第3阶段：初次探险 (2小时+)
1. 🚪 **打开城门** → 选择 **黑风山寨** (Lv.1推荐)
2. ⚔️ **布阵建议**:
   ```
   前排: [铁山] [空] [空]      ← 坦克扛伤
   中排: [空] [柳一刀] [空]    ← 主力输出
   后排: [空] [空] [空]        ← 预留辅助位
   ```
3. ⚔️ **战斗技巧**:
   - 点击己方单位 → 点击敌方目标 → 发动攻击
   - 优先击杀低血量敌人
   - 注意观察英雄技能触发
4. 🎁 **战后处理**:
   - 查看战斗统计
   - 返回医院治疗伤兵
   - 继续探险或返回主城

#### 第4阶段：长期发展
- 📈 **日常循环**: 领取任务 → 探险 → 锻造 → 升级建筑
- 🔄 **挂机收益**: 关闭浏览器后再次登录可领取离线收益 (最多12小时)
- 📋 **任务优先级**: 
  1. 先完成简单任务获取快速奖励
  2. 积累资源后挑战困难任务
  3. 每周任务奖励更丰厚，不要错过

### 进阶技巧

#### 💡 资源优化
- **粮草紧张?** → 升级农田或从集市购买
- **铁锭不足?** → 多刷铁矿副本或升级仓库
- **兵饷短缺?** → 卖出多余木材/粮草

#### ⚔️ 战斗策略
- **坦克前排**: 让铁山等高体魄英雄承受伤害
- **输出保护**: 把主力放在中后排避免被集火
- **技能配合**: 
  - 桓娘(support)放后排持续回血
  - 柳一刀(flank)绕过前排切后排
  - 关胜(assault)正面强攻利用溅射

#### 🔨 锻造策略
- **连续锻造**: 利用保底机制刷史诗装备
- **时机选择**: 在铁匠铺高等级时锻造 (属性加成更高)
- **装备分配**: 优先给主力英雄装备

---

## 🛠️ 开发指南

### 代码规范

#### TypeScript 严格模式
项目启用 TypeScript 严格编译选项:
```json
{
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noFallthroughCasesInSwitch": true
}
```

#### 组件编写约定
```tsx
// ✅ 推荐：使用函数组件 + Hooks
interface MyComponentProps {
  title: string;
  onClick?: () => void;
}

export default function MyComponent({ title, onClick }: MyComponentProps) {
  return (
    <div className="bg-black/40 border rounded-xl p-4">
      <h2>{title}</h2>
      {onClick && <button onClick={onClick}>点击</button>}
    </div>
  );
}
```

#### 状态管理最佳实践
```typescript
// ✅ 使用 selector 避免不必要的重渲染
const resources = useGameStore((state) => state.resources);
const upgradeBuilding = useGameStore((state) => state.upgradeBuilding);

// ❌ 避免：订阅整个 state
const state = useGameStore(); // 任何变化都会导致重渲染
```

### 添加新功能示例

#### 1. 添加新英雄
编辑 [src/data/heroes.json](src/data/heroes.json):
```json
{
  "heroes": {
    "new_hero_id": {
      "name": "新英雄名",
      "quality": "将才",
      "icon": null,
      "attributes": {
        "force": 20,
        "physique": 15,
        "agility": 12,
        "command": 10
      },
      "skillName": "技能名",
      "desc": "英雄描述",
      "skillEffect": {
        "type": "first_strike_bonus",
        "value": 0.3,
        "desc": "首次攻击+30%伤害"
      },
      "trait": "assault",
      "traitDesc": "突击型英雄"
    }
  }
}
```

#### 2. 添加新关卡
编辑 [src/data/missions.json](src/data/missions.json):
```json
{
  "missions": {
    "new_mission": {
      "name": "新关卡名",
      "desc": "关卡描述",
      "type": "explore",
      "recommendedLvl": 3,
      "availableFloors": 5,
      "enemyPool": ["enemy_id_1", "enemy_id_2"],
      "bossPool": ["boss_id"]
    }
  }
}
```

#### 3. 添加新建筑
1. 在 [src/types.ts](src/types.ts) 的 `buildings` 字段添加新字段
2. 在 [src/store.ts](src/store.ts) 添加升级逻辑
3. 创建新的 Panel 组件 (参考 [ForgePanel.tsx](src/components/ForgePanel.tsx))
4. 在 [MainUI.tsx](src/components/MainUI.tsx) 注册新标签页

### 调试技巧

#### 查看游戏状态
在浏览器控制台执行:
```javascript
// 查看完整状态
console.log(JSON.stringify(useGameStore.getState(), null, 2));

// 修改资源（测试用）
useGameStore.setState({ resources: { bingxiang: 99999, ... } });

// 重置游戏
useGameStore.getState().resetGame();
```

#### 性能分析
```bash
# 安装 React DevTools 浏览器扩展
# 在 Components 面板查看重渲染情况
```

---

## 🚀 部署指南

### 本地预览

```bash
# 构建 + 本地预览
npm run preview
# 访问 http://localhost:8788
```

### 部署到 Cloudflare Workers

#### 前置要求
1. 安装 Wrangler CLI:
```bash
npm install -g wrangler
```

2. 登录 Cloudflare:
```bash
wrangler login
```

#### 部署步骤
```bash
# 一键部署
npm run deploy

# 或手动分步执行
npm run build        # 1. 构建
wrangler deploy      # 2. 部署到 Cloudflare
```

#### 环境变量配置
在 Cloudflare Dashboard 设置:
- `GEMINI_API_KEY`: Gemini AI API 密钥 (可选)
- `APP_URL`: 应用访问URL (自动注入)

### Docker 部署 (可选)

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```bash
docker build -t zhenwu-lone-city .
docker run -p 8080:80 zhenwu-lone-city
```

---

## 📊 版本历史

查看 [CHANGELOG.md](./src/version.ts) 或在游戏中点击设置查看更新日志。

### V0.2.0 (2026-05-31) - 重大更新
- 🎮 重构地图探索为战棋模式，引入战术战斗系统
- ✨ 新增城门系统，支持战棋式关卡推进
- ⚔️ 新增战术战斗系统，包含英雄布阵和回合制战斗
- 🦸 新增完整英雄系统：酒馆招募、装备、属性培养
- 🏰 新增城市建筑系统：兵营、医院、市场、铁匠铺、仓库
- 📋 新增任务系统和任务引擎
- 🎯 新增任务选择和结算界面
- 📊 新增战斗结果统计面板
- 🎨 全新的游戏UI界面和交互体验
- 📝 完善游戏数据结构和类型定义

### V0.1.0 (2026-05-30) - 初始版本
- 🎉 初始版本发布
- ✨ 新增更新公告系统
- 🎨 优化界面显示，添加版本号展示功能
- 📝 完善游戏基础框架

---

## 🤝 贡献指南

欢迎贡献代码、报告Bug或提出功能建议！

### 如何贡献

1. **Fork** 这个仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的修改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 **Pull Request**

### 代码规范
- 遵循现有的代码风格
- 所有新代码必须有 TypeScript 类型注解
- 提交前运行 `npm run lint` 确保无错误
- 为复杂逻辑添加注释

### Bug 反馈
如果你发现了Bug，请通过 Issue 提交，并包含:
- 问题描述
- 复现步骤
- 截图(如有)
- 浏览器和操作系统信息

---

## 📄 许可证

本项目采用 Apache-2.0 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

## 🙏 致谢

- **React Team** - 提供优秀的UI框架
- **Zustand** - 轻量级状态管理方案
- **Tailwind CSS** - 原子化CSS框架
- **Lucide Icons** - 精美的开源图标库
- **Cloudflare** - 提供Workers边缘计算平台

---

## 📞 联系方式

- **问题反馈**: [GitHub Issues](../../issues)
- **功能建议**: [GitHub Discussions](../../discussions)
- **邮件联系**: [your-email@example.com]

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给一个 Star！⭐**

Made with ❤️ by Zhenwu Lone City Team

[回到顶部](#-镇武孤城-zhenwu-lone-city)

</div>
