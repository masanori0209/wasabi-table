#!/usr/bin/env node
/**
 * [DEBUG] タグ付きログを安全に削除する
 * Rust: 単行 web_sys::console 呼び出しのみ削除（複数行 format! は触らない）
 */
import fs from 'fs';
import path from 'path';

const root = path.resolve(import.meta.dirname, '..');

function stripTypeScript(content) {
  const lines = content.split('\n');
  const result = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const isDebugConsole =
      /console\.(log|warn|debug|info)\s*\(/.test(line) &&
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
