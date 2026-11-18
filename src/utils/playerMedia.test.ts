import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { FRANCHISE_TITLES, parsePlayersCsv } from '../auction/engine.ts';
import {
  UPLOADED_FRANCHISE_BANNERS,
  UPLOADED_PLAYER_PHOTOS,
  getPlayerImageSrc,
  isWideCrestFranchise,
} from './playerMedia.ts';

const csvPath = path.resolve(process.cwd(), 'seed', 'players.csv');
const csvPlayers = parsePlayersCsv(fs.readFileSync(csvPath, 'utf8'));
const csvIdSet = new Set(csvPlayers.map((p) => p.id));

test('all 11 franchise titles map to existing banner assets in public/assets/aistudio', () => {
  assert.equal(FRANCHISE_TITLES.length, 11);
  for (const title of FRANCHISE_TITLES) {
    const mapped = UPLOADED_FRANCHISE_BANNERS[title.id];
    assert.ok(mapped, `Missing banner mapping for ${title.id} (${title.name})`);
    const resolved = getPlayerImageSrc(title);
    assert.equal(resolved, mapped);
    const filePath = path.resolve(process.cwd(), 'public', mapped.replace(/^\/+/, ''));
    assert.ok(fs.existsSync(filePath), `Banner file missing on disk: ${filePath}`);
  }
});

test('all uploaded player photo mappings reference valid CSV IDs and existing files on disk', () => {
  const mappedIds = Object.keys(UPLOADED_PLAYER_PHOTOS);
  assert.ok(mappedIds.length >= 60);
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-058'],
    '/assets/aistudio/arshdeep_singh_e182acef.png'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-067'],
    '/assets/aistudio/Avesh_Khan_91e27353.jpg'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-083'],
    '/assets/aistudio/axar_patel_0f5e9471.png'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-087'],
    '/assets/aistudio/abhishek_sharma_fb9ca871.jpeg'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-099'],
    '/assets/aistudio/cameron_green_904b72d1.jpg'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-116'],
    '/assets/aistudio/anuj_rawat_244cdb7e.jpeg'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-132'],
    '/assets/aistudio/ashutosh_sharma_0ae82323.jpeg'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-139'],
    '/assets/aistudio/abdul_samad_4546d06b.png'
  );

  for (const id of mappedIds) {
    assert.ok(csvIdSet.has(id), `Mapped player ID ${id} does not exist in seed/players.csv`);
    const assetUrl = UPLOADED_PLAYER_PHOTOS[id];
    const filePath = path.resolve(process.cwd(), 'public', assetUrl.replace(/^\/+/, ''));
    assert.ok(fs.existsSync(filePath), `Player photo file missing on disk: ${filePath}`);
    const player = csvPlayers.find((p) => p.id === id)!;
    assert.equal(getPlayerImageSrc(player), assetUrl);
  }
});

test('isWideCrestFranchise identifies wide-wing and wide-crest franchise banners cleanly', () => {
  assert.equal(isWideCrestFranchise('IPL-T01'), true);
  assert.equal(isWideCrestFranchise('IPL-T04'), true);
  assert.equal(isWideCrestFranchise('IPL-T05'), true);
  assert.equal(isWideCrestFranchise('IPL-T06'), true);
  assert.equal(isWideCrestFranchise('IPL-T09'), false);
  assert.equal(isWideCrestFranchise('IPL-T11'), false);
});
