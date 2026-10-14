/**
 * Safe Variable Replacement Utility
 * 
 * Provides secure variable replacement that prevents injection attacks
 * by properly escaping special characters and using specific patterns.
 */

/**
 * Escape special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Validate variable name to ensure it's safe
 */
function validateVariableName(name: string): boolean {
  // Only allow alphanumeric, underscore, and hyphen
  // Must start with letter or underscore
  return /^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(name);
}

/**
 * Safely replace variables in a string
 * Uses a single optimized regex pattern for better performance with many variables
 * 
 * @param template - The template string containing {{variable}} placeholders
 * @param variables - Array of variables with name and value
 * @param options - Options for replacement behavior
 * @returns The string with variables replaced
 */
export function replaceVariables(
  template: string,
  variables: Array<{ name: string; value: string }>,
  options?: { urlEncode?: boolean }
): string {
  if (!template || typeof template !== 'string' || !variables || variables.length === 0) {
    return template;
  }

  // Filter and validate variables, build replacement map
  const replacementMap = new Map<string, string>();
  const validVariableNames: string[] = [];

  // Sort variables by name length (longest first) to handle nested variable names
  const sortedVars = [...variables].sort((a, b) => b.name.length - a.name.length);

  for (const variable of sortedVars) {
    // Validate variable name
    if (!validateVariableName(variable.name)) {
      console.warn(`Invalid variable name: ${variable.name}. Skipping replacement.`);
      continue;
    }

    // Get the replacement value, optionally URL-encoding it
    let replacementValue = variable.value;
    if (options?.urlEncode) {
      replacementValue = encodeURIComponent(variable.value);
    }

    // Store in map for quick lookup
    replacementMap.set(variable.name, replacementValue);
    validVariableNames.push(escapeRegex(variable.name));
  }

  if (validVariableNames.length === 0) {
    return template;
  }

  // Build a single regex pattern that matches all variables at once
  // Pattern: \{\{(var1|var2|var3)\}\}
  const pattern = new RegExp(`\\{\\{(${validVariableNames.join('|')})\\}\\}`, 'g');

  // Replace all variables in a single pass
  return template.replace(pattern, (match, variableName) => {
    const replacement = replacementMap.get(variableName);
    // If variable not found in map (shouldn't happen), return original match
    return replacement !== undefined ? replacement : match;
  });
}

/**
 * Replace variables in a string (single variable)
 * Convenience function for single variable replacement
 */
export function replaceVariable(
  template: string,
  variableName: string,
  variableValue: string
): string {
  return replaceVariables(template, [{ name: variableName, value: variableValue }]);
}
