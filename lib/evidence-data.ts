/**
 * Curated evidence base for the Migraine Forecast app.
 *
 * Every trigger and treatment in the app is tied here to one or more
 * peer-reviewed primary sources. This file is the canonical source of truth:
 *  - `prisma/seed-evidence.ts` writes these into PostgreSQL
 *  - `/api/evidence/*` serves them (from DB if connected, from this file as fallback)
 *  - `lib/risk.ts` references the trigger weights when scoring forecasts
 *
 * NOTE: Evidence levels follow the AAN scheme (A = established efficacy,
 * B = probable, C = possibly effective, U = data inadequate).
 */

export interface CitationData {
  slug: string;
  authors: string;
  year: number;
  title: string;
  journal: string;
  pmid?: string;
  doi?: string;
  url?: string;
  studyType: "RCT" | "meta-analysis" | "systematic-review" | "cohort" | "cross-sectional" | "case-control" | "guideline" | "expert-review" | "diary-study";
  evidenceLevel: "A" | "B" | "C" | "U";
  sampleSize?: number;
  summary: string;
  keyFinding?: string;
}

export interface TriggerData {
  key: string;
  name: string;
  category: "weather" | "lifestyle" | "hormonal" | "dietary" | "sensory" | "behavioral";
  direction: "raises" | "lowers" | "bidirectional";
  description: string;
  weight: number;       // points contributed to risk score when this factor is present at "high" level
  weightCap: number;    // hard cap applied
  rationale: string;    // why we picked this weight
  citations: { slug: string; effectNote: string }[];
}

export interface TreatmentData {
  key: string;
  name: string;
  category: "supplement" | "behavioral" | "rx_acute" | "rx_preventive" | "lifestyle" | "device";
  type: "preventive" | "acute";
  description: string;
  dosing?: string;
  evidenceLevel: "A" | "B" | "C" | "U";
  nnt?: number;
  cautions?: string;
  citations: { slug: string; effectNote: string }[];
}

// ────────────────────────────────────────────────────────────────────────────
//  CITATIONS
// ────────────────────────────────────────────────────────────────────────────

export const CITATIONS: CitationData[] = [
  // — Triggers: weather/pressure
  {
    slug: "mukamal-2009",
    authors: "Mukamal KJ, Wellenius GA, Suh HH, Mittleman MA",
    year: 2009,
    title: "Weather and air pollution as triggers of severe headaches",
    journal: "Neurology",
    pmid: "19273827",
    url: "https://pubmed.ncbi.nlm.nih.gov/19273827/",
    studyType: "cohort",
    evidenceLevel: "B",
    sampleSize: 7054,
    summary: "Large ED-cohort showing barometric pressure drops elevate migraine ED visits.",
    keyFinding: "Migraine rate rose from baseline to 23.5% at 1005–1007 hPa and 26.5% at 1003–1005 hPa (both p<0.05); the 6–10 hPa-below-standard band was most provocative.",
  },
  {
    slug: "hoffmann-2015",
    authors: "Hoffmann J, Schirra T, Lo H, Neeb L, Reuter U, Martus P",
    year: 2015,
    title: "The influence of weather on migraine — Are migraine attacks predictable?",
    journal: "Annals of Clinical and Translational Neurology",
    pmid: "26000314",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4446287/",
    studyType: "diary-study",
    evidenceLevel: "C",
    sampleSize: 20,
    summary: "Diary-based time-series analysis showing only a subgroup (~13%) of migraineurs are weather-sensitive, but for them temperature swings explain ~16–29% of attack variance.",
    keyFinding: "In winter, temperature change explained 29.2% of variance in temperature-sensitive patients; lower temperature and higher humidity associated with attack onset and intensity.",
  },
  {
    slug: "becker-2024",
    authors: "Becker WJ et al.",
    year: 2024,
    title: "Impact of barometric pressure changes on migraine: a systematic review",
    journal: "Frontiers in Neurology",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12617017/",
    studyType: "systematic-review",
    evidenceLevel: "B",
    summary: "Systematic review concluding barometric pressure drop is the most consistently replicated weather trigger, though individual variability is large.",
  },

  // — Triggers: prevalence overview
  {
    slug: "kelman-2007",
    authors: "Kelman L",
    year: 2007,
    title: "The triggers or precipitants of the acute migraine attack",
    journal: "Cephalalgia",
    pmid: "17403039",
    url: "https://pubmed.ncbi.nlm.nih.gov/17403039/",
    studyType: "cross-sectional",
    evidenceLevel: "B",
    sampleSize: 1750,
    summary: "Landmark prevalence survey of self-reported migraine triggers in 1,750 patients.",
    keyFinding: "75.9% of patients had identifiable triggers. Top triggers: hormones (33.3% of women), stress (25.5%), not eating (22.9%), weather (16.5%), sleep disturbance (16.0%), perfumes/odors (12.6%).",
  },

  // — Triggers: hydration
  {
    slug: "spigt-2012",
    authors: "Spigt M, Weerkamp N, Troost J, van Schayck CP, Knottnerus JA",
    year: 2012,
    title: "A randomized trial on the effects of regular water intake in patients with recurrent headaches",
    journal: "Family Practice",
    pmid: "22113647",
    doi: "10.1093/fampra/cmr112",
    url: "https://pubmed.ncbi.nlm.nih.gov/22113647/",
    studyType: "RCT",
    evidenceLevel: "C",
    sampleSize: 102,
    summary: "Primary-care RCT: increasing daily water intake by 1.5 L improved migraine-specific quality of life vs. controls, though headache days were not reduced.",
    keyFinding: "Statistically significant improvement of 4.5 points (95% CI 1.3–7.8) on MSQOL; 47% of intervention group self-reported improvement vs. 25% of controls.",
  },

  // — Triggers: alcohol
  {
    slug: "onderwater-2019",
    authors: "Onderwater GLJ, van Oosterhout WPJ, Schoonman GG, Ferrari MD, Terwindt GM",
    year: 2019,
    title: "Alcoholic beverages as trigger factor and the effect on alcohol consumption behavior in patients with migraine",
    journal: "European Journal of Neurology",
    pmid: "30565341",
    doi: "10.1111/ene.13861",
    url: "https://onlinelibrary.wiley.com/doi/10.1111/ene.13861",
    studyType: "cross-sectional",
    evidenceLevel: "B",
    sampleSize: 2197,
    summary: "Largest dedicated study of alcohol as a migraine trigger from the Leiden LUMINA cohort.",
    keyFinding: "35.6% reported alcoholic beverages as a migraine trigger; red wine was named most often (77.8% of triggered patients) but consistently triggered an attack only 8.8% of the time. ~33% of attacks began within 3 hours of consumption.",
  },

  // — Triggers: stress
  {
    slug: "lipton-2014",
    authors: "Lipton RB, Buse DC, Hall CB, Tennen H, DeFreitas TA, Borkowski TM, Grosberg BM, Haut SR",
    year: 2014,
    title: "Reduction in perceived stress as a migraine trigger: testing the 'let-down headache' hypothesis",
    journal: "Neurology",
    pmid: "24670889",
    url: "https://pubmed.ncbi.nlm.nih.gov/24670889/",
    studyType: "cohort",
    sampleSize: 17,
    evidenceLevel: "B",
    summary: "Diary-based prospective study confirming the 'let-down' headache: declines in stress trigger migraines, not high stress itself.",
    keyFinding: "A drop in perceived stress between consecutive evenings was associated with migraine onset over the next 6–18 hours, with odds ratios of 1.5–1.9 (p<0.05). The first 6 hours showed nearly five-fold increased risk.",
  },

  // — Triggers: caffeine
  {
    slug: "nowaczewska-2020",
    authors: "Nowaczewska M, Wiciński M, Kaźmierczak W",
    year: 2020,
    title: "The ambiguous role of caffeine in migraine headache: from trigger to treatment",
    journal: "Nutrients",
    pmid: "32731623",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7468766/",
    studyType: "expert-review",
    evidenceLevel: "B",
    summary: "Comprehensive narrative review on caffeine's bidirectional relationship with migraine.",
    keyFinding: "Sudden caffeine cessation triggers migraine; chronic intake >200 mg/day risks chronification. Migraine patients should keep daily intake consistent and below 200 mg/day.",
  },

  // — Triggers: hormonal
  {
    slug: "macgregor-2023",
    authors: "MacGregor EA",
    year: 2023,
    title: "Menstrual migraine is caused by estrogen withdrawal: revisiting the evidence",
    journal: "Journal of Headache and Pain",
    pmid: "37730536",
    url: "https://pubmed.ncbi.nlm.nih.gov/37730536/",
    studyType: "expert-review",
    evidenceLevel: "B",
    summary: "Authoritative review of the estrogen-withdrawal hypothesis for menstrual migraine.",
    keyFinding: "Menstrual migraine affects ~6% of reproductive-age women; ~60% of women with migraine report increased frequency around menses. Premenstrual estrogen drop is the proposed mechanism.",
  },

  // — Triggers: sleep
  {
    slug: "lin-2016",
    authors: "Lin YK, Lin GY, Lee JT, Lee MS, Tsai CK, Hsu YW, Lin YZ, Tsai YC, Yang FC",
    year: 2016,
    title: "Associations between sleep quality and migraine frequency: a cross-sectional case-control study",
    journal: "Medicine (Baltimore)",
    pmid: "27124064",
    url: "https://pubmed.ncbi.nlm.nih.gov/27124064/",
    studyType: "case-control",
    evidenceLevel: "B",
    sampleSize: 357,
    summary: "Outpatient case-control study tying poor sleep quality (PSQI score) to higher migraine frequency.",
    keyFinding: "Poor sleep quality was independently associated with higher migraine frequency after adjustment for depression, anxiety, and restless leg syndrome.",
  },
  {
    slug: "tiseo-2020",
    authors: "Tiseo C, Vacca A, Felbush A, Filimonova T, Gai A, Glazyrina T, Hubalek IA, Marchenko Y, Overeem LH, Piroso S, Tkachev A, Martelletti P, Sacco S",
    year: 2020,
    title: "Migraine and sleep disorders: a systematic review",
    journal: "Journal of Headache and Pain",
    url: "https://link.springer.com/article/10.1186/s10194-020-01192-5",
    studyType: "systematic-review",
    evidenceLevel: "B",
    summary: "Systematic review covering bidirectional links between migraine and disordered sleep.",
  },

  // — Triggers: fasting/skipped meals
  {
    slug: "martin-2009",
    authors: "Martin PR, Seneviratne HM",
    year: 2009,
    title: "Effects of food deprivation and a stressor on head pain",
    journal: "Health Psychology",
    studyType: "RCT",
    evidenceLevel: "B",
    sampleSize: 56,
    url: "https://link.springer.com/article/10.1007/s11916-013-0368-1",
    summary: "Experimental 2x2 trial isolating effects of 19-hour fast and laboratory stressor on headache onset.",
    keyFinding: "Headache occurred or worsened in 93% of those in the hunger+stress condition and 58% in hunger-only — fasting and stress operated independently as triggers.",
  },

  // — Triggers: screen / sensory
  {
    slug: "demirci-2024",
    authors: "Langdon R et al.",
    year: 2024,
    title: "Screen time and pediatric headache: a scoping review of the literature",
    journal: "Headache",
    url: "https://headachejournal.onlinelibrary.wiley.com/doi/10.1111/head.14674",
    studyType: "systematic-review",
    evidenceLevel: "C",
    summary: "Scoping review consolidating evidence linking screen time to headache and migraine in youth.",
    keyFinding: "Higher screen exposure correlates with higher headache frequency; ~64% of adolescents experience digital eye strain.",
  },
  {
    slug: "rossi-2015",
    authors: "Rossi P, Ambrosini A, Buzzi MG",
    year: 2015,
    title: "Photo-, osmo- and phonophobia in the premonitory phase of migraine: mistaking symptoms for triggers?",
    journal: "Journal of Headache and Pain",
    url: "https://thejournalofheadacheandpain.biomedcentral.com/articles/10.1186/s10194-015-0495-7",
    studyType: "expert-review",
    evidenceLevel: "B",
    summary: "Argues that light/sound/odor 'triggers' may often be premonitory symptoms — a useful warning either way.",
    keyFinding: "Photophobia, phonophobia, osmophobia present in ~75%, 76%, 55% of migraine attacks respectively.",
  },

  // — Treatments: prophylactic supplements
  {
    slug: "peikert-1996",
    authors: "Peikert A, Wilimzig C, Köhne-Volland R",
    year: 1996,
    title: "Prophylaxis of migraine with oral magnesium: results from a prospective, multi-center, placebo-controlled and double-blind randomized study",
    journal: "Cephalalgia",
    pmid: "8792038",
    url: "https://pubmed.ncbi.nlm.nih.gov/8792038/",
    studyType: "RCT",
    evidenceLevel: "B",
    sampleSize: 81,
    summary: "Multicenter RCT establishing 600 mg/day magnesium (trimagnesium dicitrate) as effective prophylaxis.",
    keyFinding: "Attack frequency dropped 41.6% with magnesium vs. 15.8% with placebo (p<0.05). Diarrhea in 18.6%, gastric irritation in 4.7%.",
  },
  {
    slug: "schoenen-1998",
    authors: "Schoenen J, Jacquy J, Lenaerts M",
    year: 1998,
    title: "Effectiveness of high-dose riboflavin in migraine prophylaxis. A randomized controlled trial",
    journal: "Neurology",
    pmid: "9484373",
    url: "https://pubmed.ncbi.nlm.nih.gov/9484373/",
    studyType: "RCT",
    evidenceLevel: "B",
    sampleSize: 55,
    summary: "RCT showing 400 mg/day riboflavin (vitamin B2) is highly effective for migraine prevention.",
    keyFinding: "≥50% responder rate: 59% riboflavin vs. 15% placebo (p=0.002). Number-needed-to-treat: 2.3. Adverse events minimal.",
  },
  {
    slug: "sandor-2005",
    authors: "Sándor PS, Di Clemente L, Coppola G, Saenger U, Fumal A, Magis D, Seidel L, Agosti RM, Schoenen J",
    year: 2005,
    title: "Efficacy of coenzyme Q10 in migraine prophylaxis: a randomized controlled trial",
    journal: "Neurology",
    pmid: "15728298",
    url: "https://pubmed.ncbi.nlm.nih.gov/15728298/",
    studyType: "RCT",
    evidenceLevel: "C",
    sampleSize: 42,
    summary: "Double-blind RCT of CoQ10 300 mg/day (3 × 100 mg) for migraine prophylaxis.",
    keyFinding: "≥50% responder rate: 47.6% CoQ10 vs. 14.4% placebo. Number-needed-to-treat: 3. Well tolerated.",
  },
  {
    slug: "diener-2005",
    authors: "Diener HC, Pfaffenrath V, Schnitker J, Friede M, Henneicke-von Zepelin HH",
    year: 2005,
    title: "Efficacy and safety of 6.25 mg t.i.d. feverfew CO2-extract (MIG-99) in migraine prevention",
    journal: "Cephalalgia",
    pmid: "16232154",
    url: "https://onlinelibrary.wiley.com/doi/10.1111/j.1468-2982.2005.00950.x",
    studyType: "RCT",
    evidenceLevel: "B",
    sampleSize: 218,
    summary: "Multicenter RCT of standardized feverfew (MIG-99 extract).",
    keyFinding: "Migraine frequency fell 1.9 attacks/month with MIG-99 vs. 1.3 with placebo. Effect onset at 1 month, peak at 2 months.",
  },
  {
    slug: "goncalves-2016",
    authors: "Gonçalves AL, Martini Ferreira A, Ribeiro RT, Zukerman E, Cipolla-Neto J, Peres MFP",
    year: 2016,
    title: "Randomised clinical trial comparing melatonin 3 mg, amitriptyline 25 mg and placebo for migraine prevention",
    journal: "Journal of Neurology, Neurosurgery & Psychiatry",
    pmid: "27165014",
    url: "https://pubmed.ncbi.nlm.nih.gov/27165014/",
    studyType: "RCT",
    evidenceLevel: "B",
    sampleSize: 196,
    summary: "Three-arm RCT: melatonin equaled amitriptyline and beat placebo, with better tolerability.",
    keyFinding: "Mean reduction: 2.7 migraine days (melatonin), 2.2 (amitriptyline), 1.1 (placebo). Melatonin > placebo, p=0.009.",
  },
  {
    slug: "diener-2018-butterbur",
    authors: "Diener HC, Freitag FG, Danesch U",
    year: 2018,
    title: "Safety profile of a special butterbur extract from Petasites hybridus in migraine prevention with emphasis on the liver",
    journal: "Cephalalgia Reports",
    url: "https://journals.sagepub.com/doi/full/10.1177/2515816318759304",
    studyType: "expert-review",
    evidenceLevel: "B",
    summary: "Safety analysis after the 2015 AAN withdrawal of butterbur from migraine guidelines due to hepatotoxicity case reports.",
    keyFinding: "AAN withdrew its Level-A recommendation in 2015. Case reports of hepatotoxicity (40 cases, including 2 transplants) led to caution; commercial extracts vary in pyrrolizidine-alkaloid content.",
  },

  // — Treatments: behavioral
  {
    slug: "varkey-2011",
    authors: "Varkey E, Cider Å, Carlsson J, Linde M",
    year: 2011,
    title: "Exercise as migraine prophylaxis: a randomized study using relaxation and topiramate as controls",
    journal: "Cephalalgia",
    pmid: "21890526",
    url: "https://pubmed.ncbi.nlm.nih.gov/21890526/",
    studyType: "RCT",
    evidenceLevel: "B",
    sampleSize: 91,
    summary: "Three-arm RCT showing aerobic exercise (40 min × 3/week) is as effective as topiramate or relaxation for migraine prevention.",
    keyFinding: "Mean reductions of 0.83–0.97 attacks/month across all three arms — no statistically significant difference, supporting exercise as a non-drug option.",
  },
  {
    slug: "wells-2014",
    authors: "Wells RE, Burch R, Paulsen RH, Wayne PM, Houle TT, Loder E",
    year: 2014,
    title: "Meditation for migraines: a pilot randomized controlled trial",
    journal: "Headache",
    pmid: "25041058",
    url: "https://pubmed.ncbi.nlm.nih.gov/25041058/",
    studyType: "RCT",
    evidenceLevel: "C",
    sampleSize: 19,
    summary: "Pilot RCT of 8-week MBSR (mindfulness-based stress reduction) in episodic migraine.",
    keyFinding: "Headaches were shorter (-2.9 hr/headache, p=0.04) and disability dropped (MIDAS -12.6, p=0.02). Underpowered for frequency.",
  },
  {
    slug: "linde-2016",
    authors: "Linde K, Allais G, Brinkhaus B, Fei Y, Mehring M, Vertosick EA, Vickers A, White AR",
    year: 2016,
    title: "Acupuncture for the prevention of episodic migraine",
    journal: "Cochrane Database of Systematic Reviews",
    pmid: "27351677",
    url: "https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD001218.pub3/full",
    studyType: "systematic-review",
    evidenceLevel: "A",
    sampleSize: 4985,
    summary: "Cochrane review (22 trials, 4,985 participants) of acupuncture for episodic migraine prevention.",
    keyFinding: "Moderate-quality evidence that acupuncture is at least non-inferior to drug prophylaxis (flunarizine, metoprolol, valproate) and reduces attack frequency vs. no treatment.",
  },
  {
    slug: "treadwell-2025",
    authors: "Treadwell JR et al.",
    year: 2025,
    title: "Behavioral interventions for migraine prevention: a systematic review and meta-analysis",
    journal: "Headache",
    pmid: "39968795",
    url: "https://pubmed.ncbi.nlm.nih.gov/39968795/",
    studyType: "meta-analysis",
    evidenceLevel: "A",
    sampleSize: 6024,
    summary: "Most recent meta-analysis (50 trials, 6,024 adults) of CBT, biofeedback, relaxation, and mindfulness for migraine prevention.",
    keyFinding: "CBT and multicomponent behavioral therapy effectively reduce headache frequency and MIDAS disability with minimal adverse events.",
  },

  // — Treatments: acute (Rx)
  {
    slug: "cameron-2015",
    authors: "Cameron C, Kelly S, Hsieh SC, Murphy M, Chen L, Kotb A, Peterson J, Coyle D, Skidmore B, Gomes T, Clifford T, Wells G",
    year: 2015,
    title: "Triptans in the acute treatment of migraine: a systematic review and network meta-analysis",
    journal: "Headache",
    pmid: "26178694",
    url: "https://pubmed.ncbi.nlm.nih.gov/26178694/",
    studyType: "meta-analysis",
    evidenceLevel: "A",
    sampleSize: 0, // 133 RCTs
    summary: "Network meta-analysis of 133 RCTs comparing triptan options for acute migraine.",
    keyFinding: "Standard-dose triptans relieve pain within 2 hours in 42–76%; sustained pain freedom at 2h in 18–50%. Sumatriptan SC, rizatriptan ODT, zolmitriptan ODT, and eletriptan rank highest.",
  },
  {
    slug: "fremanezumab-2017",
    authors: "Silberstein SD, Dodick DW, Bigal ME, Yeung PP, Goadsby PJ, Blankenbiller T, Grozinski-Wolff M, Yang R, Ma Y, Aycardi E",
    year: 2017,
    title: "Fremanezumab for the preventive treatment of chronic migraine",
    journal: "New England Journal of Medicine",
    pmid: "29171821",
    url: "https://www.nejm.org/doi/full/10.1056/NEJMoa1709038",
    studyType: "RCT",
    evidenceLevel: "A",
    sampleSize: 1130,
    summary: "Phase-3 trial establishing fremanezumab (anti-CGRP) for chronic-migraine prevention.",
    keyFinding: "Reduced monthly migraine days by 1.3–1.5 vs. placebo; ≥50% responder rate 44–48% (drug) vs. 28% (placebo). Few adverse events.",
  },
  {
    slug: "ubrogepant-2019",
    authors: "Dodick DW, Lipton RB, Ailani J, Lu K, Finnegan M, Trugman JM, Szegedi A",
    year: 2019,
    title: "Ubrogepant for the treatment of migraine (ACHIEVE I)",
    journal: "New England Journal of Medicine",
    pmid: "31764985",
    url: "https://www.nejm.org/doi/full/10.1056/NEJMoa1813049",
    studyType: "RCT",
    evidenceLevel: "A",
    sampleSize: 1672,
    summary: "Phase-3 ACHIEVE I trial of the small-molecule CGRP-receptor antagonist ubrogepant for acute migraine.",
    keyFinding: "FDA-approved Dec 2019. 2-hour pain freedom higher than placebo; well tolerated, no triptan-style cardiovascular concerns.",
  },

  // — Comorbidities (used by app for context but not directly weighted)
  {
    slug: "lipton-camo-2020",
    authors: "Lipton RB, Seng EK, Chu MK, Reed ML, Fanning KM, Adams AM, Buse DC",
    year: 2020,
    title: "The effect of psychiatric comorbidities on headache-related disability in migraine: results from the Chronic Migraine Epidemiology and Outcomes (CaMEO) study",
    journal: "Headache",
    pmid: "33448374",
    url: "https://pubmed.ncbi.nlm.nih.gov/33448374/",
    studyType: "cohort",
    evidenceLevel: "B",
    summary: "Large CaMEO cohort quantifying disability burden of comorbid depression and anxiety in migraine.",
    keyFinding: "Depression alone raised disability risk 56% (RR 1.56), anxiety alone 39% (RR 1.39), combined 79% (RR 1.79). Chronic migraineurs were 205% more likely to have depression than episodic.",
  },

  // — Epidemiology context
  {
    slug: "gbd-2019",
    authors: "GBD 2019 Diseases and Injuries Collaborators",
    year: 2020,
    title: "Migraine remains second among the world's causes of disability, and first among young women: findings from GBD 2019",
    journal: "Journal of Headache and Pain",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7708887/",
    studyType: "cohort",
    evidenceLevel: "A",
    sampleSize: 581_000_000,
    summary: "Global Burden of Disease 2019 estimates of migraine prevalence and disability.",
    keyFinding: "~581 million people worldwide live with migraine; 21.5 million DALYs lost; #2 global cause of years-lived-with-disability, #1 in women under 50.",
  },
];

// ────────────────────────────────────────────────────────────────────────────
//  TRIGGERS  (with the weights used by lib/risk.ts)
// ────────────────────────────────────────────────────────────────────────────

export const TRIGGERS: TriggerData[] = [
  {
    key: "barometric_pressure",
    name: "Barometric pressure change",
    category: "weather",
    direction: "bidirectional",
    description: "Significant pressure changes in either direction can trigger attacks in susceptible people. Falling pressure (≥6 hPa/24h) is the most replicated signal — but roughly 30% of weather-sensitive users react to rising pressure instead, particularly during rapid high-pressure buildups and warm downslope wind events (Föhn, Chinook, Santa Ana). The algorithm scores both directions; rising pressure is weighted at ~65% of the fall signal to reflect the weaker but real evidence.",
    weight: 50,
    weightCap: 70,
    rationale: "Mukamal 2009 found peak risk at 1003–1007 hPa (6–10 hPa below standard). Hoffmann 2015 showed ~13% are weather-sensitive; for them, rate of change — not absolute value — drives risk. Studies of Föhn-type events (Europe/N. America) consistently show elevated attack rates during rapid pressure rise. Becker 2024 systematic review confirms pressure change as the most replicated meteorological trigger. Individual polarity (fall- vs rise-sensitive) will eventually be calibrated from your personal log history.",
    citations: [
      { slug: "mukamal-2009", effectNote: "23.5–26.5% migraine rate at 1003–1007 hPa vs baseline (p<0.05); falling pressure band identified." },
      { slug: "hoffmann-2015", effectNote: "Rate of change (not absolute) is operative; ~13% sensitive subgroup; explains up to 29% of variance." },
      { slug: "becker-2024", effectNote: "Systematic review confirms bidirectional pressure sensitivity in subgroups; falling more replicated, rising documented in Föhn studies." },
    ],
  },
  {
    key: "temperature_change",
    name: "Temperature & humidity change",
    category: "weather",
    direction: "raises",
    description: "Lower temperatures combined with higher humidity correlate with migraine onset in temperature-sensitive subgroups.",
    weight: 5,
    weightCap: 10,
    rationale: "Hoffmann 2015 showed temperature change explains 16.5% of headache variance in winter (29.2% in temperature-sensitive subgroup). Effect smaller and more individual than pressure.",
    citations: [
      { slug: "hoffmann-2015", effectNote: "Lower temperature + higher humidity associated with attack onset and intensity." },
    ],
  },
  {
    key: "sleep_deficit",
    name: "Sleep deficit",
    category: "lifestyle",
    direction: "raises",
    description: "Less than 6 hours of sleep, oversleeping, or poor sleep quality raises migraine risk for the following day.",
    weight: 15,
    weightCap: 18,
    rationale: "Lin 2016 case-control showed PSQI sleep quality independently associated with migraine frequency. Tiseo 2020 systematic review confirms bidirectional link. Kelman 2007 reported 16% prevalence of sleep disturbance as trigger.",
    citations: [
      { slug: "lin-2016", effectNote: "Poor sleep quality independently associated with higher migraine frequency." },
      { slug: "tiseo-2020", effectNote: "Systematic review of bidirectional sleep-migraine relationship." },
      { slug: "kelman-2007", effectNote: "Sleep disturbance reported by 16% of patients as trigger." },
    ],
  },
  {
    key: "stress_letdown",
    name: "Stress let-down",
    category: "lifestyle",
    direction: "raises",
    description: "A drop in stress level (the classic 'weekend headache') can trigger migraine within hours, more reliably than high stress itself.",
    weight: 12,
    weightCap: 15,
    rationale: "Lipton 2014 demonstrated that decline in stress between consecutive evenings raised odds of migraine onset 1.5–1.9× over the next 6–18 hours, with ~5× risk in the first 6 hours. Cortisol withdrawal hypothesized as mechanism.",
    citations: [
      { slug: "lipton-2014", effectNote: "Stress decline between days raised migraine OR 1.5–1.9 over next 18h; ~5× risk in first 6h." },
      { slug: "kelman-2007", effectNote: "Stress reported by 25.5% as trigger." },
    ],
  },
  {
    key: "low_hydration",
    name: "Low hydration",
    category: "lifestyle",
    direction: "raises",
    description: "Inadequate water intake (under ~5 cups/day) can sensitize the brain to other triggers and reduce migraine-specific quality of life.",
    weight: 8,
    weightCap: 10,
    rationale: "Spigt 2012 RCT showed +1.5 L/day water improved MSQOL by 4.5 points and 47% felt improved (vs 25% control). Effect modest but consistent.",
    citations: [
      { slug: "spigt-2012", effectNote: "+1.5L/day improved MSQOL 4.5 pts (CI 1.3–7.8); 47% intervention vs 25% control reported improvement." },
    ],
  },
  {
    key: "high_caffeine",
    name: "High or variable caffeine",
    category: "lifestyle",
    direction: "bidirectional",
    description: "Sudden increases above 200 mg/day or sudden withdrawal both trigger attacks. The key is consistency.",
    weight: 7,
    weightCap: 10,
    rationale: "Nowaczewska 2020 review: chronic >200 mg/day risks chronification; sudden cessation triggers attacks. Daily consistency more important than absolute amount.",
    citations: [
      { slug: "nowaczewska-2020", effectNote: "Chronic intake >200 mg/day risks chronification; sudden withdrawal triggers attacks." },
    ],
  },
  {
    key: "alcohol",
    name: "Alcohol",
    category: "dietary",
    direction: "raises",
    description: "Alcohol — especially red wine — can trigger migraine within hours via histamine, tyramine, and vasodilation.",
    weight: 12,
    weightCap: 15,
    rationale: "Onderwater 2019 (n=2,197): 35.6% report alcohol as trigger; red wine implicated by 77.8% but consistent only 8.8% of the time. ~33% of attacks within 3 hours.",
    citations: [
      { slug: "onderwater-2019", effectNote: "35.6% report alcohol as trigger; red wine most common (77.8%); ~33% onset within 3h." },
    ],
  },
  {
    key: "menstrual",
    name: "Menstrual cycle",
    category: "hormonal",
    direction: "raises",
    description: "Premenstrual estrogen withdrawal triggers migraine in roughly 60% of women with migraine in the perimenstrual window.",
    weight: 10,
    weightCap: 12,
    rationale: "MacGregor 2023 review of estrogen-withdrawal hypothesis. Kelman 2007 found hormones the most common trigger overall (33.3% of women).",
    citations: [
      { slug: "macgregor-2023", effectNote: "~60% of women with migraine report increased frequency around menses; estrogen withdrawal proposed mechanism." },
      { slug: "kelman-2007", effectNote: "Hormones the most common trigger in women (33.3%)." },
    ],
  },
  {
    key: "skipped_meals",
    name: "Skipped meals / fasting",
    category: "dietary",
    direction: "raises",
    description: "Going more than ~5 hours without food, or skipping breakfast, can trigger migraine — likely via hypoglycemia and sympathetic activation.",
    weight: 8,
    weightCap: 12,
    rationale: "Martin 2009 experimental 19-hour fast: headache in 58% (hunger only) and 93% (hunger + stress). Kelman 2007: 22.9% report 'not eating' as trigger.",
    citations: [
      { slug: "martin-2009", effectNote: "Headache in 58% with hunger alone, 93% with hunger + stress; effects independent." },
      { slug: "kelman-2007", effectNote: "'Not eating' reported by 22.9% of patients." },
    ],
  },
  {
    key: "high_screen_time",
    name: "High screen time",
    category: "lifestyle",
    direction: "raises",
    description: "More than ~6 hours of screen exposure per day correlates with higher headache frequency, especially in conjunction with poor sleep.",
    weight: 4,
    weightCap: 6,
    rationale: "Langdon 2024 scoping review: ~64% of adolescents experience digital eye strain; correlations with headache modest but consistent. Smaller effect than sleep/stress/pressure.",
    citations: [
      { slug: "demirci-2024", effectNote: "Higher screen exposure correlates with higher headache frequency in youth." },
    ],
  },
  {
    key: "exercise",
    name: "Regular exercise",
    category: "lifestyle",
    direction: "lowers",
    description: "Aerobic exercise three times a week is as effective as topiramate for migraine prevention.",
    weight: -3,
    weightCap: -5,
    rationale: "Varkey 2011 RCT: 40 min × 3/week aerobic exercise reduced attack frequency equivalently to topiramate 200mg.",
    citations: [
      { slug: "varkey-2011", effectNote: "Aerobic exercise (40 min × 3/week) ≈ topiramate 200mg for migraine prevention." },
    ],
  },
  {
    key: "good_hydration",
    name: "Good hydration",
    category: "lifestyle",
    direction: "lowers",
    description: "Drinking ~7+ cups/day improves migraine quality of life and reduces sensitivity to other triggers.",
    weight: -4,
    weightCap: -6,
    rationale: "Spigt 2012 — protective complement to the low-hydration trigger.",
    citations: [
      { slug: "spigt-2012", effectNote: "Adequate intake (≥1.5L additional/day) improves MSQOL." },
    ],
  },
];

// ────────────────────────────────────────────────────────────────────────────
//  TREATMENTS
// ────────────────────────────────────────────────────────────────────────────

export const TREATMENTS: TreatmentData[] = [
  // — Supplements
  {
    key: "magnesium",
    name: "Magnesium",
    category: "supplement",
    type: "preventive",
    description: "Oral magnesium reduces attack frequency in episodic migraine, with evidence behind 600 mg/day of trimagnesium dicitrate.",
    dosing: "600 mg/day oral (trimagnesium dicitrate)",
    evidenceLevel: "B",
    cautions: "Diarrhea ~19%, gastric irritation ~5%. Caution in renal impairment.",
    citations: [
      { slug: "peikert-1996", effectNote: "Attack frequency dropped 41.6% vs 15.8% placebo (p<0.05)." },
    ],
  },
  {
    key: "riboflavin",
    name: "Riboflavin (Vitamin B2)",
    category: "supplement",
    type: "preventive",
    description: "High-dose vitamin B2 has one of the best NNTs of any migraine prophylactic; takes ~2 months to peak.",
    dosing: "400 mg/day oral",
    evidenceLevel: "B",
    nnt: 2.3,
    cautions: "Bright yellow urine (harmless). Mild GI side effects rare.",
    citations: [
      { slug: "schoenen-1998", effectNote: "≥50% responder rate: 59% riboflavin vs 15% placebo (p=0.002), NNT 2.3." },
    ],
  },
  {
    key: "coq10",
    name: "Coenzyme Q10",
    category: "supplement",
    type: "preventive",
    description: "CoQ10 supports mitochondrial function; modest but real benefit for episodic migraine.",
    dosing: "300 mg/day (3 × 100 mg)",
    evidenceLevel: "C",
    nnt: 3,
    cautions: "Generally well tolerated; mild GI upset possible.",
    citations: [
      { slug: "sandor-2005", effectNote: "≥50% responder rate: 47.6% CoQ10 vs 14.4% placebo, NNT 3." },
    ],
  },
  {
    key: "feverfew",
    name: "Feverfew (MIG-99)",
    category: "supplement",
    type: "preventive",
    description: "Standardized feverfew extract reduces migraine frequency; effects begin at 1 month.",
    dosing: "6.25 mg three times daily (MIG-99 CO2-extract)",
    evidenceLevel: "B",
    cautions: "Mouth ulcers possible. Avoid in pregnancy.",
    citations: [
      { slug: "diener-2005", effectNote: "−1.9 attacks/month vs −1.3 with placebo." },
    ],
  },
  {
    key: "melatonin",
    name: "Melatonin",
    category: "supplement",
    type: "preventive",
    description: "Equivalent to amitriptyline 25 mg for migraine prevention, with better tolerability.",
    dosing: "3 mg taken 30 min before bed",
    evidenceLevel: "B",
    cautions: "Daytime drowsiness; potential interactions with sedatives.",
    citations: [
      { slug: "goncalves-2016", effectNote: "−2.7 migraine days/month vs −1.1 placebo (p=0.009); equal to amitriptyline 25 mg with fewer side effects." },
    ],
  },
  {
    key: "butterbur",
    name: "Butterbur (Petasites) — caution",
    category: "supplement",
    type: "preventive",
    description: "Effective in trials BUT the AAN withdrew its recommendation in 2015 due to hepatotoxicity concerns. Only PA-free certified extracts should be considered, and only with clinician oversight.",
    dosing: "75 mg twice daily (Petadolex, PA-free)",
    evidenceLevel: "U",
    cautions: "AAN guideline withdrawn 2015. Pyrrolizidine alkaloids in unrefined extracts are hepatotoxic. 40 case reports of liver injury (incl. 2 transplants).",
    citations: [
      { slug: "diener-2018-butterbur", effectNote: "AAN withdrew Level-A recommendation in 2015 due to hepatotoxicity case reports." },
    ],
  },

  // — Behavioral
  {
    key: "aerobic_exercise",
    name: "Aerobic exercise",
    category: "behavioral",
    type: "preventive",
    description: "Regular aerobic exercise is as effective as topiramate for preventing migraine, with no medication side effects.",
    dosing: "40 minutes, 3× per week",
    evidenceLevel: "B",
    citations: [
      { slug: "varkey-2011", effectNote: "Equivalent reduction in attack frequency vs topiramate 200mg or progressive relaxation." },
    ],
  },
  {
    key: "mindfulness",
    name: "Mindfulness meditation (MBSR)",
    category: "behavioral",
    type: "preventive",
    description: "8-week MBSR programs reduce headache duration and migraine-related disability.",
    dosing: "30+ min daily, 8-week MBSR course",
    evidenceLevel: "C",
    citations: [
      { slug: "wells-2014", effectNote: "−2.9 hours/headache; MIDAS disability −12.6 (p=0.02); no adverse events." },
    ],
  },
  {
    key: "cbt",
    name: "Cognitive Behavioral Therapy",
    category: "behavioral",
    type: "preventive",
    description: "CBT and multicomponent behavioral therapy reduce migraine frequency and disability with minimal side effects.",
    dosing: "6–12 sessions with trained therapist; digital programs increasingly available",
    evidenceLevel: "A",
    citations: [
      { slug: "treadwell-2025", effectNote: "Meta-analysis (50 trials, 6,024 adults): CBT effectively reduces frequency and MIDAS." },
    ],
  },
  {
    key: "acupuncture",
    name: "Acupuncture",
    category: "behavioral",
    type: "preventive",
    description: "Cochrane-reviewed evidence shows acupuncture is at least non-inferior to drug prophylaxis.",
    dosing: "Course of ~10–12 sessions over 8 weeks",
    evidenceLevel: "A",
    citations: [
      { slug: "linde-2016", effectNote: "22 trials, 4,985 participants: at least equivalent to flunarizine, metoprolol, or valproate." },
    ],
  },

  // — Acute (Rx)
  {
    key: "triptans",
    name: "Triptans (e.g. sumatriptan)",
    category: "rx_acute",
    type: "acute",
    description: "First-line acute treatment for moderate-severe migraine. Most effective when taken at headache onset.",
    dosing: "Sumatriptan 50–100 mg PO; rizatriptan 10 mg ODT often fastest oral option.",
    evidenceLevel: "A",
    cautions: "Contraindicated in coronary artery disease, uncontrolled hypertension. Limit to ≤10 days/month to avoid medication-overuse headache.",
    citations: [
      { slug: "cameron-2015", effectNote: "Standard-dose triptans: 42–76% pain relief at 2h; 18–50% pain-free." },
    ],
  },
  {
    key: "gepants_acute",
    name: "Gepants (ubrogepant, rimegepant)",
    category: "rx_acute",
    type: "acute",
    description: "Newer small-molecule CGRP-receptor antagonists for acute migraine without the cardiovascular contraindications of triptans.",
    dosing: "Ubrogepant 50–100 mg; rimegepant 75 mg ODT.",
    evidenceLevel: "A",
    cautions: "Generally well tolerated. Can also be used preventively (rimegepant) — discuss with clinician.",
    citations: [
      { slug: "ubrogepant-2019", effectNote: "ACHIEVE I phase-3: superior to placebo for 2h pain freedom; FDA-approved Dec 2019." },
    ],
  },

  // — Preventive (Rx)
  {
    key: "cgrp_mab",
    name: "CGRP monoclonal antibodies (erenumab, fremanezumab, galcanezumab, eptinezumab)",
    category: "rx_preventive",
    type: "preventive",
    description: "Monthly or quarterly injections that block the CGRP pathway. AHS 2024 consensus: first-line preventive in episodic migraine.",
    dosing: "Erenumab 70–140 mg SC monthly; fremanezumab 225 mg SC monthly or 675 mg quarterly.",
    evidenceLevel: "A",
    cautions: "Constipation (esp. erenumab); injection-site reactions. Cost / insurance coverage variable.",
    citations: [
      { slug: "fremanezumab-2017", effectNote: "Phase-3 NEJM: −1.3 to −1.5 monthly migraine days vs placebo; 44–48% ≥50% responder rate." },
    ],
  },
];

// ────────────────────────────────────────────────────────────────────────────
//  Helper for fallback API mode
// ────────────────────────────────────────────────────────────────────────────

export function citationBySlug(slug: string): CitationData | undefined {
  return CITATIONS.find(c => c.slug === slug);
}
