/**
 * 镇武孤城 - 新手引导系统
 *
 * 分步骤引导玩家了解游戏核心机制：
 * 1. 基础界面认知 → 2. 资源系统 → 3. 建筑系统 → 4. 英雄招募
 * → 5. 装备锻造 → 6. 出征探险 → 7. 战斗系统 → 8. 任务与成就
 */

export type TutorialStepId =
  | 'welcome'
  | 'ui_overview'
  | 'resources_basic'
  | 'building_house'
  | 'building_farm'
  | 'tavern_recruit'
  | 'equip_forge'
  | 'gate_expedition'
  | 'battle_basics'
  | 'quest_board'
  | 'achievement_intro'
  | 'market_trade'
  | 'hospital_heal'
  | 'tips_daily';

export interface TutorialStep {
  id: TutorialStepId;
  phase: 'basics' | 'economy' | 'combat' | 'advanced';
  order: number;
  title: string;
  /** 引导文本（支持多段） */
  content: string[];
  /** 高亮目标：tab名称或选择器 */
  highlightTarget?: {
    type: 'tab' | 'element' | 'area';
    id: string;          // tab id 或 DOM 选择器
    label?: string;      // 显示的标签文字
  };
  /** 触发条件 */
  trigger: {
    type: 'auto' | 'manual' | 'action_completed';
    /** 需要完成的前置步骤 */
    requireCompletedStep?: TutorialStepId;
    /** 触发动作类型 */
    actionType?: 'upgrade_building' | 'recruit_hero' | 'start_craft' |
      'begin_expedition' | 'win_battle' | 'accept_quest' | 'trade_resource';
    actionTarget?: string;
  };
  /** 完成此步后的奖励 */
  rewards?: {
    bingxiang?: number;
    iron?: number;
    food?: number;
    wood?: number;
  };
  /** 是否可以跳过 */
  skippable: boolean;
  /** 关联的剧情章节（可选，完成后自动触发剧情） */
  unlockStoryChapter?: string;
}

export interface TutorialState {
  completedSteps: TutorialStepId[];
  currentStep: TutorialStepId | null;
  isTutorialActive: boolean;
  skipTutorial: boolean;
  lastShownTime: number;
}

// ============================================================
// 引导步骤定义
// ============================================================

export const TUTORIAL_STEPS: Record<TutorialStepId, TutorialStep> = {

  // ---- 欢迎页 ----
  welcome: {
    id: 'welcome',
    phase: 'basics',
    order: 0,
    title: '欢迎来到镇武孤城',
    content: [
      '将军，欢迎来到镇武孤城！',
      '',
      '这是一座在战火中沉寂已久的古城。你将在这里招募英雄、建设城池、探索未知、书写属于你的传奇。',
      '',
      '别担心，我会一步步指引你熟悉这座城。让我们开始吧！',
    ],
    trigger: { type: 'auto' },
    skippable: true,
    unlockStoryChapter: 'prologue',
  },

  // ---- 界面概览 ----
  ui_overview: {
    id: 'ui_overview',
    phase: 'basics',
    order: 1,
    title: '认识你的城池',
    content: [
      '这是镇武城的主界面。',
      '',
      '左侧导航栏包含了城中所有重要区域：',
      '· 主城署 — 管理建筑和资源产出',
      '· 医馆 — 治疗受伤的英雄',
      '· 集市 — 资源交易和调配',
      '· 募兵营 — 为英雄补充兵力',
      '· 兵甲坊 — 锻造装备武器',
      '· 门客 — 查看和管理你的英雄',
      '· 库房 — 存放物资和装备',
      '· 城门 — 出征探险的主要入口',
      '',
      '顶部的资源栏实时显示你的各种资源数量和产出速度。',
    ],
    highlightTarget: { type: 'tab', id: 'city', label: '从这里开始' },
    trigger: {
      type: 'manual',
      requireCompletedStep: 'welcome',
    },
    skippable: false,
  },

  // ---- 资源基础 ----
  resources_basic: {
    id: 'resources_basic',
    phase: 'basics',
    order: 2,
    title: '资源——城的命脉',
    content: [
      '镇武城有六种基础资源，它们构成了完整的生态循环：',
      '',
      '👤 人口 — 最根本的资源。人口越多，兵饷产出越高',
      '🌾 粮草 — 维持城市运转的基础，出征时消耗',
      '🪵 木材 — 建筑升级的主要材料',
      '🪙 兵饷 — 招募英雄的核心货币，由人口产出',
      '⛏️ 铁锭 — 锻造装备的必需品',
      '✨ 陨铁 — 稀有资源，BOSS掉落和高级锻造需要',
      '',
      '记住这个金字塔：人口 → 兵饷/粮草/木材 → 铁锭/陨铁 → 装备 → 更强战斗力 → 更多资源',
    ],
    highlightTarget: { type: 'area', id: 'top-resource-bar', label: '资源栏' },
    trigger: {
      type: 'manual',
      requireCompletedStep: 'ui_overview',
    },
    skippable: true,
    rewards: { wood: 100, food: 100 },
  },

  // ---- 建筑：民房 ----
  building_house: {
    id: 'building_house',
    phase: 'economy',
    order: 3,
    title: '扩建民房',
    content: [
      '人口是所有资源的源头，而民房决定了人口上限。',
      '',
      '当前你的民房等级为 Lv.1，最多容纳 100 人。',
      '升级民房可以增加人口上限，从而提高兵饷产出。',
      '',
      '试试点击"扩建民居"按钮来升级吧！',
      '',
      '提示：升级需要消耗木材和粮草，资源不足的话可以先等一会儿自动产出。',
    ],
    highlightTarget: { type: 'element', id: 'upgrade-house-btn', label: '扩建民居' },
    trigger: {
      type: 'action_completed',
      requireCompletedStep: 'resources_basic',
      actionType: 'upgrade_building',
      actionTarget: 'houseLevel',
    },
    skippable: false,
    rewards: { population: 30, bingxiang: 50 },
  },

  // ---- 建筑：农田 ----
  building_farm: {
    id: 'building_farm',
    phase: 'economy',
    order: 4,
    title: '开垦农田',
    content: [
      '粮草是城市的另一条生命线。',
      '',
      '农田每秒产出粮草，等级越高产出越多。更重要的是——每次出征探险都会消耗粮草，所以保持充足的粮草储备非常重要。',
      '',
      '现在试试升级农田吧！',
    ],
    highlightTarget: { type: 'element', id: 'upgrade-farm-btn', label: '开垦农田' },
    trigger: {
      type: 'action_completed',
      requireCompletedStep: 'building_house',
      actionType: 'upgrade_building',
      actionTarget: 'farmLevel',
    },
    skippable: true,
    rewards: { food: 200 },
  },

  // ---- 酒馆招募 ----
  tavern_recruit: {
    id: 'tavern_recruit',
    phase: 'economy',
    order: 5,
    title: '酒馆招贤',
    content: [
      '一座城没有英雄，就像剑没有锋刃。',
      '',
      '在「门客」页面中，你可以通过酒馆招募英雄。每位英雄都有独特的属性、技能和定位：',
      '',
      '· 坦克 (铁山等) — 承受伤害，保护队友',
      '· 输出 (柳一刀、赵云等) — 造成大量伤害',
      '· 侧翼 (云娘等) — 灵活机动，切后排',
      '· 辅助/治疗 (华佗等) — 增益队友或恢复生命',
      '',
      '英雄分为 N(普通) / R(稀有) / SR(史诗) / SSR(传说) 四个品质，品质越高越稀有！',
      '',
      '去「门客」页面招募你的第一位英雄吧！',
    ],
    highlightTarget: { type: 'tab', id: 'heroes', label: '前往门客' },
    trigger: {
      type: 'action_completed',
      requireCompletedStep: 'building_farm',
      actionType: 'recruit_hero',
    },
    skippable: false,
    rewards: { bingxiang: 200 },
    unlockStoryChapter: 'act1_ch3',
  },

  // ---- 锻造装备 ----
  equip_forge: {
    id: 'equip_forge',
    phase: 'economy',
    order: 6,
    title: '兵甲坊锻造',
    content: [
      '光有英雄还不够，他们还需要精良的装备！',
      '',
      '在「兵甲坊」中，你可以消耗兵饷和铁锭来锻造装备：',
      '',
      '· 武器 — 提升英雄攻击力（铁刀、长枪、铁弓等）',
      '· 防具 — 提升英雄防御力（皮甲、锁子甲等）',
      '',
      '装备品质分为 普通/精良/史诗 三级。连续锻造会触发保底机制：',
      '· 连续5次普通 → 必出精良',
      '· 连续10次精良 → 必出史诗',
      '',
      '别忘了锻造完后给英雄装备上哦！',
    ],
    highlightTarget: { type: 'tab', id: 'forge', label: '前往兵甲坊' },
    trigger: {
      type: 'action_completed',
      requireCompletedStep: 'tavern_recruit',
      actionType: 'start_craft',
    },
    skippable: true,
    rewards: { iron: 50, bingxiang: 100 },
  },

  // ---- 出征探险 ----
  gate_expedition: {
    id: 'gate_expedition',
    phase: 'combat',
    order: 7,
    title: '城门出征',
    content: [
      '准备好了吗？是时候让世界知道镇武城的存在了！',
      '',
      '从「城门」出发，你可以选择不同的探险目的地：',
      '',
      '· 黑风山寨 (推荐Lv.1) — 适合新手的匪巢，1层',
      '· 遗弃铁矿 (推荐Lv.1) — 获取铁锭的好地方，3层',
      '· 前朝密库 (推荐Lv.3) — 危险但回报丰厚，5层',
      '· 前朝旧都 (推荐Lv.5) — 极度危险的终极挑战，7层',
      '',
      '探险采用战棋模式：在地图格子上前进，遇到战斗节点就开打，营地节点可以回复状态，军械库节点可以获得物资奖励。',
      '',
      '注意：每次出发会根据英雄数量消耗粮草！',
    ],
    highlightTarget: { type: 'tab', id: 'gate', label: '前往城门' },
    trigger: {
      type: 'action_completed',
      requireCompletedStep: 'equip_forge',
      actionType: 'begin_expedition',
    },
    skippable: false,
    rewards: { food: 150, iron: 30 },
    unlockStoryChapter: 'act1_ch4',
  },

  // ---- 战斗基础 ----
  battle_basics: {
    id: 'battle_basics',
    phase: 'combat',
    order: 8,
    title: '战斗指南',
    content: [
      '战斗是镇武城的核心体验之一！以下是战斗基础知识：',
      '',
      '【布阵】战斗采用 3×3 九宫格阵型：',
      '· 前排 — 承受更多伤害，适合坦克型英雄',
      '· 中排 — 均衡位置，适合输出型英雄',
      '· 后排 — 较安全，适合辅助和治疗',
      '',
      '【战斗模式】',
      '· 自动模式 — AI自动操作，适合日常刷本',
      '· 手动模式 — 你控制每个英雄的行动，挑战BOSS推荐使用',
      '',
      '【能量系统】手动模式下，英雄每回合获得20点能量。能量可用于释放技能(50点)或大招(100点)。防御+20能量，跳过+30能量。',
      '',
      '【兵卒系统】英雄可携带兵卒，每个兵卒提供1.5%减伤(上限70%)，但受伤时会消耗兵卒。',
    ],
    trigger: {
      type: 'action_completed',
      requireCompletedStep: 'gate_expedition',
      actionType: 'win_battle',
    },
    skippable: true,
    rewards: { iron: 80, bingxiang: 150 },
    unlockStoryChapter: 'act2_ch1',
  },

  // ---- 任务看板 ----
  quest_board: {
    id: 'quest_board',
    phase: 'advanced',
    order: 9,
    title: '任务看板',
    content: [
      '将军日理万机，怎能少了任务清单？',
      '',
      '点击右上角的任务图标(📋)打开任务看板：',
      '',
      '【每日任务】每天刷新6个，完成后领取奖励',
      '  例：屯积原木、扫荡周边、招兵买马……',
      '',
      '【每周任务】每周刷新2-3个，奖励更丰厚',
      '  例：深入腹地(到达第10层)、讨伐魁首(击败5个BOSS)',
      '',
      '注意：任务需要先手动接取才会开始追踪进度哦！',
    ],
    highlightTarget: { type: 'element', id: 'quest-board-btn', label: '任务看板' },
    trigger: {
      type: 'action_completed',
      requireCompletedStep: 'battle_basics',
      actionType: 'accept_quest',
    },
    skippable: true,
    rewards: { bingxiang: 300, food: 200 },
  },

  // ---- 成就系统 ----
  achievement_intro: {
    id: 'achievement_intro',
    phase: 'advanced',
    order: 10,
    title: '功勋簿',
    content: [
      '你的每一份努力都被铭记在功勋簿中！',
      '',
      '点击右上角的成就图标(🏆)查看成就列表：',
      '',
      '【成就分类】',
      '⚔️ 战斗 — 初露锋芒、斩将夺旗、百战名将……',
      '🎯 收集 — 聚贤纳士、群英荟萃、天下归心……',
      '🏔️ 挑战 — 初入深渊、深入腹地、绝境探险者……',
      '📈 成长 — 小有所成、身经百战、登峰造极……',
      '💰 经济 — 富甲一方、巧匠入门、神工天匠……',
      '',
      '还有隐藏成就等待你去发现！完成成就可获得丰厚奖励和专属称号。',
    ],
    highlightTarget: { type: 'element', id: 'achievement-btn', label: '功勋簿' },
    trigger: {
      type: 'manual',
      requireCompletedStep: 'quest_board',
    },
    skippable: true,
    rewards: { meteorite: 5, bingxiang: 200 },
  },

  // ---- 集市交易 ----
  market_trade: {
    id: 'market_trade',
    phase: 'advanced',
    order: 11,
    title: '集市调拨',
    content: [
      '资源多了用不完？缺某种关键资源？集市来帮你！',
      '',
      '在「集市」中进行资源交换：',
      '',
      '当前汇率：',
      '· 2 粮草 → 1 木材',
      '· 3 木材 → 1 铁锭',
      '· 4 粮草 → 1 兵饷',
      '· 2 兵饷 → 1 铁锭',
      '',
      '提示：升级集市可以提高交易收益！每级增加8%的额外收益。',
    ],
    highlightTarget: { type: 'tab', id: 'market', label: '前往集市' },
    trigger: {
      type: 'action_completed',
      requireCompletedStep: 'achievement_intro',
      actionType: 'trade_resource',
    },
    skippable: true,
  },

  // ---- 医馆治疗 ----
  hospital_heal: {
    id: 'hospital_heal',
    phase: 'advanced',
    order: 12,
    title: '医馆疗伤',
    content: [
      '战斗难免伤亡，医馆是英雄们的避风港。',
      '',
      '在「医馆」中你可以：',
      '',
      '· 全体治疗 — 消耗粮草为全体英雄恢复HP',
      '· 单体治疗 — 针对单个英雄进行精确治疗',
      '· 救治伤兵 — 将伤兵转化为可用兵力',
      '',
      '伤兵会随时间缓慢自然恢复（每秒2%），但医馆可以大幅加速这个过程。升级医馆还可以获得治疗折扣！',
      '',
      '记住：保持英雄的健康状态是持续作战的关键。',
    ],
    highlightTarget: { type: 'tab', id: 'hospital', label: '前往医馆' },
    trigger: {
      type: 'manual',
      requireCompletedStep: 'market_trade',
    },
    skippable: true,
    rewards: { food: 100 },
  },

  // ---- 小贴士 ----
  tips_daily: {
    id: 'tips_daily',
    phase: 'advanced',
    order: 13,
    title: '城主小贴士',
    content: [
      '恭喜你完成了基础引导！以下是一些进阶建议：',
      '',
      '【离线收益】关闭游戏超过10分钟后再次打开，可以领取离线期间积累的兵饷（最多12小时）',
      '',
      '【保底机制】酒馆招募10连抽必得R级以上英雄，50连抽必得SR级英雄',
      '',
      '【放置收益】资源会随着时间自动增长，即使不在线也在产出',
      '',
      '【核心循环】建筑升级 → 资源产出 → 英雄培养 → 废墟探险 → 资源奖励 → 继续升级',
      '',
      '【剧情推进】达成特定里程碑后会自动解锁新的剧情章节，别忘了阅读！',
      '',
      '祝你统治之路顺利，镇武城主！',
    ],
    trigger: {
      type: 'manual',
      requireCompletedStep: 'hospital_heal',
    },
    skippable: true,
    rewards: { bingxiang: 500, iron: 200, food: 300, wood: 200, meteorite: 10 },
    unlockStoryChapter: 'act2_ch2',
  },
};

/** 按阶段分组的步骤 */
export const TUTORIAL_PHASES = {
  basics: { name: '基础认知', icon: '📖', steps: ['welcome', 'ui_overview', 'resources_basic'] as TutorialStepId[] },
  economy: { name: '经济运营', icon: '💰', steps: ['building_house', 'building_farm', 'tavern_recruit', 'equip_forge'] as TutorialStepId[] },
  combat: { name: '战斗探险', icon: '⚔️', steps: ['gate_expedition', 'battle_basics'] as TutorialStepId[] },
  advanced: { name: '进阶技巧', icon: '🎯', steps: ['quest_board', 'achievement_intro', 'market_trade', 'hospital_heal', 'tips_daily'] as TutorialStepId[] },
};

/** 获取下一步应该显示的教程步骤 */
export function getNextTutorialStep(state: TutorialState): TutorialStep | null {
  if (state.skipTutorial) return null;

  // 找到第一个未完成的步骤
  const orderedSteps = Object.values(TUTORIAL_STEPS).sort((a, b) => a.order - b.order);
  for (const step of orderedSteps) {
    if (!state.completedSteps.includes(step.id)) {
      // 检查前置条件
      if (step.trigger.requireCompletedStep && !state.completedSteps.includes(step.trigger.requireCompletedStep)) {
        continue;
      }
      return step;
    }
  }
  return null;
}

/** 初始化引导状态 */
export function createInitialTutorialState(): TutorialState {
  return {
    completedSteps: [],
    currentStep: 'welcome',
    isTutorialActive: true,
    skipTutorial: false,
    lastShownTime: 0,
  };
}
