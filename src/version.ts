export interface VersionInfo {
  version: string;
  date: string;
  changes: string[];
  type: 'major' | 'minor' | 'patch';
}

export const CURRENT_VERSION = '0.2.0';

export const CHANGELOG: VersionInfo[] = [
  {
    version: '0.2.0',
    date: '2026-05-30',
    type: 'minor',
    changes: [
      '🐛 修复战斗结算页攻击记录不显示的问题（正则表达式适配中文日志格式）',
      '📱 重构战斗结算页面布局，支持移动端和PC端完整显示',
      '🎯 战斗日志区域添加高度限制，避免撑开布局',
      '🔧 酒馆招募页面响应式优化，修复特定屏幕下按钮被遮挡问题',
      '✨ 支持技能追击、偃月溅射等特殊攻击记录的解析与显示'
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
