import { Tables } from '../types';

export const generateUpdateQuery = <T extends object>(
  filters: T,
  options: T,
  table: Tables,
) => {
  // 1. Extract keys and filter out undefined values
  const setKeys = Object.keys(options);
  const filterKeys = Object.keys(filters);

  // 2. Map keys to SET clause syntax: column_name = $1, column_name = $2...
  // We add 1 to index because $1 will be the first variable, $2 the second, etc.
  const setClause = setKeys
    .map((key, index) => `"${key}" = $${index + 1}`)
    .join(', ');

  // 2. Build WHERE clause, continuing the placeholder index from where SET left off
  const whereClause = filterKeys
    .map((key, index) => `"${key}" = $${setKeys.length + index + 1}`)
    .join(' AND ');

  // 3. Gather values in the exact same order as the keys
  const setValues = setKeys.map((key) => options[key as keyof typeof options]);
  const filterValues = filterKeys.map(
    (key) => filters[key as keyof typeof filters],
  );
  const values = [...setValues, ...filterValues];

  // 4. Construct the final query string safely
  const queryText = `
      UPDATE ${table}
      SET ${setClause}
      WHERE ${whereClause}
      RETURNING *;
    `;
  return { queryText, values };
};
