// Minimal JSON-Schema-subset validator + "compact" profile generator.
// Small local models have tiny context budgets, so tool schemas ship in two profiles:
//   full    -> descriptions, constraints (for big/cloud models)
//   compact -> names, types, required, enums only (for small local models)

const TYPES = {
  string: (v) => typeof v === "string",
  number: (v) => typeof v === "number" && Number.isFinite(v),
  integer: (v) => Number.isInteger(v),
  boolean: (v) => typeof v === "boolean",
  array: Array.isArray,
  object: (v) => v !== null && typeof v === "object" && !Array.isArray(v),
};

export function validate(schema, value, path = "$") {
  const errors = [];
  const check = TYPES[schema.type];
  if (!check) return [`${path}: unsupported schema type "${schema.type}"`];
  if (!check(value)) return [`${path}: expected ${schema.type}`];

  if (schema.enum && !schema.enum.includes(value)) errors.push(`${path}: must be one of ${schema.enum.join("|")}`);
  if (typeof value === "string") {
    if (schema.maxLength != null && value.length > schema.maxLength) errors.push(`${path}: longer than ${schema.maxLength}`);
    if (schema.minLength != null && value.length < schema.minLength) errors.push(`${path}: shorter than ${schema.minLength}`);
  }
  if (typeof value === "number") {
    if (schema.minimum != null && value < schema.minimum) errors.push(`${path}: below ${schema.minimum}`);
    if (schema.maximum != null && value > schema.maximum) errors.push(`${path}: above ${schema.maximum}`);
  }
  if (schema.type === "array" && schema.items) {
    if (schema.maxItems != null && value.length > schema.maxItems) errors.push(`${path}: more than ${schema.maxItems} items`);
    value.forEach((v, i) => errors.push(...validate(schema.items, v, `${path}[${i}]`)));
  }
  if (schema.type === "object") {
    const props = schema.properties ?? {};
    for (const key of schema.required ?? []) if (!(key in value)) errors.push(`${path}.${key}: required`);
    for (const [key, v] of Object.entries(value)) {
      if (props[key]) errors.push(...validate(props[key], v, `${path}.${key}`));
      else if (schema.additionalProperties !== true) errors.push(`${path}.${key}: unknown property`);
    }
  }
  return errors;
}

/** Fill defaults declared in the schema (top-level properties). */
export function applyDefaults(schema, value) {
  const out = { ...value };
  for (const [k, p] of Object.entries(schema.properties ?? {})) if (out[k] === undefined && "default" in p) out[k] = p.default;
  return out;
}

export function compactSchema(schema) {
  const keep = ["type", "enum", "required", "minimum", "maximum"];
  const out = {};
  for (const k of keep) if (schema[k] !== undefined) out[k] = schema[k];
  if (schema.properties) {
    out.properties = Object.fromEntries(Object.entries(schema.properties).map(([k, v]) => [k, compactSchema(v)]));
  }
  if (schema.items) out.items = compactSchema(schema.items);
  return out;
}

/** Rough token estimate (~4 chars/token) for budgeting tool schemas. */
export const estimateTokens = (obj) => Math.ceil(JSON.stringify(obj).length / 4);
