/**
 * Dynamic Data & Relationship Parser for No-Code Builder
 */

export interface RelationshipField {
  id: string;
  name: string;
  type: "relationship";
  relationType: 'one_to_one' | 'one_to_many' | 'many_to_many' | 'self_relationship';
  relatedTableId: string;
  relatedFieldName?: string;
}

export interface TableSchema {
  id: string;
  name: string;
  fields: any[];
}

export interface ParserContext {
  user?: any;              // Logged In User
  currentRecord?: any;     // Current Record (e.g. Current post)
  currentListItem?: any;   // Current List Item
  parentRecord?: any;      // Parent Record
  urlParams?: Record<string, string>; // URL query parameters
  variables?: any[];       // Page/Local/Custom states
  userTables: TableSchema[];
  allRecords: Record<string, any[]>; // Record dictionary mapped by table_id (or table_name)
}

/**
 * Normalizes a table ID or references from name or ID
 */
export function getTableByIdOrName(userTables: TableSchema[], ref: string): TableSchema | undefined {
  if (!ref) return undefined;
  return userTables.find(t => t.id === ref || t.name === ref);
}

/**
 * Searches the related records from relation maps
 */
export function resolveRelationRecords(
  sourceRecord: any,
  relationField: any,
  context: ParserContext
): any[] {
  if (!sourceRecord || !relationField) return [];

  const targetTable = getTableByIdOrName(context.userTables, relationField.relatedTableId);
  if (!targetTable) return [];

  const targetRecords = context.allRecords[targetTable.id] || [];

  // Direct relationship: Stored inside sourceRecord's fields as ID or array of IDs
  const directValue = sourceRecord[relationField.name];
  if (directValue !== undefined && directValue !== null) {
    const ids = Array.isArray(directValue) ? directValue : [directValue];
    return targetRecords.filter(r => ids.includes(r.id));
  }

  // Indirect/Inverse relationship: Related table holds reference to our sourceRecord ID
  // Let's inspect the target table fields to find a relationship pointing back to our source table ID
  const reverseField = targetTable.fields.find(f => 
    f.type === "relationship" && 
    (f.relatedTableId === relationField.relatedTableId || f.name === relationField.relatedFieldName)
  );

  if (reverseField) {
    const reverseFieldName = reverseField.name;
    return targetRecords.filter(r => {
      const val = r[reverseFieldName];
      if (Array.isArray(val)) {
        return val.includes(sourceRecord.id);
      }
      return val === sourceRecord.id;
    });
  }

  // Fallback search: look for any field containing current record ID or named user_id, post_id, etc.
  return targetRecords.filter(r => {
    for (const key of Object.keys(r)) {
      if (r[key] === sourceRecord.id || (Array.isArray(r[key]) && r[key].includes(sourceRecord.id))) {
        return true;
      }
    }
    return false;
  });
}

/**
 * Recursively resolves a chain of path segments starting from a raw starting point object
 */
export function resolveSegmentChain(
  currentVal: any,
  pathParts: string[],
  context: ParserContext,
  currentTableContext?: TableSchema
): any {
  if (pathParts.length === 0) return currentVal;
  if (currentVal === null || currentVal === undefined) return "";

  const [activeSegment, ...remainingParts] = pathParts;

  // If current value is an array, we resolve the segment for each item
  if (Array.isArray(currentVal)) {
    const results = currentVal.map(item => resolveSegmentChain(item, [activeSegment, ...remainingParts], context, currentTableContext));
    // Flatten array if children return arrays
    const flattened = results.reduce((acc, val) => {
      if (Array.isArray(val)) return acc.concat(val);
      if (val !== undefined && val !== null) acc.push(val);
      return acc;
    }, [] as any[]);
    return flattened;
  }

  // Determine schema context
  let schema = currentTableContext;
  if (currentVal && currentVal.id) {
    // Attempt tracking schema context of current item if not specified
    schema = context.userTables.find(t => 
      t.fields.some(f => currentVal[f.name] !== undefined)
    ) || schema;
  }

  if (schema) {
    const field = schema.fields.find(f => f.name === activeSegment);
    if (field && field.type === "relationship") {
      const relatedTable = getTableByIdOrName(context.userTables, field.relatedTableId);
      const relationRecords = resolveRelationRecords(currentVal, field, context);
      return resolveSegmentChain(relationRecords, remainingParts, context, relatedTable);
    }
  }

  // Standard field property lookup
  const targetVal = currentVal[activeSegment];
  if (targetVal !== undefined) {
    return resolveSegmentChain(targetVal, remainingParts, context, currentTableContext);
  }

  // Direct check case-insensitive or fallback
  const matchingKey = Object.keys(currentVal).find(k => k.toLowerCase() === activeSegment.toLowerCase());
  if (matchingKey) {
    return resolveSegmentChain(currentVal[matchingKey], remainingParts, context, currentTableContext);
  }

  return "";
}

/**
 * Primary visual data path evaluation
 */
export function evaluateValuePath(
  pathExpression: string,
  context: ParserContext
): any {
  if (!pathExpression) return "";

  const cleanExpression = pathExpression.trim();

  // Evaluate Formulas
  if (cleanExpression.startsWith("COUNT(")) {
    const inner = cleanExpression.substring(6, cleanExpression.lastIndexOf(")")).trim();
    const resolved = evaluateValuePath(inner, context);
    return Array.isArray(resolved) ? resolved.length : (resolved ? 1 : 0);
  }

  if (cleanExpression.startsWith("SUM(")) {
    const inner = cleanExpression.substring(4, cleanExpression.lastIndexOf(")")).trim();
    const resolved = evaluateValuePath(inner, context);
    if (!Array.isArray(resolved)) return Number(resolved) || 0;
    return resolved.reduce((sum, item) => sum + (Number(item) || 0), 0);
  }

  if (cleanExpression.startsWith("AVG(")) {
    const inner = cleanExpression.substring(4, cleanExpression.lastIndexOf(")")).trim();
    const resolved = evaluateValuePath(inner, context);
    if (!Array.isArray(resolved)) return Number(resolved) || 0;
    if (resolved.length === 0) return 0;
    const total = resolved.reduce((sum, item) => sum + (Number(item) || 0), 0);
    return Math.round((total / resolved.length) * 100) / 100;
  }

  if (cleanExpression.startsWith("IF(")) {
    const inner = cleanExpression.substring(3, cleanExpression.lastIndexOf(")")).trim();
    const parts = inner.split(",").map(p => p.trim());
    if (parts.length >= 2) {
      const conditionPath = parts[0];
      const yesVal = parts[1];
      const noVal = parts[2] || "";
      const resolvedCondition = evaluateValuePath(conditionPath, context);
      const conditionIsTrue = resolvedCondition && resolvedCondition !== "false" && resolvedCondition !== "0" && (Array.isArray(resolvedCondition) ? resolvedCondition.length > 0 : true);
      
      return conditionIsTrue ? (yesVal.startsWith("'") || yesVal.startsWith("\"") ? yesVal.substring(1, yesVal.length - 1) : evaluateValuePath(yesVal, context) || yesVal) 
                             : (noVal.startsWith("'") || noVal.startsWith("\"") ? noVal.substring(1, noVal.length - 1) : evaluateValuePath(noVal, context) || noVal);
    }
  }

  if (cleanExpression.startsWith("CONCAT(")) {
    const inner = cleanExpression.substring(7, cleanExpression.lastIndexOf(")")).trim();
    // Split by comma mapping, taking strings or paths
    const parts = inner.split(",").map(p => p.trim());
    const strings = parts.map(arg => {
      if ((arg.startsWith("'") && arg.endsWith("'")) || (arg.startsWith("\"") && arg.endsWith("\""))) {
        return arg.substring(1, arg.length - 1);
      }
      return String(evaluateValuePath(arg, context));
    });
    return strings.join("");
  }

  if (cleanExpression.startsWith("UPPER(")) {
    const inner = cleanExpression.substring(6, cleanExpression.lastIndexOf(")")).trim();
    return String(evaluateValuePath(inner, context)).toUpperCase();
  }

  if (cleanExpression.startsWith("LOWER(")) {
    const inner = cleanExpression.substring(6, cleanExpression.lastIndexOf(")")).trim();
    return String(evaluateValuePath(inner, context)).toLowerCase();
  }

  if (cleanExpression.startsWith("DATE_FORMAT(")) {
    const inner = cleanExpression.substring(12, cleanExpression.lastIndexOf(")")).trim();
    const resolved = evaluateValuePath(inner, context);
    if (!resolved) return "";
    try {
      return new Date(resolved).toLocaleDateString("ar-EG", { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return String(resolved);
    }
  }

  // Parse path: "Logged In User > Posts > Title"
  const parts = cleanExpression.split(">").map(s => s.trim());
  const [sourceKey, ...remaining] = parts;

  let baseVal: any = null;
  let startTable: TableSchema | undefined = undefined;

  switch (sourceKey) {
    case "Logged In User":
      baseVal = context.user;
      startTable = getTableByIdOrName(context.userTables, "site_users") || getTableByIdOrName(context.userTables, "users");
      break;
    case "Current Record":
      baseVal = context.currentRecord;
      break;
    case "Current List Item":
    case "Current Item":
      baseVal = context.currentListItem;
      break;
    case "Parent Record":
      baseVal = context.parentRecord;
      break;
    case "URL Parameters":
      if (remaining.length > 0) {
        return context.urlParams?.[remaining[0]] || "";
      }
      return context.urlParams || "";
    case "Custom State":
    case "Local State":
    case "Page State":
      if (remaining.length > 0) {
        const vName = remaining[0];
        const stateVar = context.variables?.find(v => v.name === vName);
        return stateVar ? stateVar.defaultValue : "";
      }
      return "";
    default:
      // Try lookup table list by table name directly (e.g. Posts > Title)
      const directTable = getTableByIdOrName(context.userTables, sourceKey);
      if (directTable) {
        baseVal = context.allRecords[directTable.id] || [];
        startTable = directTable;
      } else {
        // Look up variable or custom binding context
        const customVar = context.variables?.find(v => v.name === sourceKey);
        if (customVar) {
          baseVal = customVar.defaultValue;
        } else if (context.currentListItem && context.currentListItem[sourceKey] !== undefined) {
          baseVal = context.currentListItem[sourceKey];
        } else if (context.currentRecord && context.currentRecord[sourceKey] !== undefined) {
          baseVal = context.currentRecord[sourceKey];
        }
      }
  }

  const result = resolveSegmentChain(baseVal, remaining, context, startTable);
  
  if (Array.isArray(result)) {
    // If we've resolved to items and we're looking at a single element value, joining is logical or pick first
    return result.length === 1 ? result[0] : result;
  }
  
  return result;
}

/**
 * Replaces dynamic tags in template texts
 */
export function parseAndInjectDynamicValues(
  text: string,
  context: ParserContext
): string {
  if (!text || typeof text !== "string") return "";

  let result = text;
  const regex = /{{\s*([^}]+)\s*}}/g;

  result = result.replace(regex, (match, pathString) => {
    const val = evaluateValuePath(pathString, context);
    if (val === undefined || val === null) return "";
    if (typeof val === "object") {
      if (Array.isArray(val)) {
        return val.map(item => (typeof item === "object" ? (item.name || item.title || item.id || JSON.stringify(item)) : String(item))).join(", ");
      }
      return val.name || val.title || val.id || JSON.stringify(val);
    }
    return String(val);
  });

  return result;
}

/**
 * Condition evaluation engine matching Adalo operations
 */
export function evaluateCondition(
  leftVal: any,
  operator: string,
  rightVal: any
): boolean {
  // Convert left and right into clean comparable objects
  const l = leftVal !== undefined && leftVal !== null ? String(leftVal).trim().toLowerCase() : "";
  const r = rightVal !== undefined && rightVal !== null ? String(rightVal).trim().toLowerCase() : "";

  switch (operator) {
    case "equal":
    case "equals":
    case "==":
      return l === r;
    case "not_equal":
    case "!=":
      return l !== r;
    case "contains":
      return l.includes(r);
    case "not_contains":
    case "does_not_contain":
      return !l.includes(r);
    case "greater_than":
    case ">":
      return Number(leftVal) > Number(rightVal);
    case "less_than":
    case "<":
      return Number(leftVal) < Number(rightVal);
    case "is_empty":
      return leftVal === undefined || leftVal === null || String(leftVal) === "";
    case "is_not_empty":
      return leftVal !== undefined && leftVal !== null && String(leftVal) !== "";
    default:
      return l === r;
  }
}
