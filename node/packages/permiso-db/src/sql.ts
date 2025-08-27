export function insert<T extends Record<string, unknown>>(
  tableName: string,
  params: T,
): string {
  const columns = Object.keys(params);
  const values = columns.map((col) => `$(${col})`);

  return `INSERT INTO ${tableName} (${columns.join(", ")}) VALUES (${values.join(", ")})`;
}

export function update<T extends Record<string, unknown>>(
  tableName: string,
  params: T,
): string {
  const setClause = Object.keys(params).map((col) => `${col} = $(${col})`);

  return `UPDATE ${tableName} SET ${setClause.join(", ")}`;
}
