#!/usr/bin/env node
/**
 * One entry point for the whole workflow.
 *
 *   node seo/run.mjs             # full pass: sitemap -> schema -> keywords -> audit
 *   node seo/run.mjs audit dist/index.html
 *   node seo/run.mjs audit https://desiswagtunes.com
 *
 * A full pass writes its reports into seo/reports/ and prints a summary with
 * the next actions, so the agent (or a human) can pick up from the output alone.
 */
import { execFile } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { audit } from './audit.mjs';
import { buildKeywordMap } from './keywords.mjs';
import { ROOT } from './lib/site.mjs';

const execFileAsync = promisify(execFile);
const REPORTS = path.join(ROOT, 'seo/reports');

const run = (script, args = []) =>
  execFileAsync(process.execPath, [path.join(ROOT, 'seo', script), ...args], { cwd: ROOT });

const indent = (text) => `${text.trimEnd().replace(/^/gm, '     ')}\n`;

async function fullPass(argv) {
  await mkdir(REPORTS, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);

  console.log('1/4  sitemap + robots');
  const sitemap = await run('sitemap.mjs', argv.includes('--include-catalog') ? ['--include-catalog'] : []);
  process.stdout.write(indent(sitemap.stdout));

  console.log('2/4  structured data');
  const schema = await run('schema.mjs', ['--inject']);
  process.stdout.write(indent(schema.stdout));

  console.log('3/4  keyword map');
  const volIndex = argv.indexOf('--volumes');
  const volumesFile = volIndex >= 0 ? argv[volIndex + 1] : null;
  const map = await buildKeywordMap({ volumesFile });
  const { stdout: keywordMd } = await run('keywords.mjs', volumesFile ? ['--volumes', volumesFile] : []);
  await writeFile(path.join(REPORTS, `keyword-map-${stamp}.md`), keywordMd);
  console.log(`     ${map.clusters.length} clusters, ${map.keywordCount} keywords -> seo/reports/keyword-map-${stamp}.md`);

  console.log('4/4  technical audit');
  const skip = volIndex >= 0 ? volIndex + 1 : -1; // --volumes consumes the next argv slot
  const targets = argv.filter((a, i) => !a.startsWith('--') && i !== skip);
  const { reports } = await audit(targets.length ? targets : ['index.html']);
  const { stdout: auditMd } = await run('audit.mjs', targets).catch((e) => e); // exit 1 on blockers is expected
  await writeFile(path.join(REPORTS, `audit-${stamp}.md`), auditMd ?? '');

  console.log('');
  console.log('Summary');
  for (const report of reports) {
    console.log(`  ${report.source.padEnd(28)} ${String(report.score).padStart(3)}/100  ` +
      `${report.counts.fail} fail · ${report.counts.warn} warn · ${report.counts.pass} pass`);
  }

  const blockers = reports
    .flatMap((r) => r.checks)
    .filter((c) => c.status === 'fail' && (c.severity === 'critical' || c.severity === 'high'));

  console.log('');
  if (blockers.length) {
    console.log('Next actions');
    blockers.forEach((b, i) => console.log(`  ${i + 1}. ${b.title} — ${b.fix ?? b.detail}`));
  } else {
    console.log('No critical or high-severity blockers left.');
  }
  console.log(`\nReports: seo/reports/audit-${stamp}.md, seo/reports/keyword-map-${stamp}.md`);
  process.exitCode = blockers.length ? 1 : 0;
}

const COMMANDS = {
  audit: (argv) => run('audit.mjs', argv).then((r) => process.stdout.write(r.stdout)),
  keywords: (argv) => run('keywords.mjs', argv).then((r) => process.stdout.write(r.stdout)),
  sitemap: (argv) => run('sitemap.mjs', argv).then((r) => process.stdout.write(r.stdout)),
  schema: (argv) => run('schema.mjs', argv).then((r) => process.stdout.write(r.stdout)),
  all: fullPass,
};

const [command = 'all', ...rest] = process.argv.slice(2);
const handler = COMMANDS[command] ?? (() => fullPass([command, ...rest]));
handler(COMMANDS[command] ? rest : [command, ...rest]).catch((err) => {
  console.error(`seo run failed — ${err.stderr || err.message}`);
  process.exitCode = 1;
});
