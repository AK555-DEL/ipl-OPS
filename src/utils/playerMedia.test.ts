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
  assert.ok(mappedIds.length >= 152);
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-033'],
    '/assets/aistudio/yashasvi_jaiswal_31a5fc32.png'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-042'],
    '/assets/aistudio/mayank_agarwal_8a529290.png'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-057'],
    '/assets/aistudio/mohammed_shami_8469d39d.jpg'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-060'],
    '/assets/aistudio/yuzvendra_chahal_149d1007.png'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-061'],
    '/assets/aistudio/mohammed_siraj_511e45c4.png'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-073'],
    '/assets/aistudio/mitchell_starc_92608f83.png'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-081'],
    '/assets/aistudio/hardik_pandya_9836a8ce.png'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-101'],
    '/assets/aistudio/glenn_maxwell_640eef1a.png'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-123'],
    '/assets/aistudio/heinrich_kalssen_bf8e32f1.png'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-158'],
    '/assets/aistudio/yash_dayal_af92f651.png'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-003'],
    '/assets/aistudio/virat_kohli_4625a09f.png'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-004'],
    '/assets/aistudio/rohit_sharma_a84b94f4.png'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-031'],
    '/assets/aistudio/suryakumar_yadav_dd14af38.png'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-032'],
    '/assets/aistudio/shubman_gill_9fc1865c.png'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-037'],
    '/assets/aistudio/tilak_varma_0dd935ae.png'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-043'],
    '/assets/aistudio/prithvi_shaw_d26a5ccc.png'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-046'],
    '/assets/aistudio/sarfaraz_khan_5d45af46.jpg'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-047'],
    '/assets/aistudio/travis_head_af449ef0.png'
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
    UPLOADED_PLAYER_PHOTOS['IPL-062'],
    '/assets/aistudio/Ravi_Bishnoi_5baed59c.jpg'
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
    UPLOADED_PLAYER_PHOTOS['IPL-072'],
    '/assets/aistudio/rashid_khan_57ff85ee.png'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-074'],
    '/assets/aistudio/trent_boult_0ecee0dc.png'
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
    UPLOADED_PLAYER_PHOTOS['IPL-082'],
    '/assets/aistudio/ravindra_jadeja_7a1ba01f.png'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-083'],
    '/assets/aistudio/axar_patel_0f5e9471.png'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-084'],
    '/assets/aistudio/shivam_dube_1cf41563.png'
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
    UPLOADED_PLAYER_PHOTOS['IPL-096'],
    '/assets/aistudio/ramandeep_singh_ffabdfd6.jpg'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-098'],
    '/assets/aistudio/sunil_narine_c8b21b37.png'
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
    UPLOADED_PLAYER_PHOTOS['IPL-102'],
    '/assets/aistudio/sam_curran_e3a8adb2.png'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-106'],
    '/assets/aistudio/rishabh_pant_591d8b14.png'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-107'],
    '/assets/aistudio/kl_rahul_92b3fda4.png'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-108'],
    '/assets/aistudio/sanju_samson_e673fd3b.png'
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
    UPLOADED_PLAYER_PHOTOS['IPL-126'],
    '/assets/aistudio/quinton_de_kock_cda909c5.png'
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
    UPLOADED_PLAYER_PHOTOS['IPL-143'],
    '/assets/aistudio/swastik_chikara_39ac0f2f.png'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-146'],
    '/assets/aistudio/priyansh_arya_8712e741.jpg'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-159'],
    '/assets/aistudio/vaibhav_arora_e6cab149.png'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-160'],
    '/assets/aistudio/mohsin_khan_ba8a0b0f.jpg'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-162'],
    '/assets/aistudio/suyash_sharma_ccea5ae2.png'
  );
  assert.equal(
    UPLOADED_PLAYER_PHOTOS['IPL-167'],
    '/assets/aistudio/vijaykumar_vyshak_6c8d1e37.png'
  );

  // Newly uploaded batch of 20 player photos
  assert.equal(UPLOADED_PLAYER_PHOTOS['IPL-008'], '/assets/aistudio/gautam_gambhir_4ccb66da.jpg');
  assert.equal(UPLOADED_PLAYER_PHOTOS['IPL-012'], '/assets/aistudio/harbhajan_singh_5e4460a9.jpg');
  assert.equal(UPLOADED_PLAYER_PHOTOS['IPL-013'], '/assets/aistudio/anil_kumble_e84f0f64.jpg');
  assert.equal(UPLOADED_PLAYER_PHOTOS['IPL-016'], '/assets/aistudio/irfan_pathan_c3a5cde9.png');
  assert.equal(UPLOADED_PLAYER_PHOTOS['IPL-019'], '/assets/aistudio/ambati_rayudu_19b74bd3.jpg');
  assert.equal(UPLOADED_PLAYER_PHOTOS['IPL-020'], '/assets/aistudio/dinesh_karthik_34be7633.jpg');
  assert.equal(UPLOADED_PLAYER_PHOTOS['IPL-023'], '/assets/aistudio/lasith_malinga_1df76adf.png');
  assert.equal(UPLOADED_PLAYER_PHOTOS['IPL-024'], '/assets/aistudio/kieron_pollard_836a111f.png');
  assert.equal(UPLOADED_PLAYER_PHOTOS['IPL-025'], '/assets/aistudio/dwayne_bravo_1d709770.jfif');
  assert.equal(UPLOADED_PLAYER_PHOTOS['IPL-028'], '/assets/aistudio/jacques_kallis_072aab1b.png');
  assert.equal(UPLOADED_PLAYER_PHOTOS['IPL-029'], '/assets/aistudio/brendon_mccullum_533891fd.png');
  assert.equal(UPLOADED_PLAYER_PHOTOS['IPL-030'], '/assets/aistudio/adam_gilchrist_ea9b05e8.png');
  assert.equal(UPLOADED_PLAYER_PHOTOS['IPL-049'], '/assets/aistudio/David_Miller_f56fea52.jpg');
  assert.equal(UPLOADED_PLAYER_PHOTOS['IPL-052'], '/assets/aistudio/Jake_Fraser_McGurk_664da322.jpg');
  assert.equal(UPLOADED_PLAYER_PHOTOS['IPL-064'], '/assets/aistudio/Bhuvneshwar_Kumar_287d8848.jpg');
  assert.equal(UPLOADED_PLAYER_PHOTOS['IPL-121'], '/assets/aistudio/Baba_Indrajith_13b05aee.jpg');
  assert.equal(UPLOADED_PLAYER_PHOTOS['IPL-128'], '/assets/aistudio/Jonny_Bairstow_10a0a332.jpg');
  assert.equal(UPLOADED_PLAYER_PHOTOS['IPL-129'], '/assets/aistudio/Devon_Conway_45faa564.jpg');
  assert.equal(UPLOADED_PLAYER_PHOTOS['IPL-130'], '/assets/aistudio/Josh_Inglis_be3e8b0f.jpg');
  assert.equal(UPLOADED_PLAYER_PHOTOS['IPL-138'], '/assets/aistudio/Abhinav_Manohar_bffce799.jpg');

  // Latest uploaded batch of 20 player photos
  assert.equal(UPLOADED_PLAYER_PHOTOS['IPL-005'], '/assets/aistudio/suresh_raina_228c6921.jpg');
  assert.equal(UPLOADED_PLAYER_PHOTOS['IPL-014'], '/assets/aistudio/rahul_dravid_4d7b3f0c.jpeg');
  assert.equal(UPLOADED_PLAYER_PHOTOS['IPL-015'], '/assets/aistudio/sourav_ganguly_0d3428be.jfif');
  assert.equal(UPLOADED_PLAYER_PHOTOS['IPL-018'], '/assets/aistudio/robin_uthappa_f7934f2f.jpg');
  assert.equal(UPLOADED_PLAYER_PHOTOS['IPL-026'], '/assets/aistudio/shane_watson_28235b96.png');
  assert.equal(UPLOADED_PLAYER_PHOTOS['IPL-027'], '/assets/aistudio/shane_warne_1900377f.jpg');
  assert.equal(UPLOADED_PLAYER_PHOTOS['IPL-036'], '/assets/aistudio/rinku_singh_fc229315.png');
  assert.equal(UPLOADED_PLAYER_PHOTOS['IPL-041'], '/assets/aistudio/manish_pandey_354f5421.png');
  assert.equal(UPLOADED_PLAYER_PHOTOS['IPL-054'], '/assets/aistudio/Rovman_Powell_0c9103c3.jpg');
  assert.equal(UPLOADED_PLAYER_PHOTOS['IPL-055'], '/assets/aistudio/Tristan_Stubbs_692ca836.jpg');
  assert.equal(UPLOADED_PLAYER_PHOTOS['IPL-089'], '/assets/aistudio/Venkatesh_Iyer_1de25fba.jpg');
  assert.equal(UPLOADED_PLAYER_PHOTOS['IPL-094'], '/assets/aistudio/Shahbaz_Ahmed_3ca32b08.jpg');
  assert.equal(UPLOADED_PLAYER_PHOTOS['IPL-095'], '/assets/aistudio/Rahul_Tewatia_444ef2a7.jpg');
  assert.equal(UPLOADED_PLAYER_PHOTOS['IPL-103'], '/assets/aistudio/Marcus_Stoinis_67377d8c.jpg');
  assert.equal(UPLOADED_PLAYER_PHOTOS['IPL-117'], '/assets/aistudio/Narayan_Jagadeesan_f2fc66c8.jpg');
  assert.equal(UPLOADED_PLAYER_PHOTOS['IPL-118'], '/assets/aistudio/Upendra_Yadav_3999e87d.jpg');
  assert.equal(UPLOADED_PLAYER_PHOTOS['IPL-120'], '/assets/aistudio/Sheldon_Jackson_c19fcfed.jpg');
  assert.equal(UPLOADED_PLAYER_PHOTOS['IPL-127'], '/assets/aistudio/Rahmanullah_Gurbaz_87d6d3f4.jpg');
  assert.equal(UPLOADED_PLAYER_PHOTOS['IPL-137'], '/assets/aistudio/Naman_Dhir_ca96ca1d.jpg');
  assert.equal(UPLOADED_PLAYER_PHOTOS['IPL-140'], '/assets/aistudio/Mahipal_Lomror_748d0508.jpg');

  // Newly added missing player photos from latest batch (while preserving all existing ones)
  assert.equal(UPLOADED_PLAYER_PHOTOS['IPL-007'], '/assets/aistudio/virender_sehwag_06e1b9d3.jpg');
  assert.equal(UPLOADED_PLAYER_PHOTOS['IPL-011'], '/assets/aistudio/zaheer_khan_a5c4b30a.jpeg');
  assert.equal(UPLOADED_PLAYER_PHOTOS['IPL-017'], '/assets/aistudio/yusuf_pathan_a004eac7.png');
  assert.equal(UPLOADED_PLAYER_PHOTOS['IPL-093'], '/assets/aistudio/Vijay_Shankar_c269e1d8.jpg');
  assert.equal(UPLOADED_PLAYER_PHOTOS['IPL-112'], '/assets/aistudio/Wriddhiman_Saha_143db3a1.jpg');

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
