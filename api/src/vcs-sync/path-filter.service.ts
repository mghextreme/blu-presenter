import { Injectable } from '@nestjs/common';
import * as picomatch from 'picomatch';

const SONG_EXTENSION = '.md';
const DEFAULT_INCLUDE = ['**/*.md'];

export interface PathFilterSource {
  basePath?: string | null;
  includePatterns?: string[] | null;
  excludePatterns?: string[] | null;
}

@Injectable()
export class PathFilterService {
  isSongPath(relativePath: string): boolean {
    return relativePath.toLowerCase().endsWith(SONG_EXTENSION);
  }

  matches(relativePath: string, source: PathFilterSource): boolean {
    if (!this.isSongPath(relativePath)) {
      return false;
    }
    const include = source.includePatterns?.length
      ? source.includePatterns
      : DEFAULT_INCLUDE;
    if (!picomatch.isMatch(relativePath, include, { nocase: true })) {
      return false;
    }
    if (
      source.excludePatterns?.length &&
      picomatch.isMatch(relativePath, source.excludePatterns, { nocase: true })
    ) {
      return false;
    }
    return true;
  }

  normalizeBasePath(basePath?: string | null): string {
    return (basePath ?? '').replace(/^\/+|\/+$/g, '');
  }

  toRelativePath(path: string, source: PathFilterSource): string | null {
    const base = this.normalizeBasePath(source.basePath);
    if (!base) {
      return path;
    }
    if (path === base || !path.startsWith(`${base}/`)) {
      return null;
    }
    return path.slice(base.length + 1);
  }

  toAbsolutePath(relativePath: string, source: PathFilterSource): string {
    const base = this.normalizeBasePath(source.basePath);
    return base ? `${base}/${relativePath}` : relativePath;
  }
}
