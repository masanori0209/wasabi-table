#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, '..', 'dist');

/**
 * .jsファイル内の相対インポートに.js拡張子を追加
 */
function fixImportsInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // 相対インポートのパターンを検索して.js拡張子を追加
  const fixedContent = content
    .replace(/from ['"](\.\/.+?)['"];/g, (match, importPath) => {
      if (!importPath.endsWith('.js')) {
        return match.replace(importPath, importPath + '.js');
      }
      return match;
    })
    .replace(/import\(['"](\.\/.+?)['"]\)/g, (match, importPath) => {
      if (!importPath.endsWith('.js')) {
        return match.replace(importPath, importPath + '.js');
      }
      return match;
    });

  if (content !== fixedContent) {
    fs.writeFileSync(filePath, fixedContent, 'utf8');
    console.log(`✅ Fixed imports in: ${path.relative(process.cwd(), filePath)}`);
  }
}

/**
 * ディレクトリ内のすべての.jsファイルを処理
 */
function fixImportsInDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      fixImportsInDirectory(filePath);
    } else if (file.endsWith('.js')) {
      fixImportsInFile(filePath);
    }
  }
}

// メイン処理
if (fs.existsSync(distDir)) {
  console.log('🔧 Fixing ES Module imports...');
  fixImportsInDirectory(distDir);
  console.log('✅ Import fixing completed!');
} else {
  console.log('❌ dist directory not found');
  process.exit(1);
} 