import type { BriefPlayer, Player } from '../auction/types.ts';

export const UPLOADED_FRANCHISE_BANNERS: Record<string, string> = {
  'IPL-T01': '/assets/aistudio/LSG_BANNER_7a681789.png',
  'IPL-T02': '/assets/aistudio/PBKS_BANNER_f3b8a13b.png',
  'IPL-T03': '/assets/aistudio/DELHI_CAPITALS_BANNER_130b4c2f.png',
  'IPL-T04': '/assets/aistudio/GUJARAT_TITANS_BANNER_30cf6860.png',
  'IPL-T05': '/assets/aistudio/RR_BANNER_997f8cf7.PNG',
  'IPL-T06': '/assets/aistudio/SRH_BANNER_c31e39aa.png',
  'IPL-T07': '/assets/aistudio/KKR_BANNER_13d50760.png',
  'IPL-T08': '/assets/aistudio/RCB_BANNER_88a8ff46.png',
  'IPL-T09': '/assets/aistudio/MUMBAI_INDIANS_129ebce8.png',
  'IPL-T10': '/assets/aistudio/CSK_BANNER_2746a21d.png',
  'IPL-T11': '/assets/aistudio/DECCAN_CHARGES_BANNER_0223a465.png',
};

export const UPLOADED_PLAYER_PHOTOS: Record<string, string> = {
  'IPL-001': '/assets/aistudio/sachinTendulkar_170325da.png',
  'IPL-002': '/assets/aistudio/ms_dhoni_fb7353b0.png',
  'IPL-003': '/assets/aistudio/virat_kohli_4625a09f.png',
  'IPL-004': '/assets/aistudio/rohit_sharma_a84b94f4.png',
  'IPL-005': '/assets/aistudio/suresh_raina_228c6921.jpg',
  'IPL-006': '/assets/aistudio/yuvarajSingh_dc313e21.png',
  'IPL-007': '/assets/aistudio/virender_sehwag_06e1b9d3.jpg',
  'IPL-008': '/assets/aistudio/gautam_gambhir_4ccb66da.jpg',
  'IPL-009': '/assets/aistudio/shikhar_dhawan_742dd859.jpeg',
  'IPL-010': '/assets/aistudio/ravichandran_ashwin_f9c4b0c9.png',
  'IPL-011': '/assets/aistudio/zaheer_khan_a5c4b30a.jpeg',
  'IPL-012': '/assets/aistudio/harbhajan_singh_5e4460a9.jpg',
  'IPL-013': '/assets/aistudio/anil_kumble_e84f0f64.jpg',
  'IPL-014': '/assets/aistudio/rahul_dravid_4d7b3f0c.jpeg',
  'IPL-015': '/assets/aistudio/sourav_ganguly_0d3428be.jfif',
  'IPL-016': '/assets/aistudio/irfan_pathan_c3a5cde9.png',
  'IPL-017': '/assets/aistudio/yusuf_pathan_a004eac7.png',
  'IPL-018': '/assets/aistudio/robin_uthappa_f7934f2f.jpg',
  'IPL-019': '/assets/aistudio/ambati_rayudu_19b74bd3.jpg',
  'IPL-020': '/assets/aistudio/dinesh_karthik_34be7633.jpg',
  'IPL-021': '/assets/aistudio/abd_f02cc942.jfif',
  'IPL-022': '/assets/aistudio/chris_gayle_42edeeeb.jpeg',
  'IPL-023': '/assets/aistudio/lasith_malinga_1df76adf.png',
  'IPL-024': '/assets/aistudio/kieron_pollard_836a111f.png',
  'IPL-025': '/assets/aistudio/dwayne_bravo_1d709770.jfif',
  'IPL-026': '/assets/aistudio/shane_watson_28235b96.png',
  'IPL-027': '/assets/aistudio/shane_warne_1900377f.jpg',
  'IPL-028': '/assets/aistudio/jacques_kallis_072aab1b.png',
  'IPL-029': '/assets/aistudio/brendon_mccullum_533891fd.png',
  'IPL-030': '/assets/aistudio/adam_gilchrist_ea9b05e8.png',
  'IPL-031': '/assets/aistudio/suryakumar_yadav_dd14af38.png',
  'IPL-032': '/assets/aistudio/shubman_gill_9fc1865c.png',
  'IPL-033': '/assets/aistudio/yashasvi_jaiswal_31a5fc32.png',
  'IPL-034': '/assets/aistudio/ruturaj_gaikwad_05702c6f.jpg',
  'IPL-035': '/assets/aistudio/shreyas_iyer_d14effc5.png',
  'IPL-036': '/assets/aistudio/rinku_singh_fc229315.png',
  'IPL-037': '/assets/aistudio/tilak_varma_0dd935ae.png',
  'IPL-038': '/assets/aistudio/sai_sudharsan_f1dbf56a.png',
  'IPL-039': '/assets/aistudio/rajat_patidar_c6b6455d.png',
  'IPL-040': '/assets/aistudio/ajinkya_rahane_e12b8872.png',
  'IPL-041': '/assets/aistudio/manish_pandey_354f5421.png',
  'IPL-042': '/assets/aistudio/mayank_agarwal_8a529290.png',
  'IPL-043': '/assets/aistudio/prithvi_shaw_d26a5ccc.png',
  'IPL-044': '/assets/aistudio/devdutt_padikkal_1ea21a76.png',
  'IPL-045': '/assets/aistudio/rahul_tripathi_1381a605.png',
  'IPL-046': '/assets/aistudio/sarfaraz_khan_5d45af46.jpg',
  'IPL-047': '/assets/aistudio/travis_head_af449ef0.png',
  'IPL-048': '/assets/aistudio/faf_duplessis_3282e808.png',
  'IPL-049': '/assets/aistudio/David_Miller_f56fea52.jpg',
  'IPL-050': '/assets/aistudio/kane_willamson_bc16f635.png',
  'IPL-051': '/assets/aistudio/Shimron-Hetmyer_b38b2558.png',
  'IPL-052': '/assets/aistudio/Jake_Fraser_McGurk_664da322.jpg',
  'IPL-053': '/assets/aistudio/harry_brook_56462822.png',
  'IPL-054': '/assets/aistudio/Rovman_Powell_0c9103c3.jpg',
  'IPL-055': '/assets/aistudio/Tristan_Stubbs_692ca836.jpg',
  'IPL-056': '/assets/aistudio/jasprit_bumrah_029a70c9.png',
  'IPL-057': '/assets/aistudio/mohammed_shami_8469d39d.jpg',
  'IPL-058': '/assets/aistudio/arshdeep_singh_e182acef.png',
  'IPL-059': '/assets/aistudio/kuldeep_yadav_6af8ab0a.png',
  'IPL-060': '/assets/aistudio/yuzvendra_chahal_149d1007.png',
  'IPL-061': '/assets/aistudio/mohammed_siraj_511e45c4.png',
  'IPL-062': '/assets/aistudio/Ravi_Bishnoi_5baed59c.jpg',
  'IPL-063': '/assets/aistudio/varun_chakravarthy_5ebbaace.jpg',
  'IPL-064': '/assets/aistudio/Bhuvneshwar_Kumar_287d8848.jpg',
  'IPL-065': '/assets/aistudio/natarajan_5860450a.png',
  'IPL-066': '/assets/aistudio/deepak_chahar_a8a59de5.png',
  'IPL-067': '/assets/aistudio/Avesh_Khan_91e27353.jpg',
  'IPL-068': '/assets/aistudio/khaleel_ahmed_d7f95f3d.png',
  'IPL-069': '/assets/aistudio/mukesh_kumar_506dd6f6.jpg',
  'IPL-070': '/assets/aistudio/PRASIDH_KRISHNA_5d2002e3.jpg',
  'IPL-071': '/assets/aistudio/umeshYadav_fcb5c970.png',
  'IPL-072': '/assets/aistudio/rashid_khan_57ff85ee.png',
  'IPL-073': '/assets/aistudio/mitchell_starc_92608f83.png',
  'IPL-074': '/assets/aistudio/trent_boult_0ecee0dc.png',
  'IPL-075': '/assets/aistudio/matheesha_pathirana_2c7bb12b.png',
  'IPL-076': '/assets/aistudio/kagiso_rabada_e44f0e24.png',
  'IPL-077': '/assets/aistudio/josh_hazlewood_4a7c4eb0.png',
  'IPL-078': '/assets/aistudio/jofra_archer_f3b0af0e.png',
  'IPL-079': '/assets/aistudio/Anrich_Nortje_64e6eddc.jpg',
  'IPL-080': '/assets/aistudio/noor-ahmed_4f1034a4.png',
  'IPL-081': '/assets/aistudio/hardik_pandya_9836a8ce.png',
  'IPL-082': '/assets/aistudio/ravindra_jadeja_7a1ba01f.png',
  'IPL-083': '/assets/aistudio/axar_patel_0f5e9471.png',
  'IPL-084': '/assets/aistudio/shivam_dube_1cf41563.png',
  'IPL-085': '/assets/aistudio/nitish_reddy_d0df6280.jpg',
  'IPL-086': '/assets/aistudio/washington_sundar_7fafce9f.jpeg',
  'IPL-087': '/assets/aistudio/abhishek_sharma_fb9ca871.jpeg',
  'IPL-088': '/assets/aistudio/Riyan_Parag_8ca6a683.jpg',
  'IPL-089': '/assets/aistudio/Venkatesh_Iyer_1de25fba.jpg',
  'IPL-090': '/assets/aistudio/Shardul_Thakur_61177de7.jpg',
  'IPL-091': '/assets/aistudio/krunal_pandya_ce2b6961.png',
  'IPL-092': '/assets/aistudio/deepak_hooda_f5951b25.png',
  'IPL-093': '/assets/aistudio/Vijay_Shankar_c269e1d8.jpg',
  'IPL-094': '/assets/aistudio/Shahbaz_Ahmed_3ca32b08.jpg',
  'IPL-095': '/assets/aistudio/Rahul_Tewatia_444ef2a7.jpg',
  'IPL-096': '/assets/aistudio/ramandeep_singh_ffabdfd6.jpg',
  'IPL-097': '/assets/aistudio/andre_russell_884e242c.png',
  'IPL-098': '/assets/aistudio/sunil_narine_c8b21b37.png',
  'IPL-099': '/assets/aistudio/cameron_green_904b72d1.jpg',
  'IPL-100': '/assets/aistudio/pat_cummins_c7e09471.png',
  'IPL-101': '/assets/aistudio/glenn_maxwell_640eef1a.png',
  'IPL-102': '/assets/aistudio/sam_curran_e3a8adb2.png',
  'IPL-103': '/assets/aistudio/Marcus_Stoinis_67377d8c.jpg',
  'IPL-105': '/assets/aistudio/Mitchell_Santner_81edd76e.png',
  'IPL-106': '/assets/aistudio/rishabh_pant_591d8b14.png',
  'IPL-107': '/assets/aistudio/kl_rahul_92b3fda4.png',
  'IPL-108': '/assets/aistudio/sanju_samson_e673fd3b.png',
  'IPL-109': '/assets/aistudio/ishan_kishan_9924a057.png',
  'IPL-110': '/assets/aistudio/dhruv_jurel_04e70861.jpg',
  'IPL-111': '/assets/aistudio/jitesh_sharma_03a4abc1.png',
  'IPL-112': '/assets/aistudio/Wriddhiman_Saha_143db3a1.jpg',
  'IPL-114': '/assets/aistudio/Prabhsimran_Singh_f9313927.jpg',
  'IPL-115': '/assets/aistudio/Abhishek_porel_de49f301.jpg',
  'IPL-116': '/assets/aistudio/anuj_rawat_244cdb7e.jpeg',
  'IPL-117': '/assets/aistudio/Narayan_Jagadeesan_f2fc66c8.jpg',
  'IPL-118': '/assets/aistudio/Upendra_Yadav_3999e87d.jpg',
  'IPL-119': '/assets/aistudio/Vishnu_Vinod_fea5ae82.jpg',
  'IPL-120': '/assets/aistudio/Sheldon_Jackson_c19fcfed.jpg',
  'IPL-121': '/assets/aistudio/Baba_Indrajith_13b05aee.jpg',
  'IPL-122': '/assets/aistudio/jos_buttler_9c531ee1.png',
  'IPL-123': '/assets/aistudio/heinrich_kalssen_bf8e32f1.png',
  'IPL-124': '/assets/aistudio/nicholas_pooran_0d53dd2b.png',
  'IPL-125': '/assets/aistudio/phil_salt_60a6bf11.jpeg',
  'IPL-126': '/assets/aistudio/quinton_de_kock_cda909c5.png',
  'IPL-127': '/assets/aistudio/Rahmanullah_Gurbaz_87d6d3f4.jpg',
  'IPL-128': '/assets/aistudio/Jonny_Bairstow_10a0a332.jpg',
  'IPL-129': '/assets/aistudio/Devon_Conway_45faa564.jpg',
  'IPL-130': '/assets/aistudio/Josh_Inglis_be3e8b0f.jpg',
  'IPL-131': '/assets/aistudio/Shashank_Singh_d3288b8f.jpg',
  'IPL-132': '/assets/aistudio/ashutosh_sharma_0ae82323.jpeg',
  'IPL-133': '/assets/aistudio/Nehal_Wadhera_9aad62da.jpg',
  'IPL-134': '/assets/aistudio/angkrish_raghuvanshi_0ef0a26d.png',
  'IPL-135': '/assets/aistudio/sameer_rizvi_eb3d06ca.png',
  'IPL-136': '/assets/aistudio/Ayush_Badoni_c84a7175.jpg',
  'IPL-137': '/assets/aistudio/Naman_Dhir_ca96ca1d.jpg',
  'IPL-138': '/assets/aistudio/Abhinav_Manohar_bffce799.jpg',
  'IPL-139': '/assets/aistudio/abdul_samad_4546d06b.png',
  'IPL-140': '/assets/aistudio/Mahipal_Lomror_748d0508.jpg',
  'IPL-141': '/assets/aistudio/Atharva_Taide_7db6841d.jpg',
  'IPL-143': '/assets/aistudio/swastik_chikara_39ac0f2f.png',
  'IPL-144': '/assets/aistudio/Shaik_Rasheed_b15ce741.jpg',
  'IPL-145': '/assets/aistudio/Musheer_Khan_78724971.jpg',
  'IPL-146': '/assets/aistudio/priyansh_arya_8712e741.jpg',
  'IPL-156': '/assets/aistudio/harshit_rana_f0c7a1d5.jpg',
  'IPL-157': '/assets/aistudio/Mayank_Yadav_95db6776.jpg',
  'IPL-158': '/assets/aistudio/yash_dayal_af92f651.png',
  'IPL-159': '/assets/aistudio/vaibhav_arora_e6cab149.png',
  'IPL-160': '/assets/aistudio/mohsin_khan_ba8a0b0f.jpg',
  'IPL-161': '/assets/aistudio/AKASH_MADHWAL_b9c461ab.jpg',
  'IPL-162': '/assets/aistudio/suyash_sharma_ccea5ae2.png',
  'IPL-166': '/assets/aistudio/rashik_salam_0f40b446.png',
  'IPL-167': '/assets/aistudio/vijaykumar_vyshak_6c8d1e37.png',
};

// Hotlinked clean broadcast player portraits from the provided Stitch HTML designs
const HOTLINK_PORTRAITS: Record<string, string> = {
  'IPL-073':
    'https://lh3.googleusercontent.com/aida-public/AB6AXuA6HM2iINepMwmQ9sC3pQ-uBKCBaQpCwHORu_9jp1smeVNNoeuFGPW5Ik1rnMsMi0Zg_MJV6L3MAqjH_S61CPEpgIZq_4NCqWtA0rfqhbYR3_2KI--7QqD8oOqFnA9gwJ0W7F5-5ZDw-IVLV3XzbTjncbc4_Kkbt9coO36dZcg-O-GwBN7GOaUVany2dCFPAmKKQu0dh3y33DuO7xmiZMYEdKtExyOqyrc6fEjSfcZDj2TCL1P1WMea62xO_niycbnztB42xKMSH5PI',
  'IPL-081':
    'https://lh3.googleusercontent.com/aida-public/AB6AXuD7I6i-gM340dgvD5j9GcBbhpMKnKQPLuNSCLaeoEgPu8l-Ca6gI3TUYt0F-Zf5egOCdo_-19nUnF_tW1v93HxzOPZ48XLY-3uSI-Yv4rMcNKMiJOcPlErThB1D71xPlYfZblXPilFVpbMBShhV95IXHRrUtHoQ-mgLip7-XRDw2mBejr5KaPpYpB--LzKtzqghC5njurW9MxnCnHrxQLPloX0GXB8-MbiW0tnZhLiBtilXl1TBVTa90oydOaowVHCbL2-d_syxI_fT',
};

const DECK_ACCENTS: Record<number, { bg: string; ring: string; text: string }> = {
  1: { bg: 'from-[#2e244d] via-[#1c192f] to-[#0e0b21]', ring: 'border-[#fdb813]/40', text: 'text-[#ffdb9f]' },
  2: { bg: 'from-[#1f2c4d] via-[#1c192f] to-[#0e0b21]', ring: 'border-[#4f8ef7]/40', text: 'text-[#a8c7ff]' },
  3: { bg: 'from-[#1a3338] via-[#1c192f] to-[#0e0b21]', ring: 'border-[#4edea3]/40', text: 'text-[#6ffbbe]' },
  4: { bg: 'from-[#35243b] via-[#1c192f] to-[#0e0b21]', ring: 'border-[#ee7fb8]/40', text: 'text-[#ffd6d8]' },
  5: { bg: 'from-[#2e2a1f] via-[#1c192f] to-[#0e0b21]', ring: 'border-[#f2c14e]/40', text: 'text-[#ffdea7]' },
  6: { bg: 'from-[#22243c] via-[#1c192f] to-[#0e0b21]', ring: 'border-[#9b7bf0]/40', text: 'text-[#e6defe]' },
  7: { bg: 'from-[#242c33] via-[#1c192f] to-[#0e0b21]', ring: 'border-[#3aa6a0]/40', text: 'text-[#a3e8e2]' },
};

const WIDE_CREST_BACKDROPS: Record<string, string> = {
  'IPL-T01': 'radial-gradient(circle at 50% 50%, #5c0d25 0%, #560b22 72%, #47081c 100%)', // LSG
  'IPL-T04': 'radial-gradient(circle at 50% 50%, #0257a6 0%, #014a91 68%, #01356b 100%)', // GT
  'IPL-T05': 'radial-gradient(circle at 50% 50%, #e7007c 0%, #de0075 72%, #bd0062 100%)', // RR
  'IPL-T06': 'radial-gradient(circle at 50% 45%, #f54e00 0%, #eb4200 68%, #cc3300 100%)', // SRH
};

export function isWideCrestFranchise(playerId: string): boolean {
  return playerId in WIDE_CREST_BACKDROPS;
}

export function getWideCrestBackdrop(playerId: string): string | null {
  return WIDE_CREST_BACKDROPS[playerId] ?? null;
}

export function getFranchiseBannerSrc(playerId: string): string | null {
  return UPLOADED_FRANCHISE_BANNERS[playerId] ?? null;
}

export function getPlayerImageSrc(player: Pick<Player | BriefPlayer, 'id' | 'photo' | 'hasPhoto'>): string | null {
  if (UPLOADED_FRANCHISE_BANNERS[player.id]) {
    return UPLOADED_FRANCHISE_BANNERS[player.id];
  }
  if (player.hasPhoto && player.photo) {
    return player.photo;
  }
  if (UPLOADED_PLAYER_PHOTOS[player.id]) {
    return UPLOADED_PLAYER_PHOTOS[player.id];
  }
  return HOTLINK_PORTRAITS[player.id] ?? null;
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getDeckAccent(deck: number) {
  return DECK_ACCENTS[deck] ?? DECK_ACCENTS[1];
}
