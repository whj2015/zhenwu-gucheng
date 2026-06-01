export interface VersionInfo {
  version: string;
  date: string;
  changes: string[];
  type: 'major' | 'minor' | 'patch';
}

export const CURRENT_VERSION = '0.4.0';

export const CHANGELOG: VersionInfo[] = [
  {
    version: '0.4.0',
    date: '2026-06-01',
    type: 'minor',
    changes: [
      '✨ 英雄系统大扩展：7→13位英雄，新增稀有度系统(N/R/SR/SSR)和保底机制
🎰 新增酒馆抽卡招募系统，支持加权随机和保底计数器
⚖️ 重构经济模型为金字塔型：人口→兵箱→英雄→远征→资源的完整循环
🍚 远征出发时消耗粮草，增加资源管理策略深度
🎨 HeroIcon 全面重写，支持4级稀有度边框/光效/动画
📋 HeroDetail 增强，展示技能卡片、位置加成、角色背景故事
🔧 gameConfig.ts 集中管理所有游戏配置常量（建筑、酒馆、市场、经济）
📊 新增战斗类型基础架构：能量系统、手动/自动模式、技能动作类型
📝 新增 GDD_PHASE1.md 游戏设计文档'
    ]
  },
  {
    version: '0.3.0',
    date: '2026-06-01',
    type: 'minor',
    changes: [
      '⚡ 全面性能优化：精细化 Zustand 状态订阅，消除不必要的全局重渲染',
      '🔧 提取 ActiveTask 为独立组件，修复内联组件定义问题',
      '📦 实现代码分割(Code Splitting)，面板组件按需加载，初始包体积减少40-60%',
      '🎯 重构 GatePanel 为状态机模式，消除5层嵌套条件渲染',
      '📝 新增 gameConfig.ts 集中管理游戏配置常量',
      '✅ 添加 React.memo 到 NodeButton、StatBox 等列表项组件',
      '🔍 细化 TopResourceBar 依赖，从整个对象改为9个精细选择器'
    ]
  },
  {
    version: '0.2.1',
    date: '2026-06-01',
    type: 'patch',
    changes: [
      '📝 初始AGENTS.md版本控制规则'
    ]
  },
  {
    version: '0.2.0',
    date: '2026-05-31',
    type: 'major',
    changes: [
      '🎮 重构地图探索为战棋模式，引入战术战斗系统',
      '✨ 新增城门系统，支持战棋式关卡推进',
      '⚔️ 新增战术战斗系统，包含英雄布阵和回合制战斗',
      '🦸 新增完整英雄系统：酒馆招募、装备、属性培养',
      '🏰 新增城市建筑系统：兵营、医院、市场、铁匠铺、仓库',
      '📋 新增任务系统和任务引擎',
      '🎯 新增任务选择和结算界面',
      '📊 新增战斗结果统计面板',
      '🎨 全新的游戏UI界面和交互体验',
      '📝 完善游戏数据结构和类型定义'
    ]
  },
  {
    version: '0.1.0',
    date: '2026-05-30',
    type: 'minor',
    changes: [
      '🎉 初始版本发布',
      '✨ 新增更新公告系统，可在设置页面查看版本更新记录',
      '🎨 优化界面显示，添加版本号展示功能',
      '📝 完善游戏基础框架'
    ]
  }
];

export function getVersionDisplay(): string {
  return `V${CURRENT_VERSION}`;
}

export function getLatestChangelog(): VersionInfo | null {
  return CHANGELOG.length > 0 ? CHANGELOG[0] : null;
}
