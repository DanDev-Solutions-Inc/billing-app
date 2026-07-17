/**
 * The slice of a PostgREST query builder that a filter helper needs.
 *
 * Structural on purpose. Naming the real `PostgrestFilterBuilder` means
 * spelling out five generics (schema, row, result, relation, relationships) and
 * re-deriving them at every call site; all a `narrow()` helper actually does is
 * chain filters and hand the builder back, so it only needs to know the builder
 * returns itself.
 */
export interface Filterable<T> {
  eq(column: string, value: string): T;
  gte(column: string, value: string): T;
  or(filters: string): T;
}
