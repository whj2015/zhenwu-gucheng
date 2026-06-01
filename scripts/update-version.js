#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VERSION_FILE = path.join(__dirname, '../src/version.ts');
const PACKAGE_FILE = path.join(__dirname, '../package.json');

function getCurrentVersion() {
  const versionContent = fs.readFileSync(VERSION_FILE, 'utf-8');
  const match = versionContent.match(/export const CURRENT_VERSION = '([^']+)'/);
  return match ? match[1] : '0.0.0';
}

function incrementVersion(version, type = 'patch') {
  const parts = version.split('.').map(Number);

  switch (type) {
    case 'major':
      parts[0] += 1;
      parts[1] = 0;
      parts[2] = 0;
      break;
    case 'minor':
      parts[1] += 1;
      parts[2] = 0;
      break;
    case 'patch':
    default:
      parts[2] += 1;
      break;
  }

  return parts.join('.');
}

function getTodayDate() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

function updateVersionFile(newVersion, changes, type) {
  let content = fs.readFileSync(VERSION_FILE, 'utf-8');

  content = content.replace(
    /export const CURRENT_VERSION = '[^']+'/,
    `export const CURRENT_VERSION = '${newVersion}'`
  );

  const newEntry = `  {
    version: '${newVersion}',
    date: '${getTodayDate()}',
    type: '${type}',
    changes: [
${changes.map(c => `      '${c}'`).join(',\n')}
    ]
  }`;

  content = content.replace(
    /export const CHANGELOG: VersionInfo\[\] = \[/,
    `export const CHANGELOG: VersionInfo[] = [\n${newEntry},`
  );

  fs.writeFileSync(VERSION_FILE, content, 'utf-8');
  console.log(`✅ Updated version.ts to ${newVersion}`);
}

function updatePackageJson(newVersion) {
  const pkg = JSON.parse(fs.readFileSync(PACKAGE_FILE, 'utf-8'));
  pkg.version = newVersion;
  fs.writeFileSync(PACKAGE_FILE, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
  console.log(`✅ Updated package.json to ${newVersion}`);
}

const args = process.argv.slice(2);
const type = args.includes('--major') ? 'major' : args.includes('--minor') ? 'minor' : 'patch';
const messageIndex = args.findIndex(arg => !arg.startsWith('--'));
const message = messageIndex !== -1 ? args.slice(messageIndex).join(' ') : '版本更新';

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
用法: node scripts/update-version.js [选项] [变更描述]

选项:
  --major     主版本号升级 (x.0.0)
  --minor     次版本号升级 (x.y.0)
  --patch     补丁版本号升级 (默认) (x.y.z)
  --help      显示帮助信息

示例:
  node scripts/update-version.js "修复了登录问题"
  node scripts/update-version.js --minor "新增用户系统"
  node scripts/update-version.js --major "重大架构重构"
`);
  process.exit(0);
}

const currentVersion = getCurrentVersion();
const newVersion = incrementVersion(currentVersion, type);
const changes = [message];

console.log(`\n📦 版本更新: ${currentVersion} → ${newVersion} (${type})\n`);

updateVersionFile(newVersion, changes, type);
updatePackageJson(newVersion);

console.log(`\n🎉 版本更新完成！当前版本: ${newVersion}\n`);
