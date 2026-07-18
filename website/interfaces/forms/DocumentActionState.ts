/** Result of a documents mutation — `ok` on success, `error` for the toast. */
export interface DocumentActionState {
  ok?: boolean;
  error?: string;
}
