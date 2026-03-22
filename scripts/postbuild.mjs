/**
 * postbuild: 混淆 dist/ 裡的靜態資源目錄名和檔名
 * 所有檔案平放到 dist/assets/ 下，原始碼保持可讀
 */
import { readdirSync, renameSync, readFileSync, writeFileSync, existsSync, rmSync } from 'fs'
import { join, extname } from 'path'
import { createHash } from 'crypto'

const DIST = 'dist'
const ASSETS = join(DIST, 'assets')

function hash(name) {
  return createHash('md5').update(name).digest('hex').slice(0, 8)
}

const fileMap = {} // 舊路徑片段 → 新路徑片段

for (const dir of ['spine', 'symbols']) {
  const src = join(DIST, dir)
  if (!existsSync(src)) continue

  for (const file of readdirSync(src)) {
    const ext = extname(file)
    const hashedFile = hash(`${dir}/${file}`) + ext
    const oldPath = `${dir}/${file}`
    const newPath = `assets/${hashedFile}`
    fileMap[oldPath] = newPath
    renameSync(join(src, file), join(ASSETS, hashedFile))
  }

  rmSync(src, { recursive: true })
}

// atlas 內部引用 png 檔名
for (const [, newPath] of Object.entries(fileMap)) {
  if (!newPath.endsWith('.atlas')) continue
  const file = join(DIST, newPath)
  let content = readFileSync(file, 'utf-8')
  for (const [op, np] of Object.entries(fileMap)) {
    const oldFile = op.split('/').pop()
    const newFile = np.split('/').pop()
    content = content.replaceAll(oldFile, newFile)
  }
  writeFileSync(file, content)
}

// spritesheet json 內部引用 png 檔名
for (const [, newPath] of Object.entries(fileMap)) {
  if (!newPath.endsWith('.json')) continue
  const file = join(DIST, newPath)
  let content = readFileSync(file, 'utf-8')
  for (const [op, np] of Object.entries(fileMap)) {
    const oldFile = op.split('/').pop()
    const newFile = np.split('/').pop()
    content = content.replaceAll(oldFile, newFile)
  }
  writeFileSync(file, content)
}

// 更新 JS/HTML 裡的路徑引用
function updateRefs(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) { updateRefs(full); continue }
    if (!/\.(js|html|css)$/.test(entry.name)) continue
    let content = readFileSync(full, 'utf-8')
    let changed = false
    for (const [oldPath, newPath] of Object.entries(fileMap)) {
      if (content.includes(oldPath)) {
        content = content.replaceAll(oldPath, newPath)
        changed = true
      }
    }
    if (changed) writeFileSync(full, content)
  }
}

updateRefs(DIST)

console.log('[postbuild] Obfuscated:')
for (const [old, neu] of Object.entries(fileMap)) {
  console.log(`  ${old} → ${neu}`)
}
