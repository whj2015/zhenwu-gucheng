export interface VersionInfo {
  version: string;
  date: string;
  changes: string[];
  type: 'major' | 'minor' | 'patch';
}

export const CURRENT_VERSION = '0.6.13';

export const CHANGELOG: VersionInfo[] = [
  {
    version: '0.6.13',
    date: '2026-06-02',
    type: 'patch',
    changes: [
      '🎨 优化布阵页面布局样式 — 去除网格行 flex-1/h-full 拉伸，消除多余空白，恢复紧凑排列'
    ]
  },
  {
    version: '0.6.12',
    date: '2026-06-02',
    type: 'patch',
    changes: [
      '🐛 彻底修复布阵页面出发按钮被遮挡 — 去掉 h-full/overflow-hidden 约束，改为自然文档流布局，跟随 MainUI 滚动区域统一滚动，出发按钮始终可达'
    ]
  },
  {
    version: '0.6.11',
    date: '2026-06-02',
    type: 'patch',
    changes: [
      '🐛 修复布阵页面出发按钮在特定分辨率下被底部导航遮挡 — 改用 flex sticky footer 布局：外层 overflow-hidden + header/preset/footer shrink-0 + 中间区域独立滚动，出发按钮始终钉在可见区底部'
    ]
  },
  {
    version: '0.6.10',
    date: '2026-06-02',
    type: 'patch',
    changes: [
      '🐛 修复布阵页面出发按钮在特定分辨率下被遮挡的问题 — 网格/英雄列表区域增加 overflow-y-auto 独立滚动'
    ]
  },
  {
    version: '0.6.9',
    date: '2026-06-02',
    type: 'patch',
    changes: [
      '🎨 布阵页面移动端适配优化 — 缩小网格尺寸/间距、英雄列表改为横向滚动芯片、预设栏弹性换行、底部栏紧凑化'
    ]
  },
  {
    version: '0.6.8',
    date: '2026-06-02',
    type: 'patch',
    changes: [
      '🐛 修复战斗胜利后敌方格位不消失：cleanup useEffect 中 Zustand useSyncExternalStore 同步重渲染存在竞态条件 — clearActiveBattle() 后 activeBattleRef 未及时更新为 null，导致组件卸载时 cleanup 仍看到旧 ref 值并错误地将 fogStates[pos] 重置为 ready。新增 battleEndedNormallyRef 标志，handleBattleEnd/handleExit 设其为 true 后 cleanup 跳过 reset 逻辑'
    ]
  },
  {
    version: '0.6.7',
    date: '2026-06-02',
    type: 'patch',
    changes: [
      '🐛 修复战斗胜利后敌方格不消失：`handleBattleEnd`只更新了`nodes`标记`completed:true`，但忘了更新`fogStates`将格位设为`done`，导致格位仍显示为可探索。现同步更新`fogStates`并揭示相邻格'
    ]
  },
  {
    version: '0.6.6',
    date: '2026-06-02',
    type: 'patch',
    changes: [
      '🐛 彻底修复结算页我方攻击记录丢失：正则`(?:率兵卒)?`可选组引发回溯bug，`[\u4e00-\u9fa5]+`贪婪匹配时将"率兵卒"捕获为attacker。改为必选`(?: 率兵卒)`+空格前缀'
    ]
  },
  {
    version: '0.6.5',
    date: '2026-06-02',
    type: 'patch',
    changes: [
      '🐛 彻底修复结算页我方攻击记录丢失：正则改用中文字符范围[\u4e00-\u9fa5]匹配名字，完全绕过emoji编码差异问题'
    ]
  },
  {
    version: '0.6.4',
    date: '2026-06-02',
    type: 'patch',
    changes: [
      '🐛 修复结算页总输出仍为0：正则中emoji前缀被捕获进attacker名字导致heroNames匹配失败。改用非捕获组(?:emoji)消耗前缀，确保attacker捕获纯净名字'
    ]
  },
  {
    version: '0.6.3',
    date: '2026-06-02',
    type: 'patch',
    changes: [
      '🐛 修复结算页总输出为0的严重bug：(1)重写正则去除emoji依赖改用通用模式+英雄名字集合判断阵营 (2)修复enemyStates逻辑：hpAfter从damageMap反算实际剩余HP、isAlive根据实际HP判断而非!victory'
    ]
  },
  {
    version: '0.6.2',
    date: '2026-06-02',
    type: 'patch',
    changes: [
      '🐛 修复战斗中断敌人消失导致无法退出：战斗节点不再立即标记done(延后到战斗结束时)、修复cleanup闭包陷阱(改用ref)、增加异常状态安全网自动清理'
    ]
  },
  {
    version: '0.6.1',
    date: '2026-06-02',
    type: 'patch',
    changes: [
      '🐛 修复结算页战斗记录消失：更新正则表达式适配兵力系统新日志格式（兵卒抵挡/本体受创/率兵卒攻击）'
    ]
  },
  {
    version: '0.6.0',
    date: '2026-06-02',
    type: 'minor',
    changes: [
      '⚔️ 战斗系统接入兵力机制：兵卒减伤(1.5%/人,上限70%)、伤害消耗兵卒(~3人/HP)、UI显示兵卒数、战斗结果回传兵力变化'
    ]
  },
  {
    version: '0.5.10',
    date: '2026-06-02',
    type: 'patch',
    changes: [
      '🐛 修复双击确认行动无法使用的问题，改用手动时间戳检测替代浏览器原生 double-click 事件'
    ]
  },
  {
    version: '0.5.9',
    date: '2026-06-02',
    type: 'patch',
    changes: [
      '⚔️ 战斗操作优化 — 双击目标直接确认行动 + 已死敌人攻击拦截提示'
    ]
  },
  {
    version: '0.5.8',
    date: '2026-06-02',
    type: 'patch',
    changes: [
      '⚡ 战斗体验优化 — 所有英雄选择完行动后自动执行回合，无需手动点击'
    ]
  },
  {
    version: '0.5.7',
    date: '2026-06-02',
    type: 'patch',
    changes: [
      '⚡ 修复能量系统 — 防御(+20⚡)/跳过(+30⚡)现在正确积攒能量，每回合基础恢复+20⚡'
    ]
  },
  {
    version: '0.5.6',
    date: '2026-06-02',
    type: 'patch',
    changes: [
      '🐛 修复战斗中切换页面导致状态丢失/卡死的 bug — 战斗状态持久化到 store + 卸载时自动清理'
    ]
  },
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
