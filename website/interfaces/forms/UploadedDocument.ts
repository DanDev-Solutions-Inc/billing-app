/** A file already in the Blob store, waiting to be recorded as a document. */
export interface UploadedDocument {
  name: string;
  url: string;
  pathname: string;
  size: number;
  contentType?: string;
}
