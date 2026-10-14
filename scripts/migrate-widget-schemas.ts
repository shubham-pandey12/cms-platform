// @ts-nocheck
// One-off codemod: rewrites legacy `shouldHideField` implicit conditions into explicit
// `hiddenIfFieldHasValue` declarations in widget.json schema files.
//
// Run from the repo root:
//   npx ts-node scripts/migrate-widget-schemas.ts
//   # or with tsx:
//   npx tsx scripts/migrate-widget-schemas.ts
//
// What it does:
//   - Scans widgets/**/widget.json and versioned widget schemas under widgets/**/vX/widget.json
//   - For each field that matches the old shouldHideField rules, adds hiddenIfFieldHasValue
//   - Writes files back in-place (creates .bak backups)
//   - Dry-run mode: pass --dry to preview changes without writing

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const DRY = process.argv.includes('--dry');

// Matches the shouldHideField rules from the old PropertiesContentTab
const LEGACY_RULES: Record<string, string> = {
  packages: 'apiEndpoint',
  images: 'apiEndpoint',
  features: 'apiEndpoint',
  slides: 'apiEndpoint',
  questions: 'apiEndpoint',
  holidayTypes: 'holidayTypesApiEndpoint',
  destinations: 'destinationsApiEndpoint',
  importantLinks: 'importantLinksApiEndpoint',
  destinationsItems: 'destinationsApiEndpoint',
  holidayTypesItems: 'holidayTypesApiEndpoint',
};

interface FieldShape {
  name: string;
  hiddenIfFieldHasValue?: string;
  visibleWhen?: unknown;
  [key: string]: unknown;
}

interface SchemaShape {
  fields?: FieldShape[];
  [key: string]: unknown;
}

let totalFiles = 0;
let modifiedFiles = 0;

async function run() {
  const widgetDir = path.join(process.cwd(), 'widgets');
  const patterns = [
    `${widgetDir}/**/widget.json`,
    `${widgetDir}/**/v*/widget.json`,
  ];

  const files: string[] = [];
  for (const pattern of patterns) {
    const matches = await glob(pattern.replace(/\\/g, '/'));
    files.push(...matches);
  }

  // Deduplicate
  const unique = [...new Set(files)];
  totalFiles = unique.length;

  for (const file of unique) {
    let raw: string;
    try {
      raw = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }

    let schema: SchemaShape;
    try {
      schema = JSON.parse(raw) as SchemaShape;
    } catch {
      console.warn(`  SKIP (invalid JSON): ${file}`);
      continue;
    }

    if (!schema.fields || !Array.isArray(schema.fields)) continue;

    let changed = false;
    for (const field of schema.fields) {
      const rule = LEGACY_RULES[field.name];
      if (rule && !field.hiddenIfFieldHasValue && !field.visibleWhen) {
        field.hiddenIfFieldHasValue = rule;
        changed = true;
        console.log(`  + ${field.name}.hiddenIfFieldHasValue = "${rule}"  in  ${file}`);
      }
    }

    if (!changed) continue;

    modifiedFiles++;
    const pretty = JSON.stringify(schema, null, 2);

    if (DRY) {
      console.log(`  [DRY] Would write: ${file}`);
    } else {
      fs.writeFileSync(`${file}.bak`, raw);
      fs.writeFileSync(file, pretty);
    }
  }

  console.log(`\nDone. Scanned ${totalFiles} file(s), modified ${modifiedFiles}.`);
  if (DRY) console.log('  (dry-run — no files were written)');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
