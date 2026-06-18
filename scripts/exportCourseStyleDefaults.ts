/**
 * Writes mmcms/data/course-style-defaults.json from site merge helpers.
 * Run: pnpm exec tsx scripts/exportCourseStyleDefaults.ts (from mmwebsite/)
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { COURSE_STYLE_MARKETING_ROUTE_PATHS } from '../lib/marketingPages/courseStyleMarketingRoutes'
import { getTrainingCourseSiteDefaults } from '../lib/marketingPages/trainingCourseLegacyDefaults'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const outPath = join(scriptDir, '../../mmcms/data/course-style-defaults.json')

const out: Record<string, ReturnType<typeof getTrainingCourseSiteDefaults>> = {}
for (const routePath of COURSE_STYLE_MARKETING_ROUTE_PATHS) {
  out[routePath] = getTrainingCourseSiteDefaults(routePath)
}

mkdirSync(dirname(outPath), { recursive: true })
writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`, 'utf8')
console.log(`Wrote ${Object.keys(out).length} routes to ${outPath}`)
