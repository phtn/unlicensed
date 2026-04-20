import {readdirSync, readFileSync} from 'node:fs'
import {join, relative} from 'node:path'
import {isVersionedStorageKey} from '../lib/storage-keys'

const ROOT = process.cwd()
const SOURCE_DIRS = ['app', 'components', 'hooks', 'lib', 'server']
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx'])

type Finding = {
  category: 'bundle' | 'client-storage'
  file: string
  line: number
  message: string
}

const getSourceFiles = (cwd: string, dir: string): string[] => {
  const absoluteDir = join(cwd, dir)
  const entries = readdirSync(absoluteDir, {withFileTypes: true})
  const files: string[] = []

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue
    const absolutePath = join(absoluteDir, entry.name)

    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue
      files.push(...getSourceFiles(cwd, join(dir, entry.name)))
      continue
    }

    if (!entry.isFile()) continue

    const extension = entry.name.slice(entry.name.lastIndexOf('.'))
    if (SOURCE_EXTENSIONS.has(extension)) {
      files.push(absolutePath)
    }
  }

  return files
}

const getLineNumber = (content: string, index: number) =>
  content.slice(0, index).split('\n').length

const findings: Finding[] = []
const files = SOURCE_DIRS.flatMap((dir) => getSourceFiles(ROOT, dir))

for (const file of files) {
  const content = readFileSync(file, 'utf8')

  for (const match of content.matchAll(/lucide-react/g)) {
    findings.push({
      category: 'bundle',
      file: relative(ROOT, file),
      line: getLineNumber(content, match.index ?? 0),
      message: 'Found lucide-react import or reference.',
    })
  }

  const localStorageCallPattern =
    /(?:window\.)?localStorage\.(?:getItem|setItem|removeItem)\((['"`])([^'"`]+)\1/g

  for (const match of content.matchAll(localStorageCallPattern)) {
    const key = match[2]
    if (isVersionedStorageKey(key)) continue

    findings.push({
      category: 'client-storage',
      file: relative(ROOT, file),
      line: getLineNumber(content, match.index ?? 0),
      message: `Unversioned localStorage key literal "${key}".`,
    })
  }
}

const bundleFindings = findings.filter((finding) => finding.category === 'bundle')
const clientStorageFindings = findings.filter(
  (finding) => finding.category === 'client-storage',
)

const categories = [
  {
    label: 'Bundle Size Optimization',
    score: bundleFindings.length === 0 ? 100 : 0,
    findings: bundleFindings,
  },
  {
    label: 'Client-Side Data Fetching',
    score: clientStorageFindings.length === 0 ? 100 : 0,
    findings: clientStorageFindings,
  },
]

const overallScore =
  categories.reduce((sum, category) => sum + category.score, 0) /
  categories.length

console.log('React Best Practices Audit')
console.log(`Date: ${new Date().toISOString()}`)
console.log('')

for (const category of categories) {
  const status = category.score === 100 ? 'PASS' : 'FAIL'
  console.log(`${category.label}: ${category.score}/100 (${status})`)
  for (const finding of category.findings) {
    console.log(
      `  - ${finding.file}:${finding.line} ${finding.message}`,
    )
  }
}

console.log('')
console.log(`Overall Score: ${overallScore}/100`)

if (overallScore !== 100) {
  process.exit(1)
}
