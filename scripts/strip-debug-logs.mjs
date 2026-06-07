#!/usr/bin/env node
/**
 * [DEBUG] タグ付きログを安全に削除する
 * --dist: dist/*.js のみ処理（公開ビルド用、ソースは変更しない）
 * デフォルト: src ファイルを処理（開発用・手動実行）
 */
import fs from 'fs';
import path from 'path';

const root = path.resolve(import.meta.dirname, '..');
const distMode = process.argv.includes('--dist');

function stripTypeScript(content) {
  const lines = content.split('\n');
  const result = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const isDebugConsole =
      /console\.(log|warn|debug|info|error)\s*\(/.test(line) &&
      (/\[DEBUG\]/.test(line) || /🔧|🎯|🖱️|⌨️|📝|✅|❌|🔀|📋|🔄|🈴|⬅️|➡️|🗑️|✏️|🔍|🚫/.test(line));

    if (isDebugConsole) {
      let depth = 0;
      let started = false;
      let j = i;
      for (; j < lines.length; j++) {
        for (const ch of lines[j]) {
          if (ch === '(') {
            depth++;
            started = true;
          } else if (ch === ')') {
            depth--;
          }
        }
        if (started && depth <= 0) break;
      }
      i = j + 1;
      continue;
    }

    result.push(line);
    i++;
  }

  return result.join('\n').replace(/\n{3,}/g, '\n\n');
}

function stripRust(content) {
  return content
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed.startsWith('web_sys::console::')) return true;
      if (trimmed.includes('[DEBUG]')) return false;
      if (/log_1\(&format!\("[🔧🎯🖱️⌨️📝✅❌🔀📋🔄🈴⬅️➡️🗑️✏️🔍🚫💾]/.test(trimmed)) return false;
      return true;
    })
    .join('\n');
}

if (distMode) {
  const distDir = path.join(root, 'dist');
  for (const name of fs.readdirSync(distDir)) {
    if (!name.endsWith('.js')) continue;
    const full = path.join(distDir, name);
    const before = fs.readFileSync(full, 'utf8');
    const after = stripTypeScript(before);
    fs.writeFileSync(full, after);
    console.log(`dist/${name}: ${before.split('\n').length - after.split('\n').length} lines removed`);
  }
} else {
  const targets = [
    { file: 'src-ts/index.ts', fn: stripTypeScript },
    { file: 'src-ts/listeners.ts', fn: stripTypeScript },
    { file: 'src/table.rs', fn: stripRust },
    { file: 'src/edit.rs', fn: stripRust },
  ];

  for (const { file, fn } of targets) {
    const full = path.join(root, file);
    const before = fs.readFileSync(full, 'utf8');
    const after = fn(before);
    fs.writeFileSync(full, after);
    console.log(`${file}: ${before.split('\n').length - after.split('\n').length} lines removed`);
  }
}
