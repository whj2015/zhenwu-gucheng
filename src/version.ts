export interface VersionInfo {
  version: string;
  date: string;
  changes: string[];
  type: 'major' | 'minor' | 'patch';
}

export const CURRENT_VERSION = '0.2.1';

export const CHANGELOG: VersionInfo[] = [
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
