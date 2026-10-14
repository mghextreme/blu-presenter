export interface VcsHead {
  commitSha: string;
  treeSha: string;
}

export interface VcsTreeEntry {
  path: string;
  sha: string;
  type: string;
}

export interface VcsClient {
  resolveHead(repo: string, branch: string): Promise<VcsHead>;
  getTree(repo: string, treeSha: string): Promise<VcsTreeEntry[]>;
  getBlob(repo: string, blobSha: string): Promise<Buffer>;
}
