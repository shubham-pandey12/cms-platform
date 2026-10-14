#!/usr/bin/env node
/**
 * Validates widget folder contract:
 * - widgets/widget-<slug>/v<n>/Definition.cs exists for each version (or under widgets/<brand>/)
 * - widgets/widget-<slug>/v<n>/index.tsx exists for each version
 * - Definition.cs Slug matches folder name
 * - Widget version Id is globally unique
 * - Renderer file has a default export
 * - Icon is a valid Lucide kebab-case name
 */

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const widgetsRoot = path.join(repoRoot, 'widgets');
const dynamicIconImportsPath = path.join(
  repoRoot,
  'frontend',
  'node_modules',
  'lucide-react',
  'dynamicIconImports.js'
);

const errors = [];
const infos = [];
const seenSlugs = new Map();
const seenIds = new Map();
const legacyIconAliases = new Set([
  'grid',
  'columns',
  'rows',
  'help-circle',
  'edit',
  'sort-asc',
  'sort-desc',
  'home',
  'unlock',
  'bar-chart',
  'pie-chart',
  'tree',
  'train',
]);

const slugRegex = /Slug\s*(?:=>|=)\s*"([^"]+)"/;
const idRegex = /Id:\s*Guid\.Parse\("([0-9a-fA-F-]+)"\)/;
const iconRegex = /Icon:\s*"([^"]+)"/;
const defaultExportRegex = /\bexport\s+default\b/;
const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const versionFolderRegex = /^v\d+$/;

function collectRegisteredIcons() {
  if (!fs.existsSync(dynamicIconImportsPath)) {
    errors.push(
      `Missing Lucide icon catalog: ${dynamicIconImportsPath}. Run "npm install" in frontend first.`
    );
    return new Set(legacyIconAliases);
  }

  try {
    const dynamicImportsModule = require(dynamicIconImportsPath);
    const dynamicIconImports = dynamicImportsModule.default ?? dynamicImportsModule;
    if (!dynamicIconImports || typeof dynamicIconImports !== 'object') {
      errors.push(`Invalid Lucide icon catalog export in ${dynamicIconImportsPath}`);
      return new Set(legacyIconAliases);
    }

    return new Set([
      ...Object.keys(dynamicIconImports),
      ...legacyIconAliases,
    ]);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    errors.push(
      `Failed to load Lucide icon catalog from ${dynamicIconImportsPath}: ${errorMessage}`
    );
    return new Set(legacyIconAliases);
  }
}

/**
 * @param {string} brandSegment - '' for widgets/widget-*, or e.g. 'travel-center' for widgets/travel-center/widget-*
 */
function validateWidgetVersion(widgetFolderName, versionFolder, registeredIcons, brandSegment) {
  const versionPath = path.join(widgetsRoot, brandSegment, widgetFolderName, versionFolder);
  const definitionPath = path.join(versionPath, 'Definition.cs');
  const rendererPath = path.join(versionPath, 'index.tsx');
  const versionLabel = brandSegment
    ? `${brandSegment}/${widgetFolderName}/${versionFolder}`
    : `${widgetFolderName}/${versionFolder}`;

  if (!fs.existsSync(definitionPath)) {
    errors.push(`[${versionLabel}] Missing required file: Definition.cs`);
  }

  if (!fs.existsSync(rendererPath)) {
    errors.push(`[${versionLabel}] Missing required file: index.tsx`);
  }

  if (!fs.existsSync(definitionPath) || !fs.existsSync(rendererPath)) {
    return false;
  }

  const definitionContent = fs.readFileSync(definitionPath, 'utf8');
  const rendererContent = fs.readFileSync(rendererPath, 'utf8');

  const slugMatch = definitionContent.match(slugRegex);
  if (!slugMatch) {
    errors.push(`[${versionLabel}] Could not find Slug in Definition.cs`);
  } else {
    const slug = slugMatch[1];
    if (slug !== widgetFolderName) {
      errors.push(
        `[${versionLabel}] Slug mismatch. Folder is "${widgetFolderName}" but Definition.cs has "${slug}".`
      );
    }
    if (!slug.startsWith('widget-')) {
      errors.push(`[${versionLabel}] Slug "${slug}" must start with "widget-".`);
    }
    if (!seenSlugs.has(slug)) {
      const location = brandSegment ? `${brandSegment}/${widgetFolderName}` : widgetFolderName;
      seenSlugs.set(slug, location);
    }
  }

  const idMatch = definitionContent.match(idRegex);
  if (!idMatch) {
    errors.push(`[${versionLabel}] Could not find Id: Guid.Parse(\"...\") in Definition.cs`);
  } else {
    const id = idMatch[1].toLowerCase();
    if (!uuidRegex.test(id)) {
      errors.push(`[${versionLabel}] Id "${id}" is not a valid UUID.`);
    }
    if (seenIds.has(id)) {
      errors.push(`[${versionLabel}] Duplicate Id "${id}" also used in "${seenIds.get(id)}".`);
    } else {
      seenIds.set(id, versionLabel);
    }
  }

  const iconMatch = definitionContent.match(iconRegex);
  if (!iconMatch) {
    errors.push(`[${versionLabel}] Could not find Icon: \"...\" in Definition.cs`);
  } else {
    const iconName = iconMatch[1];
    if (!registeredIcons.has(iconName)) {
      errors.push(
        `[${versionLabel}] Icon "${iconName}" is not a valid Lucide icon key (kebab-case).`
      );
    }
  }

  const categoryRegex = /Category:\s*WidgetCategory\.(\w+)/;
  const allowedWidgetCategories = new Set(['Layout', 'Content', 'Media', 'Interactive', 'Navigation']);
  const categoryMatch = definitionContent.match(categoryRegex);
  if (!categoryMatch) {
    errors.push(
      `[${versionLabel}] Could not find Category: WidgetCategory.<Name> in Definition.cs (must match backend WidgetCategory enum).`
    );
  } else {
    const categoryName = categoryMatch[1];
    if (!allowedWidgetCategories.has(categoryName)) {
      errors.push(
        `[${versionLabel}] Category WidgetCategory.${categoryName} is invalid. Use one of: ${[...allowedWidgetCategories].join(', ')}.`
      );
    }
  }

  if (!defaultExportRegex.test(rendererContent)) {
    errors.push(`[${versionLabel}] Renderer must contain a default export in index.tsx`);
  }

  return true;
}

function validateWidgetFolder(widgetFolderName, registeredIcons, brandSegment) {
  const widgetPath = path.join(widgetsRoot, brandSegment, widgetFolderName);

  const versionFolders = fs
    .readdirSync(widgetPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && versionFolderRegex.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => {
      const numA = parseInt(a.slice(1), 10);
      const numB = parseInt(b.slice(1), 10);
      return numA - numB;
    });

  if (versionFolders.length === 0) {
    const label = brandSegment ? `${brandSegment}/${widgetFolderName}` : widgetFolderName;
    errors.push(`[${label}] No version folders (v1, v2, ...) found`);
    return;
  }

  let validVersions = 0;
  versionFolders.forEach((versionFolder) => {
    if (validateWidgetVersion(widgetFolderName, versionFolder, registeredIcons, brandSegment)) {
      validVersions++;
    }
  });

  if (validVersions > 0) {
    const display = brandSegment ? `${brandSegment}/${widgetFolderName}` : widgetFolderName;
    infos.push(`${display} (${validVersions} version(s))`);
  }
}

function run() {
  if (!fs.existsSync(widgetsRoot)) {
    errors.push(`Widgets root not found: ${widgetsRoot}`);
  } else {
    const topLevelDirs = fs
      .readdirSync(widgetsRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'));

    const flatWidgetFolders = topLevelDirs
      .filter((entry) => entry.name.startsWith('widget-'))
      .map((entry) => entry.name)
      .sort((first, second) => first.localeCompare(second));

    /** Brand folders: any top-level dir that is not widget-* may contain nested widget-* */
    let nestedWidgetCount = 0;
    const registeredIcons = collectRegisteredIcons();
    flatWidgetFolders.forEach((folder) => validateWidgetFolder(folder, registeredIcons, ''));

    for (const entry of topLevelDirs) {
      if (entry.name.startsWith('widget-')) {
        continue;
      }
      const brandPath = path.join(widgetsRoot, entry.name);
      const nestedWidgetFolders = fs
        .readdirSync(brandPath, { withFileTypes: true })
        .filter((e) => e.isDirectory() && e.name.startsWith('widget-'))
        .map((e) => e.name)
        .sort((first, second) => first.localeCompare(second));
      nestedWidgetCount += nestedWidgetFolders.length;
      nestedWidgetFolders.forEach((folder) =>
        validateWidgetFolder(folder, registeredIcons, entry.name)
      );
    }

    if (flatWidgetFolders.length === 0 && nestedWidgetCount === 0) {
      errors.push(
        `No widget folders found under ${widgetsRoot} (widgets/widget-*/ or widgets/<brand>/widget-*/)`
      );
    }
  }

  if (errors.length > 0) {
    console.error('');
    console.error('Widget validation failed:');
    errors.forEach((message) => console.error(` - ${message}`));
    console.error('');
    process.exit(1);
  }

  console.log(`Widget validation passed for ${infos.length} widget folder(s).`);
}

run();
