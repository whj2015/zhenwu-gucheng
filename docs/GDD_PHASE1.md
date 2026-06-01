# 镇武孤城 - 游戏设计文档 (GDD) v0.3.1

> **版本**: 0.3.1  
> **更新日期**: 2026-06-01  
> **状态**: Phase 1 设计阶段  
> **核心定位**: 混合时长古风策略RPG（前期重度 + 后期放置）

---

## 📖 目录

1. [游戏概述](#1-游戏概述)
2. [核心设计理念](#2-核心设计理念)
3. [目标玩家画像](#3-目标玩家画像)
4. [英雄系统设计](#4-英雄系统设计)
5. [经济系统设计](#5-经济系统设计)
6. [战斗系统深度设计](#6-战斗系统深度设计)
7. [长期目标体系](#7-长期目标体系)
8. [Phase 1 实施路线图](#8-phase-1-实施路线图)

---

## 1. 游戏概述

### 1.1 一句话描述
**"在废墟中重建城池，招募英雄，探索未知，成为镇武城主。"**

### 1.2 核心玩法循环

```
┌─────────────────────────────────────────────────────┐
│                    核心大循环                         │
│                                                     │
│   建筑升级 → 资源产出 → 英雄培养 → 废墟探险         │
│       ↑                                    │        │
│       └────────── 资源奖励 ←───────────────┘        │
│                                                     │
└─────────────────────────────────────────────────────┘

子循环:
  - 经济循环: 人口 → 兵饷 → 招募 → 探险 → 资源 → 建筑
  - 战斗循环: 布阵 → 战斗 → 奖励 → 装备 → 更强战斗
  - 成长循环: 升级 → 解锁内容 → 新挑战 → 升级
```

### 1.3 游戏特色

| 特色 | 描述 | 竞品对比 |
|------|------|----------|
| **古风沉浸** | 三国/武侠/历史人物，中国风美术 | 差异化于西幻题材 |
| **混合时长** | 支持5分钟挂机到60分钟深度游玩 | 兼顾休闲和硬核 |
| **策略布阵** | 3x3战场，位置加成，队伍搭配 | 类似《剑与远征》 |
| **放置收益** | 离线资源产出，回归即可领取 | 类似《AFK Arena》 |

---

## 2. 核心设计理念

### 2.1 设计原则

#### P1: 易学难深 (Easy to Learn, Hard to Master)
```
新手体验 (前5分钟):
  ✅ 明确的引导目标
  ✅ 直观的UI反馈
  ✅ 即时的成就感

专家策略 (100小时后):
  🔥 复杂的英雄搭配
  🔥 深度的经济优化
  🔥 极限的BOSS战术
```

#### P2: 有意义的决策 (Meaningful Choices)
每个决策都应该：
- **有明确权衡** (Trade-off): 选择A就不能选择B
- **可逆但有成本**: 可以改变但需要付出代价
- **信息透明**: 让玩家理解决策的影响

**示例决策点**:
```
❓ "我应该先升级兵营还是医馆？"
   → 兵营: 更多英雄选择，但需要治疗支持
   → 医馆: 更快恢复，但英雄池受限
   
❓ "这个BOSS应该带输出还是控制？"
   → 输出: 快速击杀小兵，但可能被BOSS秒杀
   → 控制: 限制BOSS行动，但伤害不足
```

#### P3: 正向反馈循环 (Positive Feedback Loops)
```
胜利 → 奖励 → 更强 → 更难挑战 → 更大奖励 → ...
  ↑                                        |
  └────────────────────────────────────────┘
```

避免负反馈循环（如：失败→更弱→更难→更失败）

---

## 3. 目标玩家画像

### 3.1 主要用户群体

| 用户类型 | 占比 | 特征 | 游玩习惯 |
|---------|------|------|----------|
| **休闲玩家** | 40% | 上班族/学生，碎片时间 | 每天2-3次，每次5-15分钟 |
| **策略玩家** | 35% | 硬核玩家，喜欢研究 | 每次30-60分钟，深度优化 |
| **收藏玩家** | 15% | 收集控，全收集强迫症 | 长期目标驱动 |
| **社交玩家** | 10% | 喜欢竞争和展示 | PVP/排行榜动力 |

### 3.2 用户需求层次

```
🏆 自我实现
   │  成为最强城主、全服排名
   │
🎯 尊重需求
   │  展示稀有英雄、炫耀成就
   │
🤝 社交需求
   │  公会合作、好友互动
   │
🎮 游戏需求
   │  有趣的策略玩法、持续的挑战
   │
⚡ 基础需求
   │  流畅的UI、稳定的系统、公平性
   │
💰 核心需求
     数值成长、收集满足感、即时反馈
```

---

## 4. 英雄系统设计

### 4.1 设计目标

**当前问题**:
- ❌ 只有7个英雄，组合有限
- ❌ 无稀有度分级，缺乏收集动力
- ❌ 成长维度单一（只有等级+装备）
- ❌ 无技能差异化，同定位英雄感觉雷同

**Phase 1 目标**:
- ✅ 扩展至15+英雄
- ✅ 引入4级稀有度系统
- ✅ 每个英雄有独特被动技能
- ✅ 设计位置加成机制

### 4.2 英雄池规划 (v0.4.0)

#### 4.2.1 稀有度定义

| 等级 | 名称 | 颜色 | 获取概率 | 示例 |
|------|------|------|----------|------|
| **N** | 普通 | ⚪ 灰白 | 60% | 铁牛、雷震、赵云、林冲、燕青 |
| **R** | 稀有 | 🟢 绿色 | 25% | 华佗、诸葛亮、典韦、荀彧 |
| **SR** | 史诗 | 🟠 橙色 | 12% | 吕布、马超、夏侯惇 |
| **SSR** | 传说 | 🔴 红色 | 3% | 庞统、孙思邈 |

#### 4.2.2 新增英雄列表

##### N级 - 普通 (5个)

```json
{
  "hero_008": {
    "id": "hero_008",
    "name": "典韦",
    "title": "古之恶来",
    "rarity": "N",
    "role": "tank",
    "baseStats": { "hp": 120, "atk": 15, "def": 18, "spd": 8 },
    "growthRates": { "hp": 1.5, "atk": 0.8, "def": 1.2, "spd": 0.5 },
    "skill": {
      "name": "恶来护主",
      "description": "替相邻友军承受50%伤害",
      "type": "passive",
      "trigger": "ally_take_damage",
      "effect": { "damage_redirect": 0.5, "range": "adjacent" }
    },
    "positionBonus": [
      { "pos": "front_left", "bonus": { "def": 10 } },
      { "pos": "front_right", "bonus": { "def": 10 } },
      { "pos": "front_center", "bonus": { "hp": 20 } }
    ],
    "flavorText": "手持双戟，勇冠三军。死战不退，忠义无双。",
    "lore": "曹操帐下猛将，曾徒手击杀数十人。宛城之战为保护曹操战死。"
  }
}
```

```json
{
  "hero_009": {
    "id": "hero_009",
    "name": "夏侯惇",
    "title": "独眼将军",
    "rarity": "N",
    "role": "tank",
    "baseStats": { "hp": 110, "atk": 18, "def": 14, "spd": 10 },
    "growthRates": { "hp": 1.3, "atk": 1.0, "def": 1.0, "spd": 0.7 },
    "skill": {
      "name": "拔矢啖睛",
      "description": "HP低于30%时，攻击力翻倍",
      "type": "passive",
      "trigger": "hp_below_threshold",
      "threshold": 0.3,
      "effect": { "atk_multiplier": 2.0 }
    },
    "positionBonus": [
      { "pos": "front_center", "bonus": { "atk": 15 } },
      { "pos": "front_left", "bonus": { "hp": 15 } }
    ]
  }
}
```

```json
{
  "hero_010": {
    "id": "hero_010",
    "name": "吕布",
    "title": "飞将",
    "rarity": "R",
    "role": "assault",
    "baseStats": { "hp": 90, "atk": 28, "def": 8, "spd": 14 },
    "growthRates": { "hp": 1.0, "atk": 1.5, "def": 0.6, "spd": 1.0 },
    "skill": {
      "name": "无双",
      "description": "攻击所有敌人，但自身防御力降低50%",
      "type": "active",
      "cost": { "energy": 100, "cooldown": 4 },
      "effect": { 
        "target": "all_enemies", 
        "damage_multiplier": 0.8,
        "self_debuff": { "def_reduction": 0.5, "duration": 2 }
      }
    },
    "positionBonus": [
      { "pos": "mid_center", "bonus": { "atk": 20 } },
      { "pos": "mid_left", "bonus": { "spd": 10 } }
    ]
  }
}
```

```json
{
  "hero_011": {
    "id": "hero_011",
    "name": "马超",
    "title": "锦马超",
    "rarity": "R",
    "role": "assault",
    "baseStats": { "hp": 85, "atk": 24, "def": 10, "spd": 16 },
    "growthRates": { "hp": 0.9, "atk": 1.3, "def": 0.7, "spd": 1.2 },
    "skill": {
      "name": "神威",
      "description": "对骑兵/轻甲单位造成双倍伤害",
      "type": "passive",
      "trigger": "deal_damage",
      "condition": { "enemy_type": ["cavalry", "light_armor"] },
      "effect": { "damage_multiplier": 2.0 }
    },
    "positionBonus": [
      { "pos": "mid_right", "bonus": { "atk": 15, "spd": 10 } },
      { "pos": "back_center", "bonus": { "spd": 20 } }
    ]
  }
}
```

##### R级 - 稀有 (3个)

```json
{
  "hero_012": {
    "id": "hero_012",
    "name": "荀彧",
    "title": "王佐之才",
    "rarity": "R",
    "role": "support",
    "baseStats": { "hp": 70, "atk": 12, "def": 8, "spd": 12 },
    "growthRates": { "hp": 0.8, "atk": 0.7, "def": 0.6, "spd": 0.9 },
    "skill": {
      "name": "王佐之才",
      "description": "全体友军攻击力提升20%，持续3回合",
      "type": "active",
      "cost": { "energy": 80, "cooldown": 3 },
      "effect": {
        "target": "all_allies",
        "buff": { "atk_boost": 0.2, "duration": 3 }
      }
    },
    "positionBonus": [
      { "pos": "back_left", "bonus": { "atk": 15 } },
      { "pos": "back_right", "bonus": { "spd": 10 } }
    ]
  }
}
```

```json
{
  "hero_013": {
    "id": "hero_013",
    "name": "庞统",
    "title": "凤雏",
    "rarity": "SR",
    "role": "support",
    "baseStats": { "hp": 65, "atk": 14, "def": 6, "spd": 13 },
    "growthRates": { "hp": 0.7, "atk": 0.8, "def": 0.5, "spd": 1.0 },
    "skill": {
      "name": "连环计",
      "description": "使2个随机敌人下回合无法行动",
      "type": "active",
      "cost": { "energy": 100, "cooldown": 5 },
      "effect": {
        "target": "random_enemies",
        "count": 2,
        "debuff": { "stun": true, "duration": 1 }
      }
    },
    "positionBonus": [
      { "pos": "back_center", "bonus": { "atk": 20 } }
    ]
  }
}
```

```json
{
  "hero_014": {
    "id": "hero_014",
    "name": "孙思邈",
    "title": "药王",
    "rarity": "SR",
    "role": "healer",
    "baseStats": { "hp": 75, "atk": 10, "def": 9, "spd": 11 },
    "growthRates": { "hp": 0.9, "atk": 0.6, "def": 0.7, "spd": 0.8 },
    "skill": {
      "name": "药王术",
      "description": "治疗单个友军并清除所有负面状态",
      "type": "active",
      "cost": { "energy": 70, "cooldown": 2 },
      "effect": {
        "target": "single_ally",
        "heal_percent": 0.4,
        "cleanse_debuffs": true
      }
    },
    "positionBonus": [
      { "pos": "back_left", "bonus": { "heal_power": 20 } },
      { "pos": "back_right", "bonus": { "hp": 15 } }
    ]
  }
}
```

#### 4.2.3 英雄定位分布

| 定位 | N级 | R级 | SR级 | SSR级 | 合计 |
|------|-----|-----|------|-------|------|
| **Tank (坦克)** | 3 (铁牛, 雷震, 典韦) | 1 (夏侯惇) | 0 | 0 | **4** |
| **Assault (输出)** | 2 (赵云, 林冲) | 2 (吕布, 马超) | 0 | 0 | **4** |
| **Flank (侧翼)** | 1 (燕青) | 0 | 0 | 0 | **1** |
| **Support (辅助)** | 0 | 1 (荀彧) | 1 (庞统) | 0 | **2** |
| **Healer (治疗)** | 0 | 0 | 1 (孙思邈) | 0 | **1** |
| **合计** | **6** | **4** | **2** | **0** | **12** |

**后续扩展计划 (v0.5.0)**:
- 再增加 3-5 个 SSR 传说英雄
- 补充 Flank 和 Healer 定位
- 总目标: 18-20 个英雄

### 4.3 英雄获取方式

| 方式 | 说明 | 概率分布 |
|------|------|----------|
| **酒馆招募** | 消耗兵饷，随机获得英雄 | N:60%, R:25%, SR:12%, SSR:3% |
| **任务奖励** | 完成特定任务链解锁 | 固定英雄（通常是R级） |
| **BOSS掉落** | 击败特定BOSS概率掉落 | SR/SSR专属 |
| **活动限定** | 节日活动/限时活动 | SSR限定英雄 |

#### 4.3.1 保底机制

```
普通召唤 (150兵饷/次):
  - 10连抽必得1个R或以上英雄
  - 50连抽必得1个SR英雄
  
高级召唤 (500兵饷/次):
  - 10连抽必得1个SR或以上英雄
  - 30连抽必得1个SSR英雄
```

### 4.4 英雄成长系统

#### 4.4.1 当前成长维度

| 维度 | 描述 | 上限 |
|------|------|------|
| **等级** | 通过战斗经验提升 | Lv.50 (暂定) |
| **装备** | 锻造获得的武器/防具 | 6件装备槽 |
| ** troops (兵卒)** | 可承受额外伤害 | 取决于建筑等级 |

#### 4.4.2 Phase 2 规划 (未来)

```
待实现的成长维度:

🔒 技能树
   ├── 每个英雄有3条技能线
   ├── 点数通过升级获得
   └── 不同Build适应不同场景

🔒 天赋系统
   ├── 通用天赋 (所有英雄可用)
   ├── 专属天赋 (英雄独特)
   └── 天赋点通过"觉醒"解锁

🔒 觉醒/突破
   ├── 达到等级上限后可觉醒
   ├── 提升品质 (N→R→SR→SSR)
   └── 解锁新技能外观
```

---

## 5. 经济系统设计

### 5.1 设计目标

**当前问题**:
- ❌ 6种资源关系模糊，用途重叠
- ❌ 粮草后期大量囤积无消耗出口
- ❌ 缺乏资源转换机制调节余缺
- ❌ 建筑升级成本曲线不合理

**Phase 1 目标**:
- ✅ 建立**金字塔型依赖链**
- ✅ 每种资源有**清晰且独特的用途**
- ✅ 设计**动态平衡机制**
- ✅ 优化建筑升级**成本曲线**

### 5.2 金字塔型经济模型

#### 5.2.1 资源层级结构

```
═══════════════════════════════════════════════════════
                    第1层: 基础资源
═══════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────┐
  │              👥 人口 (Population)             │
  │                                             │
  │  来源: 房屋产出                              │
  │  上限: houseLevel × 100                     │
  │  用途: 产生兵饷                              │
  │                                             │
  │  ⚠️ 硬性瓶颈: 所有其他资源的源头            │
  └──────────────────────┬──────────────────────┘
                         │
                         ▼
═══════════════════════════════════════════════════════
                    第2层: 生产资源
═══════════════════════════════════════════════════════

  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
  │ 💰 兵饷      │  │ 🌾 粮草      │  │ 🪵 木材      │
  │              │  │              │  │              │
  │ 来源: 人口产出│  │ 来源: 农场   │  │ 来源: 伐木场 │
  │ 速率: 0.01/人/s│ │ 速率: 2×农场级│ │ 速率: 1.5×伐木│
  │              │  │              │  │              │
  │ 用途: ★招募  │  │ 用途: ★探险  │  │ 用途: ★建筑  │
  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
         │                 │                 │
         ▼                 ▼                 ▼
═══════════════════════════════════════════════════════
                    第3层: 战斗资源
═══════════════════════════════════════════════════════

  ┌──────────────┐  ┌──────────────┐
  │ ⛏️ 铁锭      │  │ ✨ 陨铁      │
  │              │  │              │
  │ 来源: 战斗奖励│  │ 来源: BOSS  │
  │       市场交易│  │       高级锻造回收│
  │              │  │              │
  │ 用途: ★锻造  │  │ 用途: ★高级  │
  │       (基础) │  │       锻造   │
  └──────┬───────┘  └──────┬───────┘
         │                 │
         └────────┬────────┘
                  ▼
═══════════════════════════════════════════════════════
                    第4层: 终端产品
═══════════════════════════════════════════════════════

           ┌─────────────────────┐
           │  🗡️ 装备 (Equipment) │
           │                     │
           │  需要: 铁 + 陨铁    │
           │  效果: 强化英雄     │
           │  循环: 更强→更好奖励│
           └─────────────────────┘
```

#### 5.2.2 资源详细说明

##### 👥 人口 (Population)

```typescript
// gameConfig.ts
export const POPULATION_CONFIG = {
    // 基础属性
    BASE_POPULATION: 100,
    
    // 房屋效果
    HOUSE_CAPACITY_PER_LEVEL: 100,
    
    // 人口增长
    NATURAL_GROWTH_RATE: 0.001, // 每秒自然增长
    
    // 人口消耗
    HERO_RECRUIT_COST: 10, // 招募1个英雄消耗10人口
    
    // 人口惩罚 (如果人口接近上限)
    OVERCROWDING_PENALTY_THRESHOLD: 0.9, // 90%时开始惩罚
    OVERCROWDING_GROWTH_PENALTY: -0.5, // 增长率降低50%
};
```

**关键设计**:
- 人口是**硬性瓶颈**，限制英雄数量
- 人口接近上限时增长放缓（模拟拥挤效应）
- 鼓励玩家优先升级房屋

##### 💰 兵饷 (Bingxiang)

```typescript
export const BINGXIANG_CONFIG = {
    PRODUCTION_RATE: 0.01, // 每人口每秒产出
    
    RECRUIT_COSTS: {
        N: 150,   // 普通英雄
        R: 300,   // 稀有英雄
        SR: 600,  // 史诗英雄
        SSR: 1200 // 传说英雄
    },
    
    // 兵饷的其他潜在用途 (未来)
    FUTURE_USES: [
        '训练士兵',
        '购买情报',
        '加速建造'
    ]
};
```

**关键设计**:
- 兵饷是**主要消耗型资源**
- 高稀有度英雄消耗更多 → 选择压力
- 未来可扩展更多消耗出口

##### 🌾 粮草 (Food)

```typescript
export const FOOD_CONFIG = {
    PRODUCTION_PER_FARM_LEVEL: 2, // 每农场等级每秒产出
    
    EXPEDITION_COST_PER_HERO: 10, // 每次探险每个英雄消耗
    
    // 粮草的其他用途 (未来)
    FUTURE_USES: [
        '训练士兵消耗',
        '市场交易物品',
        '特殊事件'
    ]
};
```

**关键改动**:
- **新增**: 探险消耗粮草 → 解决囤积问题
- 粮草成为**持续消耗品**，鼓励频繁使用

##### 🪵 木材 (Wood)

```typescript
export const WOOD_CONFIG = {
    PRODUCTION_PER_LUMBER_LEVEL: 1.5,
    
    BUILDING_UPGRADE_MULTIPLIER: 1.0, // 建筑升级主要消耗木材
    
    // 木材与其他资源的比例
    BUILDING_COST_RATIO: {
        wood: 0.4,  // 40%
        iron: 0.3,  // 30%
        bingxiang: 0.2, // 20%
        food: 0.1   // 10%
    }
};
```

**关键设计**:
- 木材专门用于**建筑升级**
- 是长期发展的**节奏控制阀**

##### ⛏️ 铁锭 (Iron)

```typescript
export const IRON_CONFIG = {
    // 获取方式
    SOURCES: {
        BATTLE_REWARD_BASE: 20,
        MARKET_SELL_PRICE: 10,
        CRAFTING_REFUND: 0.3 // 分解装备回收30%
    },
    
    // 消耗方式
    CRAFTING_COSTS: {
        NORMAL_WEAPON: 50,
        NORMAL_ARMOR: 80,
        FINE_WEAPON: 150,
        FINE_ARMOR: 250
    }
};
```

##### ✨ 陨铁 (Meteorite)

```typescript
export const METEORITE_CONFIG = {
    RARITY: 'legendary', // 最稀有的资源
    
    SOURCES: {
        BOSS_DROP_BASE: 10,
        BOSS_DROP_FLOOR_MULTIPLIER: 1.0, // 每层+10
        LUCKY_DROP_CHANCE: 0.05 // 5%幸运掉落
    },
    
    USES: {
        EPIC_CRAFTING: 5,   // 史诗装备需要5个
        LEGENDARY_CRAFTING: 20, // 传说装备需要20个
        HERO_ASCENSION: 100 // 英雄觉醒需要100个
    }
};
```

**关键设计**:
- 陨铁是**终极稀缺资源**
- 多个高端系统竞争同一资源 → 策略选择

### 5.3 建筑系统重构

#### 5.3.1 建筑升级成本公式

```typescript
function calculateUpgradeCost(buildingType: string, currentLevel: number): ResourceCost {
    const baseCosts = {
        house: { wood: 100, iron: 50, bingxiang: 80 },
        farm: { wood: 80, iron: 30, food: 50 },
        lumberCamp: { wood: 60, iron: 40, bingxiang: 60 },
        forge: { wood: 200, iron: 150, bingxiang: 100 },
        hospital: { wood: 150, iron: 100, bingxiang: 120 },
        market: { wood: 180, iron: 80, bingxiang: 140 },
        warehouse: { wood: 120, iron: 90, bingxiang: 100 },
        barracks: { wood: 250, iron: 200, bingxiang: 180 }
    };
    
    const base = baseCosts[buildingType];
    const multiplier = Math.pow(1.5, currentLevel - 1); // 每级1.5倍
    
    return {
        wood: Math.floor(base.wood * multiplier),
        iron: Math.floor(base.iron * multiplier),
        bingxiang: Math.floor(base.bingxiang * multiplier),
        food: buildingType === 'farm' ? Math.floor(50 * multiplier) : 0
    };
}
```

**成本曲线示例 (以房屋为例)**:

| 等级 | 木材 | 铁锭 | 兵饷 | 累计成本 |
|------|------|------|------|----------|
| 1→2 | 150 | 75 | 120 | 345 |
| 2→3 | 225 | 113 | 180 | 518 |
| 3→4 | 338 | 169 | 270 | 777 |
| 4→5 | 506 | 253 | 405 | 1164 |
| 5→6 | 759 | 380 | 608 | 1747 |
| ... | ... | ... | ... | ... |

#### 5.3.2 建筑优先级推荐

**新手期 (Lv.1-10)**:
```
1. 房屋 Lv.3 → 解锁更多人口
2. 农场 Lv.2 → 保证粮草供应
3. 伐木场 Lv.2 → 建筑材料
4. 兵营 Lv.2 → 招募第3个英雄
```

**发展期 (Lv.11-20)**:
```
1. 锻造坊 Lv.3 → 更好装备
2. 医院 Lv.2 → 加速恢复
3. 市场 Lv.2 → 资源交易
4. 仓库 Lv.2 → 增加上限
```

**成熟期 (Lv.21+)**:
```
1. 所有建筑均衡发展
2. 根据玩法风格调整侧重
3. 为新内容预留资源
```

---

## 6. 战斗系统深度设计

### 6.1 设计目标

**当前状态**:
- ✅ 3x3布阵系统
- ✅ 回合制自动战斗
- ✅ 位置加成
- ❌ 无手动操作选项
- ❌ 技能释放不可控

**Phase 1 目标**:
- ✅ 实现**自动/手动模式切换**
- ✅ 引入**能量系统**
- ✅ 设计**技能释放时机选择**

### 6.2 战斗流程重构

#### 6.2.1 自动模式 (保持现有逻辑)

```
开始战斗
  ↓
检查双方速度 → 决定行动顺序
  ↓
回合开始
  ↓
AI根据以下规则自动选择行动:
  1. 如果HP<30%且有治疗技能 → 使用治疗
  2. 如果能量≥100 → 释放大招
  3. 否则 → 普通攻击最近敌人
  ↓
所有单位行动完毕 → 回合结束
  ↓
检查胜负条件
  ↓
继续下一回合 或 结束战斗
```

#### 6.2.2 手动模式 (新增)

```
开始战斗
  ↓
显示战斗界面 (暂停状态)
  ↓
玩家操作:
  ├─ 点击英雄头像查看可用技能
  ├─ 选择目标 (如果是主动技能)
  ├─ 或点击"自动"让AI接管本回合
  ↓
确认行动 → 执行动画
  ↓
敌方AI行动 (根据难度调整智能程度)
  ↓
回合结束 → 能量积累
  ↓
重复直到战斗结束
```

### 6.3 能量系统设计

#### 6.3.1 基础规则

```typescript
interface EnergySystem {
    maxEnergy: 100;
    initialEnergy: 0;
    perTurnGain: 20;       // 每回合+20
    firstTurnBonus: 10;    // 首回合额外+10
    
    ultimateSkillCost: 100; // 大招需要100能量
    normalSkillCost: 50;   // 小技能需要50能量
    
    energyDecayOnSwitch: 0; // 切换模式不损失能量
}
```

#### 6.3.2 UI 设计

```
┌─────────────────────────────────────────────────┐
│  ⚔️ 战斗中 - 第3回合                            │
│  [⏸️ 暂停] [🔄 切换至自动]                      │
├─────────────────────────────────────────────────┤
│                                                 │
│   ┌──────┐  ┌──────┐  ┌──────┐                │
│   │ 敌方 │  │ 敌方 │  │ BOSS │                │
│   │ 小兵 │  │ 小兵 │  │[████]│ HP: 800/2000    │
│   └──────┘  └──────┘  └──────┘                │
│                                                 │
│          ⚔️ 战场区域                             │
│                                                 │
│   ┌──────┐  ┌──────┐  ┌──────┐                │
│   │[████]│  │[████]│  │[████]│                │
│   │铁牛  │  │赵云  │  │华佗  │                │
│   │HP:450│  │HP:320│  │HP:280│                │
│   │⚡60  │  │⚡80  │  │⚡100 │← 能量条          │
│   └──────┘  └──────┘  └──────┘                │
│                                                 │
├─────────────────────────────────────────────────┤
│  [铁牛: 嘶吼] [赵云: 七进七出] [华佗: 青囊书✨] │
│     能量: 60/100   能量: 80/100   能量: 100/100 │
└─────────────────────────────────────────────────┘
```

#### 6.3.3 手动模式规则

**操作限制**:
- 每回合每个英雄只能**执行1次操作**
- 可选操作:
  - 普通攻击 (无需能量)
  - 释放小技能 (需50能量)
  - 释放大招 (需100能量)
  - 防御 (本回合减伤50%，+20能量)
  - 待机 (跳过，+30能量)

**时间限制**:
- 每回合**15秒**思考时间
- 超时自动执行AI最优解
- 可在设置中调整或关闭

### 6.4 战斗模式适用场景

| 场景 | 默认模式 | 可否切换 | 备注 |
|------|----------|----------|------|
| **普通关卡** | 自动 | ✅ 可切手动 | 推荐自动刷材料 |
| **精英怪** | 手动 | ✅ 可切自动 | 推荐手动提高胜率 |
| **BOSS战** | 手动 | ❌ 强制手动 | 必须手动才能获得完整奖励 |
| **竞技场** | 手动 | ❌ 强制手动 | 公平竞技 |
| **日常副本** | 自动 | ✅ 可切手动 | 放置友好 |

### 6.5 AI 行为逻辑 (敌方)

#### 6.5.1 普通敌人 AI

```typescript
function normalEnemyAI(enemy: Enemy, battlefield: Battlefield): Action {
    // 简单AI: 攻击HP最低的友军
    const targets = getAliveAllies(battlefield);
    const lowestHpTarget = targets.reduce((a, b) => 
        a.hp < b.hp ? a : b
    );
    
    return { type: 'attack', target: lowestHpTarget };
}
```

#### 6.5.2 BOSS AI (增强版)

```typescript
function bossAI(boss: Boss, battlefield: Battlefield, turn: number): Action {
    const hpPercent = boss.currentHp / boss.maxHp;
    
    // 阶段转换
    if (hpPercent < 0.3 && !boss.enraged) {
        return { type: 'enrage' }; // 进入狂暴状态
    }
    
    if (boss.enraged) {
        // 狂暴状态: 随机攻击，伤害翻倍
        return { 
            type: 'rage_attack', 
            target: random(getAliveAllies(battlefield)),
            damageMultiplier: 2.0 
        };
    }
    
    // 正常状态: 优先攻击输出最高的
    const highestAtkTarget = getAliveAllies(battlefield)
        .reduce((a, b) => a.atk > b.atk ? a : b);
    
    // 30%概率使用技能
    if (Math.random() < 0.3 && boss.skillCooldown <= 0) {
        return { type: 'skill', skill: boss.ultimateSkill };
    }
    
    return { type: 'attack', target: highestAtkTarget };
}
```

---

## 7. 长期目标体系

### 7.1 目标金字塔设计

```
                        🏆 终极目标
                   "成为镇武城主"
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
    🎖️ 季度目标      🌟 收集目标     ⚔️ 成就目标
   "服务器Top100"   "全英雄图鉴"   "特殊挑战"
          │               │               │
          └───────────────┼───────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
    📅 月度目标      📆 每周目标     🎯 成就里程碑
   "解锁新章节"    "通关周本"   "累计击败1000敌人"
          │               │               │
          └───────────────┼───────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
    📅 每日目标      💫 即时目标     🔔 引导目标
   "完成3次探险"   "赢得战斗"    "完成新手教程"
```

### 7.2 各层级目标详解

#### 7.2.1 即时目标 (Instant Goals)

**特点**: 即时反馈，单次行为即可完成

| 目标 | 条件 | 奖励 | 出现频率 |
|------|------|------|----------|
| 赢得战斗 | 战斗胜利 | 经验+资源 | 每次战斗 |
| 升级建筑 | 成功升级 | 解锁功能 | 不定期 |
| 招募英雄 | 成功招募 | 新英雄 | 不定期 |
| 锻造装备 | 成功锻造 | 新装备 | 不定期 |

**设计要点**:
- ✅ 清晰的成功/失败状态
- ✅ 即时的视觉/数值反馈
- ✅ 符合预期的奖励

#### 7.2.2 每日目标 (Daily Goals)

**设计原则**:
- 完成5-15分钟即可达成
- 奖励有价值但不至于过度
- 多样化避免单调

**示例每日任务**:

```json
{
  "daily_quests": [
    {
      "id": "daily_explore_3",
      "name": "废墟探索者",
      "description": "完成3次废墟探险",
      "type": "expedition",
      "target": 3,
      "rewards": { "iron": 100, "bingxiang": 50 },
      "refresh_time": "04:00"
    },
    {
      "id": "daily_craft_1",
      "name": "锻造学徒",
      "description": "成功锻造1件装备",
      "type": "crafting",
      "target": 1,
      "rewards": { "meteorite": 2 },
      "refresh_time": "04:00"
    },
    {
      "id": "daily_recruit_1",
      "name": "招贤纳士",
      "description": "招募1位新英雄",
      "type": "recruit",
      "target": 1,
      "rewards": { "food": 200 },
      "refresh_time": "04:00"
    },
    {
      "id": "daily_upgrade_1",
      "name": "城市建设者",
      "description": "升级任意建筑1次",
      "type": "upgrade",
      "target": 1,
      "rewards": { "wood": 150 },
      "refresh_time": "04:00"
    }
  ]
}
```

#### 7.2.3 每周目标 (Weekly Goals)

**设计原则**:
- 难度适中，需要一定策略
- 奖励包含稀有资源
- 鼓励尝试不同玩法

**示例周常**:

```json
{
  "weekly_quests": [
    {
      "id": "weekly_floor_10",
      "name": "深入腹地",
      "description": "在任一废墟到达第10层",
      "type": "exploration_depth",
      "target": 10,
      "rewards": { "meteorite": 10, "hero_shard_random_rare": 1 },
      "reset_day": "monday"
    },
    {
      "id": "weekly_boss_5",
      "name": "猎魔人",
      "description": "击败5个BOSS",
      "type": "boss_kill",
      "target": 5,
      "rewards": { "iron": 500, "equipment_fine_random": 1 },
      "reset_day": "monday"
    },
    {
      "id": "weekly_hero_stars_20",
      "name": "群英荟萃",
      "description": "英雄总星级达到20星",
      "type": "hero_collection",
      "target": 20,
      "rewards": { "bingxiang": 300, "recruit_ticket": 1 },
      "reset_day": "monday"
    }
  ]
}
```

#### 7.2.4 月度/章节目标 (Monthly Goals)

**设计原则**:
- 与剧情进度绑定
- 解锁重要功能/内容
- 提供长期方向感

**示例**:

```json
{
  "chapter_goals": [
    {
      "id": "chapter_1_complete",
      "name": "镇武初立",
      "description": "完成第一章所有剧情关卡",
      "requirements": {
        "main_quests_complete": 10,
        "city_level_min": 5,
        "hero_count_min": 3
      },
      "rewards": {
        "items": ["hero_ssr_ticket_1"],
        "unlock_features": ["market_tier_2", "ruins_type_b"],
        "title": "镇武新人"
      }
    },
    {
      "id": "chapter_2_complete",
      "name": "威震四方",
      "description": "完成第二章并建立威望",
      "requirements": {
        "ruins_all_cleared_once": true,
        "hero_count_min": 8,
        "total_power_min": 10000
      },
      "rewards": {
        "unlock_features": ["arena", "guild"],
        "title": "一方霸主"
      }
    }
  ]
}
```

### 7.3 成就系统设计

#### 7.3.1 成就分类

| 类型 | 示例 | 难度 | 奖励 |
|------|------|------|------|
| **战斗成就** | "首次击败BOSS" | ⭐ | 头像框 |
| **收集成就** | "拥有10个不同英雄" | ⭐⭐ | 称号 |
| **挑战成就** | "无治疗通关7层" | ⭐⭐⭐⭐ | 专属皮肤 |
| **社交成就** | "加入公会" | ⭐ | 公会徽章 |
| **时长成就** | "登录30天" | ⭐⭐ | 专属坐骑 |

#### 7.3.2 隐藏成就 (增加探索乐趣)

```json
{
  "hidden_achievements": [
    {
      "id": "secret_speedrun",
      "name": "神速",
      "description": "在60秒内完成一场战斗",
      "hint": "高攻击阵容可以...",
      "reward": { "title": "闪电侠", "effect": "移动速度+10%" }
    },
    {
      "id": "secret_pacifist",
      "name": "仁者无敌",
      "description": "不击杀任何小兵直接击败BOSS",
      "hint": "有些BOSS...",
      "reward": { "skin": "pacifist_theme" }
    }
  ]
}
```

---

## 8. Phase 1 实施路线图

### 8.1 时间规划

| 阶段 | 时间 | 任务 | 交付物 |
|------|------|------|--------|
| **Week 1** | Day 1-2 | 数据层实现 | heroes.json 扩展, gameConfig.ts 更新 |
| | Day 3-4 | 英雄获取系统 | 酒馆UI, 招募逻辑, 保底机制 |
| | Day 5-7 | UI适配 | 英雄面板改造, 稀有度展示 |
| **Week 2** | Day 8-9 | 经济系统重构 | 资源依赖链, 探险粮草消耗 |
| | Day 10-11 | 建筑成本调整 | 新成本公式, 平衡测试 |
| | Day 12-14 | 市场系统增强 | 资源交易, 汇率系统 |
| **Week 3** | Day 15-17 | 战斗系统能量条 | 能量UI, 积累逻辑 |
| | Day 18-19 | 手动模式框架 | 模式切换, 技能按钮 |
| | Day 20-21 | AI对手增强 | BOSS行为, 策略变化 |
| **Week 4** | Day 22-24 | 任务系统重构 | 日/周/月目标模板 |
| | Day 25-26 | 成就系统 | 成就检测, 奖励发放 |
| | Day 27-28 | 整体平衡调优 | 数值调整, Bug修复 |

### 8.2 优先级排序

**P0 - 必须完成 (阻塞其他功能)**:
1. ✅ heroes.json 数据扩展 (8个新英雄)
2. ✅ 稀有度系统实现
3. ✅ 经济金字塔模型代码化
4. ✅ 探险粮草消耗逻辑

**P1 - 应该完成 (显著提升体验)**:
5. 🔄 酒馆招募UI重做
6. 🔄 能量系统基础版
7. 🔄 自动/手动模式切换
8. 🔄 每日任务模板

**P2 - 可以延后 (锦上添花)**:
9. ⏳ 成就系统完整版
10. ⏳ 隐藏成就
11. ⏳ 月度章节目标
12. ⏳ 社交功能准备

### 8.3 验收标准

**功能验收**:
- [ ] 可通过酒馆招募到12个不同英雄
- [ ] 稀有度正确影响招募概率和属性
- [ ] 探险正确消耗粮草
- [ ] 经济系统运行稳定，无资源溢出/死锁
- [ ] 手动模式可正常操作并释放技能
- [ ] 每日任务可完成并获得奖励

**性能验收**:
- [ ] 英雄数据加载 < 100ms
- [ ] 战斗计算 < 50ms/回合
- [ ] 经济系统Tick < 10ms
- [ ] 内存占用增加 < 20MB

**用户体验验收**:
- [ ] 新手可在5分钟内理解经济系统
- [ ] 手动模式学习成本 < 3场战斗
- [ ] 目标系统清晰可见且动机明确
- [ ] 无明显数值崩坏或卡点

---

## 附录 A: 术语表

| 术语 | 定义 |
|------|------|
| **Core Loop** | 核心玩法循环，玩家反复进行的主要行为序列 |
| **Retention** | 留存率，玩家回访游戏的比率 |
| **ARPU** | Average Revenue Per User，每用户平均收入 |
| **LTV** | Lifetime Value，用户生命周期价值 |
| **Churn Rate** | 流失率，停止游玩的玩家比例 |
| **Pity System** | 保底机制，保证稀有物品的最差获取概率 |
| **Power Creep** | 数值膨胀，新内容过强导致旧内容贬值 |

---

## 附录 B: 参考资料

### 竞品分析

| 游戏 | 核心亮点 | 可借鉴点 |
|------|----------|----------|
| 《剑与远征》 | 英雄羁绊、种族克制 | 团队搭配深度 |
| 《AFK Arena》 | 离线收益、扫荡功能 | 放置体验优化 |
| 《三国志·战略版》 | 地缘战略、赛季制 | 长期目标设计 |
| 《少女前线》 | 人形培养、装备制造 | 制造系统深度 |

### 设计书籍推荐

1. *《游戏设计艺术》* - Jesse Schell
2. *《快乐之道》* - Raph Koster
3. *《游戏机制》* - Ernest Adams & Joris Dormans

---

> **文档版本历史**:
> - v0.3.1 (2026-06-01): Phase 1 初稿，基于 grill-me 审查结果
> - v0.3.0 (2026-06-01): 性能优化版本，无设计变更

**下一步**: 等待团队评审后进入 Week 1 实施
