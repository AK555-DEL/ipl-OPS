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
  assert.ok(mappedIds.length >= 75);
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-043'],
    '/assets/aistudio/prithvi_shaw_d26a5ccc.png'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-056'],
    '/assets/aistudio/jasprit_bumrah_029a70c9.png'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-058'],
    '/assets/aistudio/arshdeep_singh_e182acef.png'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-059'],
    '/assets/aistudio/kuldeep_yadav_6af8ab0a.png'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-067'],
    '/assets/aistudio/Avesh_Khan_91e27353.jpg'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-068'],
    '/assets/aistudio/khaleel_ahmed_d7f95f3d.png'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-069'],
    '/assets/aistudio/mukesh_kumar_506dd6f6.jpg'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-076'],
    '/assets/aistudio/kagiso_rabada_e44f0e24.png'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-077'],
    '/assets/aistudio/josh_hazlewood_4a7c4eb0.png'
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
    UPLOADED_PLAYER_PHOTOS['IPL-091'],
    '/assets/aistudio/krunal_pandya_ce2b6961.png'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-099'],
    '/assets/aistudio/cameron_green_904b72d1.jpg'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-100'],
    '/assets/aistudio/pat_cummins_c7e09471.png'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-107'],
    '/assets/aistudio/kl_rahul_92b3fda4.png'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-114'],
    '/assets/aistudio/Prabhsimran_Singh_f9313927.jpg'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-116'],
    '/assets/aistudio/anuj_rawat_244cdb7e.jpeg'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-122'],
    '/assets/aistudio/jos_buttler_9c531ee1.png'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-124'],
    '/assets/aistudio/nicholas_pooran_0d53dd2b.png'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-132'],
    '/assets/aistudio/ashutosh_sharma_0ae82323.jpeg'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-139'],
    '/assets/aistudio/abdul_samad_4546d06b.png'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-146'],
    '/assets/aistudio/priyansh_arya_8712e741.jpg'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-160'],
    '/assets/aistudio/mohsin_khan_ba8a0b0f.jpg'
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
