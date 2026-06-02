export interface VersionInfo {
  version: string;
  date: string;
  changes: string[];
  type: 'major' | 'minor' | 'patch';
}

export const CURRENT_VERSION = '0.5.5';

export const CHANGELOG: VersionInfo[] = [
  {
    version: '0.5.5',
    date: '2026-06-02',
    type: 'patch',
    changes: [
      '🐛 修复自动战斗模式 setState 异步竞态导致第2回合起行动指令丢失的 bug'
    ]
  },
  {
    version: '0.5.4',
    date: '2026-06-02',
    type: 'patch',
    changes: [
      '✨ 自动战斗模式自动连续执行回合 + 🐛 修复结算页面日志解析不兼容新战斗引擎的问题'
    ]
  },
  {
    version: '0.5.3',
    date: '2026-06-02',
    type: 'patch',
    changes: [
      '🐛 修复 clamp 函数导致所有 HP 归零的致命 bug（Math.min 多余参数 0）'
    ]
  },
  {
    version: '0.5.2',
    date: '2026-06-02',
    type: 'patch',
    changes: [
      '🐛 修复战斗系统重复 React key（liukou）导致的状态异常和战斗直接结算问题'
    ]
  },
  {
    version: '0.5.1',
    date: '2026-06-01',
    type: 'patch',
    changes: [
      '🐛 修复手动战斗系统3个核心Bug：1) 攻击/技能按钮目标选择逻辑颠倒 2) 执行回合直接调用自动结算改为手动结算函数 3) 添加完整战场可视化布局'
    ]
  },
  {
    version: '0.5.0',
    date: '2026-06-01',
    type: 'minor',
    changes: [
      '⚔️ 新增手动战斗模式UI：能量条、技能按钮(攻击/技能/防御/跳过)、自动/手动切换',
      '🏆 新增成就系统：24个成就覆盖战斗/收集/挑战/成长/经济/隐藏6大类，自动检测+奖励发放',
      '📋 新增任务看板：每日/每周任务面板，支持接取、进度追踪、奖励领取、刷新倒计时',
      '🛡️ 新增装备套装系统：4套套装(铁卫/炎锋/影行者/屠龙者)，战斗属性加成整合',
      '✨ 为13位英雄定义独立主动技能数据(技能消耗/冷却/目标模式)',
      '📊 BATTLE_CONFIG 扩展：能量系统参数(每回合+20/大招100/技能50)、手动模式15秒限时',
      '🎨 HeroDetail 新增套装效果展示区域（激活件数/属性加成/稀有度光效）',
      '🎯 MainUI 新增成就入口(🏆)和任务入口(📋)按钮',
      '🔧 Store 新增 manualBattle 状态管理和8个手动战斗 action',
      '📝 新增 battleSkills / achievements / equipmentSets 数据文件'
    ]
  },
  {
    version: '0.4.0',
    date: '2026-06-01',
    type: 'minor',
    changes: [
      '✨ 英雄系统大扩展：7→13位英雄，新增稀有度系统(N/R/SR/SSR)和保底机制',
      '🎰 新增酒馆抽卡招募系统，支持加权随机和保底计数器',
      '⚖️ 重构经济模型为金字塔型：人口→兵箱→英雄→远征→资源的完整循环',
      '🍚 远征出发时消耗粮草，增加资源管理策略深度',
      '🎨 HeroIcon 全面重写，支持4级稀有度边框/光效/动画',
      '📋 HeroDetail 增强，展示技能卡片、位置加成、角色背景故事',
      '🔧 gameConfig.ts 集中管理所有游戏配置常量（建筑、酒馆、市场、经济）',
      '📊 新增战斗类型基础架构：能量系统、手动/自动模式、技能动作类型',
      '📝 新增 GDD_PHASE1.md 游戏设计文档'
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
