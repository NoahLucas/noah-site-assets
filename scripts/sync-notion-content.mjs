import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const token = process.env.NOTION_TOKEN;
const settingsDataSource = process.env.NOTION_SETTINGS_DATA_SOURCE || 'dae2b901-7d8d-49b6-b263-5d2610d191a3';
const employersDataSource = process.env.NOTION_EMPLOYERS_DATA_SOURCE || '7825d1f8-8d02-4b10-b42f-4a657e7d77cd';
const outputPath = resolve(process.cwd(), process.env.NOTION_CONTENT_OUTPUT || 'site/content/website-content.json');

if (!token) throw new Error('NOTION_TOKEN is required to sync website content.');

async function queryAll(dataSourceId) {
  const results = [];
  let cursor;
  do {
    const response = await fetch(`https://api.notion.com/v1/data_sources/${dataSourceId}/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2025-09-03'
      },
      body: JSON.stringify(cursor ? { start_cursor: cursor } : {})
    });
    if (!response.ok) throw new Error(`Notion query failed (${response.status}): ${await response.text()}`);
    const payload = await response.json();
    results.push(...payload.results);
    cursor = payload.has_more ? payload.next_cursor : undefined;
  } while (cursor);
  return results;
}

function plainText(property) {
  const values = property?.title || property?.rich_text || [];
  return values.map((item) => item.plain_text || '').join('').trim();
}

const [settingRows, employerRows] = await Promise.all([
  queryAll(settingsDataSource),
  queryAll(employersDataSource)
]);

const settingsByName = Object.fromEntries(
  settingRows.map((row) => [plainText(row.properties.Name), plainText(row.properties.Value)])
);

const content = {
  source: {
    type: 'notion',
    page: 'https://app.notion.com/p/39a602fa891b81f28eddccee12372b0d',
    settingsDataSource,
    employersDataSource,
    syncedAt: new Date().toISOString()
  },
  settings: {
    name: settingsByName.Name,
    heroPhrase: settingsByName['Hero phrase'],
    subtext: settingsByName.Subtext,
    methods: settingsByName.Methods,
    skills: settingsByName.Skills,
    expertise: settingsByName.Expertise,
    contactLabel: settingsByName['Contact label'],
    contactUrl: settingsByName['Contact URL'],
    linkedInLabel: settingsByName['LinkedIn label'],
    linkedInUrl: settingsByName['LinkedIn URL']
  },
  employers: employerRows.map((row) => ({
    slug: plainText(row.properties.Slug),
    employer: plainText(row.properties.Employer),
    oneLiner: plainText(row.properties['One-liner']),
    role: plainText(row.properties.Role),
    dates: plainText(row.properties.Dates),
    jtbd: plainText(row.properties.JTBD),
    workflows: plainText(row.properties.Workflows),
    impact: plainText(row.properties.Impact),
    url: row.properties.URL?.url || '',
    order: row.properties.Order?.number ?? 0
  })).sort((a, b) => a.order - b.order)
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(content, null, 2)}\n`, 'utf8');
console.log(`Synced ${content.employers.length} employers to ${outputPath}`);
