import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SongTextFormatService } from '../songs/text-format/song-text-format.service';
import { Song } from 'src/entities';
import { generateRandomSecret } from 'src/utils/secret';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

const USAGE = `Usage:
  seed:songs [--dir <path>] [--org <id>]
      Import song files (same format as the export feature) into the
      database. Songs already present (same title, artist and organization)
      are skipped, so the script can be re-run safely.

      --dir  Directory with song .md files
             (default: supabase/seeds/songs in the repository root)
      --org  Organization id to import into
             (default: the first organization, otherwise the public archive)

Exit codes: 0 clean, 1 some files failed, 2 fatal error.`;

async function findSongFiles(dir: string): Promise<string[]> {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await findSongFiles(fullPath)));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      files.push(fullPath);
    }
  }
  return files.sort();
}

async function main(): Promise<number> {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log(USAGE);
    return 0;
  }
  const dirFlag = args.includes('--dir') ? args[args.indexOf('--dir') + 1] : undefined;
  const orgFlag = args.includes('--org') ? args[args.indexOf('--org') + 1] : undefined;

  const seedsDir = dirFlag
    ? path.resolve(dirFlag)
    : path.resolve(__dirname, '../../../supabase/seeds/songs');
  if (!fs.existsSync(seedsDir)) {
    console.error(`Song seed directory not found: ${seedsDir}`);
    return 2;
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['warn', 'error'],
  });

  try {
    const format = new SongTextFormatService();
    const dataSource = app.get(DataSource);

    let orgId: number | null = null;
    if (orgFlag !== undefined) {
      orgId = Number(orgFlag);
      if (!Number.isInteger(orgId)) {
        console.error(`--org must be an organization id, got "${orgFlag}"`);
        return 2;
      }
    } else {
      const orgRow = await dataSource.query(
        'SELECT id FROM organizations ORDER BY id LIMIT 1',
      );
      orgId = orgRow.length > 0 ? orgRow[0].id : null;
    }
    console.log(
      `Importing songs into ${orgId === null ? 'the public archive' : `organization ${orgId}`}`,
    );

    const repository = dataSource.getRepository(Song);
    const files = await findSongFiles(seedsDir);
    if (files.length === 0) {
      console.log(`No song files found in ${seedsDir}`);
      return 0;
    }

    let added = 0;
    let skipped = 0;
    let failed = 0;
    const failures: string[] = [];

    for (const file of files) {
      const relative = path.relative(seedsDir, file);
      try {
        const text = await fs.promises.readFile(file, 'utf-8');
        const song = format.decode(text);

        const existing = await repository.findOne({
          where: { title: song.title, artist: song.artist, orgId },
        });
        if (existing) {
          console.log(`  skipped  ${relative} (already imported)`);
          skipped++;
          continue;
        }

        await repository.insert({
          title: song.title,
          artist: song.artist,
          language: song.language,
          blocks: song.blocks,
          references: song.references ?? [],
          secret: orgId === null ? null : generateRandomSecret(10),
          orgId,
        });
        console.log(`  added    ${relative}`);
        added++;
      } catch (error) {
        failed++;
        failures.push(relative);
        console.error(`  failed   ${relative}: ${(error as Error).message}`);
      }
    }

    console.log(
      `\nDone: ${added} added, ${skipped} skipped, ${failed} failed.`,
    );
    return failed > 0 ? 1 : 0;
  } finally {
    await app.close();
  }
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error((error as Error).message);
    process.exit(2);
  });
