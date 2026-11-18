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
  'IPL-006': '/assets/aistudio/yuvarajSingh_dc313e21.png',
  'IPL-009': '/assets/aistudio/shikhar_dhawan_742dd859.jpeg',
  'IPL-010': '/assets/aistudio/ravichandran_ashwin_f9c4b0c9.png',
  'IPL-021': '/assets/aistudio/abd_f02cc942.jfif',
  'IPL-022': '/assets/aistudio/chris_gayle_42edeeeb.jpeg',
  'IPL-034': '/assets/aistudio/ruturaj_gaikwad_05702c6f.jpg',
  'IPL-035': '/assets/aistudio/shreyas_iyer_d14effc5.png',
  'IPL-038': '/assets/aistudio/sai_sudharsan_f1dbf56a.png',
  'IPL-039': '/assets/aistudio/rajat_patidar_c6b6455d.png',
  'IPL-040': '/assets/aistudio/ajinkya_rahane_e12b8872.png',
  'IPL-043': '/assets/aistudio/prithvi_shaw_d26a5ccc.png',
  'IPL-044': '/assets/aistudio/devdutt_padikkal_1ea21a76.png',
  'IPL-045': '/assets/aistudio/rahul_tripathi_1381a605.png',
  'IPL-048': '/assets/aistudio/faf_duplessis_3282e808.png',
  'IPL-050': '/assets/aistudio/kane_willamson_bc16f635.png',
  'IPL-051': '/assets/aistudio/Shimron-Hetmyer_b38b2558.png',
  'IPL-053': '/assets/aistudio/harry_brook_56462822.png',
  'IPL-056': '/assets/aistudio/jasprit_bumrah_029a70c9.png',
  'IPL-058': '/assets/aistudio/arshdeep_singh_e182acef.png',
  'IPL-059': '/assets/aistudio/kuldeep_yadav_6af8ab0a.png',
  'IPL-063': '/assets/aistudio/varun_chakravarthy_5ebbaace.jpg',
  'IPL-065': '/assets/aistudio/natarajan_5860450a.png',
  'IPL-066': '/assets/aistudio/deepak_chahar_a8a59de5.png',
  'IPL-067': '/assets/aistudio/Avesh_Khan_91e27353.jpg',
  'IPL-068': '/assets/aistudio/khaleel_ahmed_d7f95f3d.png',
  'IPL-069': '/assets/aistudio/mukesh_kumar_506dd6f6.jpg',
  'IPL-070': '/assets/aistudio/PRASIDH_KRISHNA_5d2002e3.jpg',
  'IPL-071': '/assets/aistudio/umeshYadav_fcb5c970.png',
  'IPL-075': '/assets/aistudio/matheesha_pathirana_2c7bb12b.png',
  'IPL-076': '/assets/aistudio/kagiso_rabada_e44f0e24.png',
  'IPL-077': '/assets/aistudio/josh_hazlewood_4a7c4eb0.png',
  'IPL-078': '/assets/aistudio/jofra_archer_f3b0af0e.png',
  'IPL-079': '/assets/aistudio/Anrich_Nortje_64e6eddc.jpg',
  'IPL-080': '/assets/aistudio/noor-ahmed_4f1034a4.png',
  'IPL-083': '/assets/aistudio/axar_patel_0f5e9471.png',
  'IPL-085': '/assets/aistudio/nitish_reddy_d0df6280.jpg',
  'IPL-086': '/assets/aistudio/washington_sundar_7fafce9f.jpeg',
  'IPL-087': '/assets/aistudio/abhishek_sharma_fb9ca871.jpeg',
  'IPL-088': '/assets/aistudio/Riyan_Parag_8ca6a683.jpg',
  'IPL-090': '/assets/aistudio/Shardul_Thakur_61177de7.jpg',
  'IPL-091': '/assets/aistudio/krunal_pandya_ce2b6961.png',
  'IPL-092': '/assets/aistudio/deepak_hooda_f5951b25.png',
  'IPL-097': '/assets/aistudio/andre_russell_884e242c.png',
  'IPL-099': '/assets/aistudio/cameron_green_904b72d1.jpg',
  'IPL-100': '/assets/aistudio/pat_cummins_c7e09471.png',
  'IPL-105': '/assets/aistudio/Mitchell_Santner_81edd76e.png',
  'IPL-107': '/assets/aistudio/kl_rahul_92b3fda4.png',
  'IPL-109': '/assets/aistudio/ishan_kishan_9924a057.png',
  'IPL-110': '/assets/aistudio/dhruv_jurel_04e70861.jpg',
  'IPL-111': '/assets/aistudio/jitesh_sharma_03a4abc1.png',
  'IPL-114': '/assets/aistudio/Prabhsimran_Singh_f9313927.jpg',
  'IPL-115': '/assets/aistudio/Abhishek_porel_de49f301.jpg',
  'IPL-116': '/assets/aistudio/anuj_rawat_244cdb7e.jpeg',
  'IPL-119': '/assets/aistudio/Vishnu_Vinod_fea5ae82.jpg',
  'IPL-122': '/assets/aistudio/jos_buttler_9c531ee1.png',
  'IPL-124': '/assets/aistudio/nicholas_pooran_0d53dd2b.png',
  'IPL-125': '/assets/aistudio/phil_salt_60a6bf11.jpeg',
  'IPL-131': '/assets/aistudio/Shashank_Singh_d3288b8f.jpg',
  'IPL-132': '/assets/aistudio/ashutosh_sharma_0ae82323.jpeg',
  'IPL-133': '/assets/aistudio/Nehal_Wadhera_9aad62da.jpg',
  'IPL-134': '/assets/aistudio/angkrish_raghuvanshi_0ef0a26d.png',
  'IPL-135': '/assets/aistudio/sameer_rizvi_eb3d06ca.png',
  'IPL-136': '/assets/aistudio/Ayush_Badoni_c84a7175.jpg',
  'IPL-139': '/assets/aistudio/abdul_samad_4546d06b.png',
  'IPL-141': '/assets/aistudio/Atharva_Taide_7db6841d.jpg',
  'IPL-144': '/assets/aistudio/Shaik_Rasheed_b15ce741.jpg',
  'IPL-145': '/assets/aistudio/Musheer_Khan_78724971.jpg',
  'IPL-146': '/assets/aistudio/priyansh_arya_8712e741.jpg',
  'IPL-156': '/assets/aistudio/harshit_rana_f0c7a1d5.jpg',
  'IPL-157': '/assets/aistudio/Mayank_Yadav_95db6776.jpg',
  'IPL-160': '/assets/aistudio/mohsin_khan_ba8a0b0f.jpg',
  'IPL-161': '/assets/aistudio/AKASH_MADHWAL_b9c461ab.jpg',
  'IPL-166': '/assets/aistudio/rashik_salam_0f40b446.png',
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
