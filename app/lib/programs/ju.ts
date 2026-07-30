// Jacksonville University degree catalog: program name -> official
// per-program page.
//
// HAND-VERIFIED, not scraped — no committed scraper exists for this school.
// HANDOFF.md had this school flagged as a dead end with "no
// catalog.*/bulletin.*/*.smartcatalogiq.com subdomain at all" — that survey
// only tried subdomain guesses. The real catalog is linked from JU's own
// site (ju.edu/academics/academic-catalog.php) and lives on a platform never
// seen elsewhere in this project: Coursedog
// (`ju.catalog.prod.coursedog.com`), a client-rendered Nuxt.js app (the
// page's own `window.__NUXT__` payload is empty — all program data loads
// client-side from `app.coursedog.com` after mount, the same "read the
// rendered DOM, not the raw HTML" situation Ave Maria's catalog needed).
// `/programs` lists all 199 real entries (majors, minors, and certificates
// together), paginated 20-per-page with no URL-based page parameter —
// paged through by clicking each numbered page button and re-reading the
// rendered DOM, 10 pages total. Every entry has its own real page at
// `/programs/<id>`, and every one states a "Program Level" (Undergraduate/
// Graduate) and a "Department(s)" field — but with 199 entries, individually
// opening each one to read that field would have been the wrong tradeoff;
// `area` is left off entirely here, the same call made for Eckerd when a
// bulk per-major/department source wasn't available cheaply.
//
// Excluded throughout: all Minors (~50) and all Certificates (~30, both
// undergraduate and "Post Graduate"/"Post-Baccalaureate" grad ones) — same
// exclusion this whole private-university batch has made from Saint Leo
// onward. Also excluded, each confirmed by opening its own page rather than
// guessed from the name:
// - "Joint BS/MA in Marine Science" (both program-code variants, MSC2.BS
//   and MSC2.MA) — an accelerated 5-year track combining two ALREADY
//   separately-listed standalone credentials ("BS in Marine Science" and
//   "Master of Arts in Marine Science" / "Master of Science in Marine
//   Science"), the same "redundant accelerated combo, not a new credential"
//   shape as Ave Maria's 3+2 and FMU's dual-degree exclusions.
// - Every "X & Y" / "X/Y Joint Degree" combo entry (Master in Public Policy
//   combined with a JD, an MBA, or a Marine Science master's; MS Applied
//   Business Analytics combined with an MBA or Organizational Leadership
//   master's; MS in Nursing combined with an MBA) — each combines two
//   credentials that are ALSO separately, standalone listed elsewhere in
//   this same catalog. One of these (the MPP/JD combo) explicitly states it
//   "partners with any ABA accredited law school," the same "the other half
//   of this program lives in an institution we don't have" shape that
//   excluded STU's joint JD programs and Eckerd's Musical Theatre — the
//   others are purely internal JU dual-degree advising tracks with no
//   partner school, but excluded for the same underlying reason: nothing
//   here is a credential a student can earn that isn't already its own
//   catalog entry.
// - "Fellowship in Orthodontics" — confirmed by reading its own page to be a
//   one-year post-doctoral clinical/research fellowship preparing Fellows
//   for an ADA-accredited residency elsewhere, not a degree program at all.
//
// NOT excluded despite looking redundant at first glance, each confirmed by
// opening its own page: the two "Accelerated BSN" programs and "Accelerated
// Master of Science in Nursing" are real second-degree/direct-entry nursing
// pathways with their own program codes (`NUR.BSN.12`, `NUR.BSN.16`,
// `ANUR.MSN`), genuinely distinct from the standard from-scratch BSN;
// "Bachelor of Science in Nursing RN-BSN" and the several "RN-MSN"-suffixed
// MSN entries are real bridge programs for already-licensed nurses, each its
// own program code; "Master of Science in Marine Science" and "...Marine
// Studies" are two different program codes, not a typo of each other; the
// two "Certificate/Master of Science in Dentistry" entries (Oral
// Implantology, Orthodontics) are real 36-month paid-residency programs
// whose actual terminal credential is the stated M.S., the leading
// "Certificate" in the name notwithstanding; and "Online Master of Medical
// Sciences" is a separate program code from "Master of Science in Medical
// Sciences," a genuine different-delivery-mode offering, not a duplicate.
//
// Programs: 116 (69 bachelor's, 47 graduate)
//
// Jacksonville University is a four-year university (like UM/Stetson/ERAU/
// UT/Barry/Lynn/Rollins/Flagler/PBA/FIT/Saint Leo/STU/Ave Maria/Bethune-
// Cookman/Eckerd/FMU), so pathways start at the bachelor's rather than an
// associate degree.

import { createProgramCatalog, type SchoolProgram } from "@/app/lib/programCatalog";

const SITE = "https://ju.catalog.prod.coursedog.com/programs";

export const JU_PROGRAMS: SchoolProgram[] = [
  { name: "Accelerated BSN 12-Month Program", url: `${SITE}/urLVJp4jN3OD4ij0OcWX`, level: "bachelor" },
  { name: "Accelerated BSN 16-Month Program", url: `${SITE}/a0E0FC2RrdNxI4VMY8Tq`, level: "bachelor" },
  { name: "B.S. in Animation", url: `${SITE}/xeB9fhKWCSiKlkkmjc2B`, level: "bachelor" },
  { name: "BA Education for Instruction", url: `${SITE}/ddmcO4VkspYEVJCuVJLX`, level: "bachelor" },
  { name: "BA in Art", url: `${SITE}/4onmdoMtQUWRh0W2cJiB`, level: "bachelor" },
  { name: "BA in Art W Specialization in Illustration", url: `${SITE}/ylzgnnEZp8DMx48QinTk`, level: "bachelor" },
  { name: "BA in Art with specalization in Object Design", url: `${SITE}/7OnqgcppXYPEg52mH7YK`, level: "bachelor" },
  { name: "BA in Art with specialization in Photography", url: `${SITE}/4Zvbb62QSu95ZT8OwEYD`, level: "bachelor" },
  { name: "BA in Biochemistry", url: `${SITE}/jWrr0wG013kDkbl4lTVF`, level: "bachelor" },
  { name: "BA in Communication", url: `${SITE}/EahO0xN071mQKMKP54Ke`, level: "bachelor" },
  { name: "BA in Computing Science", url: `${SITE}/D2CBQxaEv0V9jDtCylcS`, level: "bachelor" },
  { name: "BA in English", url: `${SITE}/K51enk0iT8pAe02DqfAo`, level: "bachelor" },
  { name: "BA in Environmental Chemistry", url: `${SITE}/rPmnLpWSRJwa1cIn1hiW`, level: "bachelor" },
  { name: "BA in Mathematics", url: `${SITE}/HszOTITjNoZtDsfZOUkM`, level: "bachelor" },
  { name: "BBA Accounting", url: `${SITE}/1cgF6ExZLcBPsr0DNk0h`, level: "bachelor" },
  { name: "BBA in Business Administration", url: `${SITE}/vsZ0LpKLqVtLp8UK4sMc`, level: "bachelor" },
  { name: "BBA in Business Analytics", url: `${SITE}/b9Pvq0u1jpH5oGpUrmv4`, level: "bachelor" },
  { name: "BBA in Finance", url: `${SITE}/9emTEjWyyUr2sK8DvF8P`, level: "bachelor" },
  { name: "BBA in International Business", url: `${SITE}/lYNi2DrrMF9aOzvtO4Ij`, level: "bachelor" },
  { name: "BBA in Management", url: `${SITE}/alwsEZAgogeOhQaF2Fvx`, level: "bachelor" },
  { name: "BBA in Marketing", url: `${SITE}/AJtBV23f3G79Iv6Bozik`, level: "bachelor" },
  { name: "BBA in Marketing w/ Digital and Social Media Marketing", url: `${SITE}/p0UNE3sjR0C701t8KzBU`, level: "bachelor" },
  { name: "BBA in Marketing w/ International Marketing", url: `${SITE}/bT1wfeOLal4CkeQtUNc6`, level: "bachelor" },
  { name: "BFA in Animation", url: `${SITE}/KO3xWxJDXhlwO5LOkERf`, level: "bachelor" },
  { name: "BFA in Art with specialization in Illustration", url: `${SITE}/D0dBpzJkT3pZ5NbdAMDo`, level: "bachelor" },
  { name: "BFA in Art with specialization in Object Design", url: `${SITE}/qCmROuCStShFh56UoJ4P`, level: "bachelor" },
  { name: "BFA in Art with specialization in Photography", url: `${SITE}/n7KPthNGeKB4xFlG0bhO`, level: "bachelor" },
  { name: "BFA in Dance", url: `${SITE}/EIquJHu7jy8j2a6e4lAb`, level: "bachelor" },
  { name: "BFA in Graphic Design", url: `${SITE}/U07V5hPlyC2uPnGv2BuI`, level: "bachelor" },
  { name: "BS Cybersecurity", url: `${SITE}/G2yiwEc55GYuwcToWjVd`, level: "bachelor" },
  { name: "BS Education for Instruction", url: `${SITE}/XjNIeJ53Fnb32hKAbXw8`, level: "bachelor" },
  { name: "BS Electrical Engineering", url: `${SITE}/LhVj6hE1gCd57e96vbHH`, level: "bachelor" },
  { name: "BS in Aviation Management", url: `${SITE}/p7rlci8SDifphnUN3EVS`, level: "bachelor" },
  { name: "BS in Aviation Management & Flight Operations", url: `${SITE}/sxy1TGSjOuL2A8vDSmpw`, level: "bachelor" },
  { name: "BS in Biochemistry", url: `${SITE}/BAISBTQvcbXRnH2baSNn`, level: "bachelor" },
  { name: "BS in Biology", url: `${SITE}/pmAc3YQEuLOPpMBLRoXu`, level: "bachelor" },
  { name: "BS in Cell and Molecular Biology", url: `${SITE}/zLHEcLilOaFCWqjFEtTp`, level: "bachelor" },
  { name: "BS in Computing Science", url: `${SITE}/W3u2kXo5ik6aOriAY6oy`, level: "bachelor" },
  { name: "BS in Environmental Chemistry", url: `${SITE}/LoGBxtrKrFmE7BqizkQX`, level: "bachelor" },
  { name: "BS in Graphic Design", url: `${SITE}/1UvP8CIUvAooI2ycBc1Y`, level: "bachelor" },
  { name: "BS in Marine Science", url: `${SITE}/9oxuBBPnGAZmyBCjNgZG`, level: "bachelor" },
  { name: "BS in Mathematics", url: `${SITE}/BQUpJNI1QVYYoE5BCIh7`, level: "bachelor" },
  { name: "BS in Mechanical Engineering", url: `${SITE}/4zsJcOqvWmF25zkaBMv5`, level: "bachelor" },
  { name: "BS in Sust, Geog, & Env Plan W/ Environmental Planning", url: `${SITE}/Rp39UHt42GlSGumLGYBH`, level: "bachelor" },
  { name: "BS in Sust, Geog, & Env Plan W/ Geography & GIS", url: `${SITE}/g4WTqJRNguyNMgmeZrvl`, level: "bachelor" },
  { name: "BS in Sust, Geog, & Env Plan W/ Sust & Resiliency", url: `${SITE}/TTqQiq4IIBW1Wap050ju`, level: "bachelor" },
  { name: "Bachelor of Arts University Major", url: `${SITE}/qpScWexboNQeAnF8bXh7`, level: "bachelor" },
  { name: "Bachelor of Arts in Dance", url: `${SITE}/ihZ8t9qbSTSpsfyajUyw`, level: "bachelor" },
  { name: "Bachelor of Arts in History", url: `${SITE}/7g4D9D6hzhtqPVvTF5LJ`, level: "bachelor" },
  { name: "Bachelor of Arts in Physics", url: `${SITE}/tnmY3XVmUOAlqsnIsT3W`, level: "bachelor" },
  { name: "Bachelor of Arts in Political Science", url: `${SITE}/bANfofqDEXx37nC1g0y6`, level: "bachelor" },
  { name: "Bachelor of Arts in Psychology", url: `${SITE}/8pt2DozLpEiwtoVjVkJE`, level: "bachelor" },
  { name: "Bachelor of Arts in Sociology", url: `${SITE}/eBsadfk5tkDqeYPWWv3p`, level: "bachelor" },
  { name: "Bachelor of Business Administration Sport Business", url: `${SITE}/NBegefmLFz76EUuGMcUw`, level: "bachelor" },
  { name: "Bachelor of Fine Arts in Film", url: `${SITE}/Z5dFcyaTZXWL0Ca84ioo`, level: "bachelor" },
  { name: "Bachelor of Science University Major", url: `${SITE}/CJJaKOFK2dQDEHnY3ZNF`, level: "bachelor" },
  { name: "Bachelor of Science in Biodiversity, Ecology, & Conservation", url: `${SITE}/6b26MGz27RNYsB8V5zXd`, level: "bachelor" },
  { name: "Bachelor of Science in Exercise Science", url: `${SITE}/Zouv0Y9NOjnSLpoxD13X`, level: "bachelor" },
  { name: "Bachelor of Science in Film", url: `${SITE}/XDDwkxc5oo5p0Oh7LXR1`, level: "bachelor" },
  { name: "Bachelor of Science in Game Design", url: `${SITE}/YQupcISnYWSDFZMO4eAv`, level: "bachelor" },
  { name: "Bachelor of Science in Health Sciences", url: `${SITE}/yTnVhXjzzqUJkxzX9pYC`, level: "bachelor" },
  { name: "Bachelor of Science in History", url: `${SITE}/jcA0nBYpfaACSsjwxsk1`, level: "bachelor" },
  { name: "Bachelor of Science in Nursing", url: `${SITE}/RdftBFBKlJ2vZVIFI1wJ`, level: "bachelor" },
  { name: "Bachelor of Science in Nursing RN-BSN", url: `${SITE}/FgWwphKFkcYevsW6xIk7`, level: "bachelor" },
  { name: "Bachelor of Science in Physics", url: `${SITE}/aQw9Pk51UcTmoCs4ortO`, level: "bachelor" },
  { name: "Bachelor of Science in Political Science", url: `${SITE}/A9Db9HPsHMTYaRlT26UO`, level: "bachelor" },
  { name: "Bachelor of Science in Psychology", url: `${SITE}/CQ8rUk9TMfhvqxigTUGA`, level: "bachelor" },
  { name: "Bachelor of Science in Sociology", url: `${SITE}/kopb1OloBgACeT6pgb0X`, level: "bachelor" },
  { name: "Bachelor of Science in Sports in Society", url: `${SITE}/OaJ4yFxxVoQDRcIK59Tp`, level: "bachelor" },

  { name: "BSN to DNP Family Nurse Practitioner", url: `${SITE}/vNw6jpFaE4dYZw5ge4cu`, level: "graduate" },
  { name: "BSN to DNP Leadership", url: `${SITE}/JNQnlH4vP3V4Ux7IcewG`, level: "graduate" },
  { name: "BSN-DNP Adult Gerontology Acute Care Nurse Practitioner Tra", url: `${SITE}/7kTDmEODwcnIEclY3poz`, level: "graduate" },
  { name: "BSN-DNP Psychiatric Mental Health Nurse Practitioner Track", url: `${SITE}/3wuP4i04mrAHpKueW0Cw`, level: "graduate" },
  { name: "Doctor of Business Administration", url: `${SITE}/CbLnPG31NEfzTVvBVjFx`, level: "graduate" },
  { name: "Doctor of Business Administration- Accounting and Finance", url: `${SITE}/gTj5RLMY1PRUCQ2IkPb3`, level: "graduate" },
  { name: "Doctor of Business Administration- Concentration in  Customized Professional", url: `${SITE}/ud2m184SGbWXQVJHxvBF`, level: "graduate" },
  { name: "Doctor of Business Administration- Concentration in Healthcare Leadership", url: `${SITE}/41L364HB1mZ7icq7Djsn`, level: "graduate" },
  { name: "Doctor of Business Administration- Management", url: `${SITE}/PFvVhhB0DuzUGSMNcQH0`, level: "graduate" },
  { name: "Doctor of Nursing Practice - Advanced Practice", url: `${SITE}/VdRrjQ80W047duitr9Ld`, level: "graduate" },
  { name: "Doctor of Nursing Practice - Leadership", url: `${SITE}/dTT17Sl4azW3T4KDKWBm`, level: "graduate" },
  { name: "Doctor of Occupational Therapy", url: `${SITE}/btyyfntUhQzQy1X6I6fO`, level: "graduate" },
  { name: "Executive Master in Public Policy", url: `${SITE}/LraSiacMt9PBd4ot8Mfo`, level: "graduate" },
  { name: "Juris Doctorate", url: `${SITE}/cmmOqMDR5mka8KITZUjH`, level: "graduate" },
  { name: "MFA in Choreography", url: `${SITE}/Lv43GJhgdRcK0qmwsIbm`, level: "graduate" },
  { name: "MS Applied Business Analytics", url: `${SITE}/K7EG5gVHYHuODCWv7ur8`, level: "graduate" },
  { name: "MS Aviation Leadership", url: `${SITE}/kpWEbPefC5TWrpdHqq0p`, level: "graduate" },
  { name: "MS Clinical Mental Health Counsel-Marriage & Family Therapy", url: `${SITE}/dK8NbEPkdqjyG4Yl2lh4`, level: "graduate" },
  { name: "MS Organizational Leadership", url: `${SITE}/gSykKg0bB0Vi0qvMpvIv`, level: "graduate" },
  { name: "MS in Respiratory Care", url: `${SITE}/CHbY9a3IbaUvfnvrZj1E`, level: "graduate" },
  { name: "MS in Respiratory Care for existing RTs", url: `${SITE}/QQbIYz1U3rIMMAGqii9p`, level: "graduate" },
  { name: "MSN Adult Gerontology Acute Care Nurse Practitioner", url: `${SITE}/1C0m6vdOID2wfOyG3jVl`, level: "graduate" },
  { name: "MSN Clinical Nurse Educator", url: `${SITE}/ujC3QrYGXjPlSNzvotUK`, level: "graduate" },
  { name: "MSN Leadership in Healthcare Systems RN-MSN", url: `${SITE}/0AmhQEinVUXBpZfRZuNK`, level: "graduate" },
  { name: "MSN Nursing Informatics", url: `${SITE}/MVEpHaJQhQEP8J0ontgX`, level: "graduate" },
  { name: "MSN Nursing Informatics RN-MSN", url: `${SITE}/Wd50s6qkbaULD1qb1r0E`, level: "graduate" },
  { name: "MSN Psychiatric-Mental Health Nurse Practitioner", url: `${SITE}/WQG41PtmSt6MwMnMmM29`, level: "graduate" },
  { name: "Master in Public Policy", url: `${SITE}/04XDDkMmSf1yN7o7Y3z2`, level: "graduate" },
  { name: "Master of Arts in Marine Science", url: `${SITE}/ZMdx8NQYU2gI6RnOlK3d`, level: "graduate" },
  { name: "Master of Business Admin w Accounting & Finance", url: `${SITE}/0KcZVqTX54EVD5JUqhxf`, level: "graduate" },
  { name: "Master of Business Administration", url: `${SITE}/ms8SebvIfhnEbIsdWSEs`, level: "graduate" },
  { name: "Master of Business Administration W/ Customized Professional", url: `${SITE}/dJgDtKWR517R4fvHu6Vu`, level: "graduate" },
  { name: "Master of Business Administration in Healthcare Management", url: `${SITE}/K1bKX1FgiomKtgI0troH`, level: "graduate" },
  { name: "Master of Business Administration w Management", url: `${SITE}/eUb5CJ60M4ZTgASJjLn0`, level: "graduate" },
  { name: "Master of Science Nursing-Leadership Healthcare Systems", url: `${SITE}/7tDSbXhhh4rM2dRzVY40`, level: "graduate" },
  { name: "Master of Science Speech-Language Pathology", url: `${SITE}/zsVIAOKzayebOKHVl4Rr`, level: "graduate" },
  { name: "Master of Science in Business Studies", url: `${SITE}/v3z8VBsd4TBmFgibv34G`, level: "graduate" },
  { name: "Master of Science in Health Informatics", url: `${SITE}/OS714WDqairQz2Z3w5re`, level: "graduate" },
  { name: "Master of Science in Marine Science", url: `${SITE}/H60hPtRZa2fcwJLgx0lv`, level: "graduate" },
  { name: "Master of Science in Marine Studies", url: `${SITE}/inVT9QWQHPCXYsBWLntu`, level: "graduate" },
  { name: "Master of Science in Medical Sciences", url: `${SITE}/qy2TDmyfqaPXjYoZ3zsk`, level: "graduate" },
  { name: "Master of Science in Nursing Family Nurse Practitioner", url: `${SITE}/fu1DsTujuxU3NCfkSl2i`, level: "graduate" },
  { name: "Master of Science in Nursing Leadership in Healthcare Systems", url: `${SITE}/1mTMsUBHZPMOUCRdKJcQ`, level: "graduate" },
  { name: "Accelerated Master of Science in Nursing", url: `${SITE}/Fn9rzKo4jtePiEax6kxd`, level: "graduate" },
  { name: "Online Master of Medical Sciences", url: `${SITE}/WarIjdFQMwokAAnVMD3F`, level: "graduate" },
  { name: "Oral Implantology Certificate/Master of Science in Dentistry", url: `${SITE}/oJfeqHX3TuiV5eCSrW19`, level: "graduate" },
  { name: "Orthodontics Certificate/Master of Science in Dentistry", url: `${SITE}/HIISIaDDGPlOI4LglMpb`, level: "graduate" },
];

export const juCatalog = createProgramCatalog(JU_PROGRAMS);
