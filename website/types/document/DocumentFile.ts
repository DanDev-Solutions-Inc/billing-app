import { Tables } from "@typings/Supabase";

/* "Document" alone would shadow the DOM's global Document type, which is the
   sort of thing that only bites in a file that also touches the browser. */
export type DocumentFile = Tables<"documents">;
