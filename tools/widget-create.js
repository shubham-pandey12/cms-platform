/**
 * Scaffolds a new widget folder under widgets/widget-<slug>/ with index.tsx and Definition.cs.
 * Usage: node tools/widget-create.js <slug> [brand-folder]
 * Examples:
 *   node tools/widget-create.js my-widget           -> widgets/widget-my-widget/
 *   node tools/widget-create.js my-widget travel-center -> widgets/travel-center/widget-my-widget/
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const slugArg = process.argv[2];
const brandArg = process.argv[3];
if (!slugArg || slugArg.startsWith('-')) {
  console.error('Usage: node tools/widget-create.js <slug> [brand-folder]');
  console.error('Example: node tools/widget-create.js my-widget');
  console.error('Example: node tools/widget-create.js my-widget travel-center');
  process.exit(1);
}

const kebab = slugArg.replace(/^widget-/, '').replace(/[^a-z0-9-]/gi, '').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase();
if (!kebab) {
  console.error('Slug must be kebab-case (letters, numbers, hyphens).');
  process.exit(1);
}

const slug = kebab === 'widget' ? 'widget-widget' : kebab.startsWith('widget-') ? kebab : `widget-${kebab}`;
const repoRoot = path.resolve(__dirname, '..');
const widgetsRoot = path.join(repoRoot, 'widgets');

let brandSegment = '';
if (brandArg && !brandArg.startsWith('-')) {
  brandSegment = brandArg
    .replace(/[^a-z0-9-]/gi, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  if (!brandSegment) {
    console.error('Brand folder must be non-empty kebab-case (letters, numbers, hyphens).');
    process.exit(1);
  }
}

const widgetDir = brandSegment
  ? path.join(widgetsRoot, brandSegment, slug)
  : path.join(widgetsRoot, slug);

if (fs.existsSync(widgetDir)) {
  console.error(`Widget folder already exists: ${widgetDir}`);
  process.exit(1);
}

const id = require('crypto').randomUUID();
const namePart = slug.replace(/^widget-/, '') || 'widget';
const pascalName = namePart.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');

fs.mkdirSync(widgetDir, { recursive: true });

const rendererName = `Widget${pascalName}Renderer`;

const indexTsx = `'use client';

import React from 'react';
import type { CustomRenderer } from '@/types/renderTemplate';

const ${rendererName}: CustomRenderer = ({ config, styles, theme }) => (
  <div
    style={{
      padding: '16px',
      backgroundColor: (styles?.backgroundColor as string) || theme.colors.background,
      color: theme.colors.text,
      borderRadius: '8px',
    }}
  >
    {(config?.message as string) || '${slug}'}
  </div>
);

export default ${rendererName};
`;

const definitionCs = `using System.Text.Json;
using Cms.Domain.Entities;
using Cms.Domain.Enums;
using Cms.Domain.Interfaces;

namespace Cms.Widgets;

/// <summary>
/// Widget definition for ${slug}. Discovered at runtime by the seeder.
/// </summary>
public sealed class ${pascalName}WidgetDefinition : IWidgetDefinitionProvider
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    public WidgetDefinition GetDefinition() => new()
    {
        Id = Guid.Parse("${id}"),
        Slug = "${slug}",
        Name = "${slug.replace('widget-', '').replace(/-/g, ' ').replace(/\\b\\w/g, c => c.toUpperCase())}",
        Category = WidgetCategory.Content,
        Description = "Widget ${slug}",
        Icon = "square",
        Version = "1.0.0",
        IsAdvanced = false,
        ConfigSchema = JsonSerializer.Serialize(new { fields = new object[] { } }, JsonOptions),
        DefaultConfig = "{}",
        CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
        UpdatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
    };
}
`;

fs.writeFileSync(path.join(widgetDir, 'index.tsx'), indexTsx);
fs.writeFileSync(path.join(widgetDir, 'Definition.cs'), definitionCs);

console.log(`Created ${widgetDir}`);
console.log('  - index.tsx   (React component)');
console.log('  - Definition.cs (backend widget definition)');
console.log('');

const validateScriptPath = path.join(repoRoot, 'tools', 'widget-validate.js');
const validateResult = spawnSync(process.execPath, [validateScriptPath], {
  cwd: repoRoot,
  stdio: 'inherit',
});

if (validateResult.status !== 0) {
  process.exit(validateResult.status || 1);
}

console.log('Widget scaffold validated successfully.');
console.log('No other files need to be touched. Run npm run dev to see the widget in the library.');
