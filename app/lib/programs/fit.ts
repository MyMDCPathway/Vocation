// Florida Institute of Technology degree catalog: program name -> official
// program page.
//
// HAND-VERIFIED, not scraped — no committed scraper exists for this school.
// catalog.fit.edu is Acalog behind AWS WAF Bot Control: both fetch() and
// curl are blocked on content.php AND preview_program.php (HTTP 202 with
// x-amzn-waf-action: challenge), the same platform and symptom as FAMU,
// FlPoly, USF, Rollins, Flagler, and PBA (see HANDOFF.md §13). index.php
// loads fine either way. Per the Rollins/Flagler/PBA technique, a real
// browser doing top-level navigation gets through where curl/fetch cannot;
// this file was built the same way (2026-07-28).
//
// Unlike Rollins/PBA, Florida Tech runs a SINGLE combined catalog (catoid=20,
// not split by undergrad/grad), with one comprehensive "Degree Programs"
// page listing every program on one page, grouped by College/Department and
// then by "Undergraduate Degree Programs" / "Graduate Degree Programs" —
// the same one-page-has-everything shape as UM's/UNF's catalogs:
//   content.php?catoid=20&navoid=1245  Degree Programs
// Every program's own credential is already stated in its title (e.g.
// "Aeronautical Science, B.S.", "Aviation Management, MSA") — no separate
// `credential` field needed anywhere in this file, the same "name already
// carries the code" shape pathwayPrompts.ts documents for FIU.
//
// Excluded: "Undergraduate Minor Programs", "Undergraduate Certificate
// Programs", "Graduate Certificate Programs", and "Nondegree Programs" —
// none are a standalone degree. Also excluded: 11 real Associate-level
// entries (A.A./A.S.) mixed into the "Undergraduate Degree Programs"
// subsections (Aeronautical Science - Flight A.S., Air Traffic Control A.A.,
// Aviation Management A.A., Flight Operations and Dispatch A.S., Accounting
// A.A., Business Administration A.A., Healthcare Management A.A., Management
// A.A., Marketing A.A., Computer Information Systems A.S., Applied
// Psychology A.A.) — the university template starts every pathway at the
// bachelor's, the same call ERAU's/UCF's/Barry's scrapers made for their own
// associate-level tracks.
//
// A number of subjects offer both a standard track and a "- Flight" track as
// two distinct real bachelor's programs with their own pages and credentials
// (e.g. "Aviation Management, B.S." and "Aviation Management - Flight,
// B.S."), and Aviation Management additionally offers a B.A. alongside its
// B.S. — all kept as separate entries since each is a real, differently-
// named, separately-admitted program.
//
// Programs: 155 (56 bachelor, 99 graduate)
//
// Florida Tech is a four-year university (like UM/Stetson/ERAU/UT/Barry/
// Lynn/Rollins/Flagler/PBA), so pathways start at the bachelor's rather than
// an associate degree.

import { createProgramCatalog, type SchoolProgram } from "@/app/lib/programCatalog";

export const FIT_PROGRAMS: SchoolProgram[] = [
  { name: "Aeronautical Science - Flight, B.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8181", level: "bachelor", area: "College of Aeronautics" },
  { name: "Aeronautical Science, B.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8180", level: "bachelor", area: "College of Aeronautics" },
  { name: "Aviation Administration - Flight, B.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8183", level: "bachelor", area: "College of Aeronautics" },
  { name: "Aviation Administration, B.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8182", level: "bachelor", area: "College of Aeronautics" },
  { name: "Aviation Human Factors & Safety - Flight, B.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8434", level: "bachelor", area: "College of Aeronautics" },
  { name: "Aviation Human Factors & Safety, B.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8433", level: "bachelor", area: "College of Aeronautics" },
  { name: "Aviation Management - Flight, B.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8186", level: "bachelor", area: "College of Aeronautics" },
  { name: "Aviation Management, B.A.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8184", level: "bachelor", area: "College of Aeronautics" },
  { name: "Aviation Management, B.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8185", level: "bachelor", area: "College of Aeronautics" },
  { name: "Aviation Meteorology - Flight, B.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8188", level: "bachelor", area: "College of Aeronautics" },
  { name: "Aviation Meteorology, B.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8187", level: "bachelor", area: "College of Aeronautics" },
  { name: "Airport Development and Management, MSA", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8195", level: "graduate", area: "College of Aeronautics" },
  { name: "Applied Aviation Safety, MSA", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8196", level: "graduate", area: "College of Aeronautics" },
  { name: "Aviation Human Factors, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8199", level: "graduate", area: "College of Aeronautics" },
  { name: "Aviation Management, MSA", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8197", level: "graduate", area: "College of Aeronautics" },
  { name: "Aviation Safety, MSA", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8198", level: "graduate", area: "College of Aeronautics" },
  { name: "Aviation Sciences, Ph.D.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8201", level: "graduate", area: "College of Aeronautics" },
  { name: "Doctor of Aviation, Av.D.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8457", level: "graduate", area: "College of Aeronautics" },
  { name: "Human Factors in Aeronautics, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8200", level: "graduate", area: "College of Aeronautics" },

  { name: "Accounting, B.A.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8207", level: "bachelor", area: "Nathan M. Bisk College of Business" },
  { name: "Accounting, B.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8453", level: "bachelor", area: "Nathan M. Bisk College of Business" },
  { name: "Business Administration, B.A.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8217", level: "bachelor", area: "Nathan M. Bisk College of Business" },
  { name: "Business Administration, B.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8208", level: "bachelor", area: "Nathan M. Bisk College of Business" },
  { name: "Finance, B.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8467", level: "bachelor", area: "Nathan M. Bisk College of Business" },
  { name: "Human Resources Management, B.A.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8446", level: "bachelor", area: "Nathan M. Bisk College of Business" },
  { name: "Information Systems, B.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8222", level: "bachelor", area: "Nathan M. Bisk College of Business" },
  { name: "Management, B.A.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8439", level: "bachelor", area: "Nathan M. Bisk College of Business" },
  { name: "Accounting and Financial Forensics, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8460", level: "graduate", area: "Nathan M. Bisk College of Business" },
  { name: "Acquisition and Contract Management, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8249", level: "graduate", area: "Nathan M. Bisk College of Business" },
  { name: "Business Administration, DBA", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8273", level: "graduate", area: "Nathan M. Bisk College of Business" },
  { name: "Business Analytics, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8693", level: "graduate", area: "Nathan M. Bisk College of Business" },
  { name: "Commercial Enterprise in Space, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8250", level: "graduate", area: "Nathan M. Bisk College of Business" },
  { name: "Healthcare Management, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8692", level: "graduate", area: "Nathan M. Bisk College of Business" },
  { name: "Human Resources Management, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8252", level: "graduate", area: "Nathan M. Bisk College of Business" },
  { name: "Information Technology - Cybersecurity, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8230", level: "graduate", area: "Nathan M. Bisk College of Business" },
  { name: "Information Technology - Database Administration, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8231", level: "graduate", area: "Nathan M. Bisk College of Business" },
  { name: "Information Technology, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8229", level: "graduate", area: "Nathan M. Bisk College of Business" },
  { name: "Logistics Management - Humanitarian and Disaster Relief Logistics, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8254", level: "graduate", area: "Nathan M. Bisk College of Business" },
  { name: "Logistics Management, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8253", level: "graduate", area: "Nathan M. Bisk College of Business" },
  { name: "Management - Acquisition and Contract Management, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8256", level: "graduate", area: "Nathan M. Bisk College of Business" },
  { name: "Management - Human Resources Management, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8257", level: "graduate", area: "Nathan M. Bisk College of Business" },
  { name: "Management - Information Systems, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8258", level: "graduate", area: "Nathan M. Bisk College of Business" },
  { name: "Management - Logistics Management, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8259", level: "graduate", area: "Nathan M. Bisk College of Business" },
  { name: "Management - Transportation Management, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8260", level: "graduate", area: "Nathan M. Bisk College of Business" },
  { name: "Management, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8255", level: "graduate", area: "Nathan M. Bisk College of Business" },
  { name: "Master of Business Administration, MBA", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8233", level: "graduate", area: "Nathan M. Bisk College of Business" },
  { name: "Master of Public Administration, MPA", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8261", level: "graduate", area: "Nathan M. Bisk College of Business" },
  { name: "Project Management - Information Systems, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8263", level: "graduate", area: "Nathan M. Bisk College of Business" },
  { name: "Project Management - Operations Research, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8264", level: "graduate", area: "Nathan M. Bisk College of Business" },
  { name: "Project Management, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8262", level: "graduate", area: "Nathan M. Bisk College of Business" },
  { name: "Supply Chain Management, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8268", level: "graduate", area: "Nathan M. Bisk College of Business" },
  { name: "Technology Management, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8272", level: "graduate", area: "Nathan M. Bisk College of Business" },

  { name: "Aerospace Engineering, B.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8329", level: "bachelor", area: "Department of Aerospace, Physics and Space Sciences" },
  { name: "Astrobiology, B.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8421", level: "bachelor", area: "Department of Aerospace, Physics and Space Sciences" },
  { name: "Astronomy and Astrophysics, B.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8422", level: "bachelor", area: "Department of Aerospace, Physics and Space Sciences" },
  { name: "Physics, B.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8423", level: "bachelor", area: "Department of Aerospace, Physics and Space Sciences" },
  { name: "Planetary Science, B.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8425", level: "bachelor", area: "Department of Aerospace, Physics and Space Sciences" },
  { name: "Aerospace Engineering, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8330", level: "graduate", area: "Department of Aerospace, Physics and Space Sciences" },
  { name: "Aerospace Engineering, Ph.D.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8333", level: "graduate", area: "Department of Aerospace, Physics and Space Sciences" },
  { name: "Physics, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8427", level: "graduate", area: "Department of Aerospace, Physics and Space Sciences" },
  { name: "Physics, Ph.D.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8429", level: "graduate", area: "Department of Aerospace, Physics and Space Sciences" },
  { name: "Space Sciences, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8428", level: "graduate", area: "Department of Aerospace, Physics and Space Sciences" },
  { name: "Space Sciences, Ph.D.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8430", level: "graduate", area: "Department of Aerospace, Physics and Space Sciences" },
  { name: "Space Systems Management, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8267", level: "graduate", area: "Department of Aerospace, Physics and Space Sciences" },
  { name: "Space Systems, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8266", level: "graduate", area: "Department of Aerospace, Physics and Space Sciences" },

  { name: "Biochemistry, B.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8372", level: "bachelor", area: "Department of Biomedical Engineering and Science" },
  { name: "Biomedical Engineering, B.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8278", level: "bachelor", area: "Department of Biomedical Engineering and Science" },
  { name: "Biomedical Science, B.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8437", level: "bachelor", area: "Department of Biomedical Engineering and Science" },
  { name: "Genomics and Molecular Genetics, B.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8455", level: "bachelor", area: "Department of Biomedical Engineering and Science" },
  { name: "Biochemistry, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8390", level: "graduate", area: "Department of Biomedical Engineering and Science" },
  { name: "Biomedical Engineering, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8279", level: "graduate", area: "Department of Biomedical Engineering and Science" },
  { name: "Biomedical Engineering, Ph.D.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8280", level: "graduate", area: "Department of Biomedical Engineering and Science" },
  { name: "Biotechnology, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8380", level: "graduate", area: "Department of Biomedical Engineering and Science" },
  { name: "Cell and Molecular Biology, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8381", level: "graduate", area: "Department of Biomedical Engineering and Science" },
  { name: "Cell and Molecular Biology, Ph.D.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8481", level: "graduate", area: "Department of Biomedical Engineering and Science" },

  { name: "Chemical Engineering, B.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8281", level: "bachelor", area: "Department of Chemistry and Chemical Engineering" },
  { name: "Chemistry, B.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8485", level: "bachelor", area: "Department of Chemistry and Chemical Engineering" },
  { name: "Chemical Engineering, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8283", level: "graduate", area: "Department of Chemistry and Chemical Engineering" },
  { name: "Chemical Engineering, Ph.D.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8284", level: "graduate", area: "Department of Chemistry and Chemical Engineering" },
  { name: "Chemistry, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8391", level: "graduate", area: "Department of Chemistry and Chemical Engineering" },
  { name: "Chemistry, Ph.D.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8392", level: "graduate", area: "Department of Chemistry and Chemical Engineering" },

  { name: "Computer Engineering, B.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8299", level: "bachelor", area: "Department of Electrical Engineering and Computer Science" },
  { name: "Computer Information Systems, B.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8289", level: "bachelor", area: "Department of Electrical Engineering and Computer Science" },
  { name: "Computer Science, B.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8290", level: "bachelor", area: "Department of Electrical Engineering and Computer Science" },
  { name: "Electrical Engineering, B.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8300", level: "bachelor", area: "Department of Electrical Engineering and Computer Science" },
  { name: "Software Engineering, B.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8291", level: "bachelor", area: "Department of Electrical Engineering and Computer Science" },
  { name: "Computer Engineering, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8301", level: "graduate", area: "Department of Electrical Engineering and Computer Science" },
  { name: "Computer Engineering, Ph.D.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8303", level: "graduate", area: "Department of Electrical Engineering and Computer Science" },
  { name: "Computer Information Systems, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8293", level: "graduate", area: "Department of Electrical Engineering and Computer Science" },
  { name: "Computer Science, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8294", level: "graduate", area: "Department of Electrical Engineering and Computer Science" },
  { name: "Computer Science, Ph.D.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8297", level: "graduate", area: "Department of Electrical Engineering and Computer Science" },
  { name: "Cybersecurity, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8494", level: "graduate", area: "Department of Electrical Engineering and Computer Science" },
  { name: "Electrical Engineering, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8302", level: "graduate", area: "Department of Electrical Engineering and Computer Science" },
  { name: "Electrical Engineering, Ph.D.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8304", level: "graduate", area: "Department of Electrical Engineering and Computer Science" },
  { name: "Human-Centered Design, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8335", level: "graduate", area: "Department of Electrical Engineering and Computer Science" },
  { name: "Human-Centered Design, Ph.D.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8336", level: "graduate", area: "Department of Electrical Engineering and Computer Science" },
  { name: "Software Engineering, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8296", level: "graduate", area: "Department of Electrical Engineering and Computer Science" },

  { name: "Applied Mathematics, B.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8489", level: "bachelor", area: "Department of Mathematics and Systems Engineering" },
  { name: "Interdisciplinary Science, B.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8393", level: "bachelor", area: "Department of Mathematics and Systems Engineering" },
  { name: "Applied Mathematics, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8417", level: "graduate", area: "Department of Mathematics and Systems Engineering" },
  { name: "Applied Mathematics, Ph.D.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8419", level: "graduate", area: "Department of Mathematics and Systems Engineering" },
  { name: "Operations Research, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8418", level: "graduate", area: "Department of Mathematics and Systems Engineering" },
  { name: "Operations Research, Ph.D.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8420", level: "graduate", area: "Department of Mathematics and Systems Engineering" },
  { name: "STEM Education, Ed.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8471", level: "graduate", area: "Department of Mathematics and Systems Engineering" },
  { name: "STEM Education, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8469", level: "graduate", area: "Department of Mathematics and Systems Engineering" },
  { name: "STEM Education, Ph.D.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8472", level: "graduate", area: "Department of Mathematics and Systems Engineering" },
  { name: "Systems Engineering, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8306", level: "graduate", area: "Department of Mathematics and Systems Engineering" },
  { name: "Systems Engineering, Ph.D.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8307", level: "graduate", area: "Department of Mathematics and Systems Engineering" },

  { name: "Civil Engineering, B.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8285", level: "bachelor", area: "Department of Mechanical and Civil Engineering" },
  { name: "Construction Management, B.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8277", level: "bachelor", area: "Department of Mechanical and Civil Engineering" },
  { name: "Mechanical Engineering, B.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8178", level: "bachelor", area: "Department of Mechanical and Civil Engineering" },
  { name: "Civil Engineering, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8286", level: "graduate", area: "Department of Mechanical and Civil Engineering" },
  { name: "Civil Engineering, Ph.D.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8287", level: "graduate", area: "Department of Mechanical and Civil Engineering" },
  { name: "Engineering Management, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8305", level: "graduate", area: "Department of Mechanical and Civil Engineering" },
  { name: "Mechanical Engineering, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8332", level: "graduate", area: "Department of Mechanical and Civil Engineering" },
  { name: "Mechanical Engineering, Ph.D.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8334", level: "graduate", area: "Department of Mechanical and Civil Engineering" },

  { name: "Environmental Science and Sustainability, B.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8497", level: "bachelor", area: "Department of Ocean Engineering and Marine Sciences" },
  { name: "General Biology, B.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8374", level: "bachelor", area: "Department of Ocean Engineering and Marine Sciences" },
  { name: "Marine Biology, B.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8375", level: "bachelor", area: "Department of Ocean Engineering and Marine Sciences" },
  { name: "Meteorology, B.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8310", level: "bachelor", area: "Department of Ocean Engineering and Marine Sciences" },
  { name: "Ocean Engineering, B.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8311", level: "bachelor", area: "Department of Ocean Engineering and Marine Sciences" },
  { name: "Oceanography, B.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8312", level: "bachelor", area: "Department of Ocean Engineering and Marine Sciences" },
  { name: "Biological Sciences, Ph.D.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8385", level: "graduate", area: "Department of Ocean Engineering and Marine Sciences" },
  { name: "Conservation Technology, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8384", level: "graduate", area: "Department of Ocean Engineering and Marine Sciences" },
  { name: "Ecology, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8382", level: "graduate", area: "Department of Ocean Engineering and Marine Sciences" },
  { name: "Environmental Resource Management, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8317", level: "graduate", area: "Department of Ocean Engineering and Marine Sciences" },
  { name: "Environmental Science, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8318", level: "graduate", area: "Department of Ocean Engineering and Marine Sciences" },
  { name: "Environmental Science, Ph.D.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8326", level: "graduate", area: "Department of Ocean Engineering and Marine Sciences" },
  { name: "Marine Biology, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8383", level: "graduate", area: "Department of Ocean Engineering and Marine Sciences" },
  { name: "Meteorology, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8319", level: "graduate", area: "Department of Ocean Engineering and Marine Sciences" },
  { name: "Ocean Engineering, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8320", level: "graduate", area: "Department of Ocean Engineering and Marine Sciences" },
  { name: "Ocean Engineering, Ph.D.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8327", level: "graduate", area: "Department of Ocean Engineering and Marine Sciences" },
  { name: "Oceanography, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8321", level: "graduate", area: "Department of Ocean Engineering and Marine Sciences" },
  { name: "Oceanography, Ph.D.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8328", level: "graduate", area: "Department of Ocean Engineering and Marine Sciences" },

  { name: "Humanities - Prelaw, B.A.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8343", level: "bachelor", area: "School of Arts and Communication" },
  { name: "Humanities, B.A.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8342", level: "bachelor", area: "School of Arts and Communication" },
  { name: "Multiplatform Journalism, B.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8443", level: "bachelor", area: "School of Arts and Communication" },
  { name: "Strategic Communication, B.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8444", level: "bachelor", area: "School of Arts and Communication" },
  { name: "Global Strategic Communication, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8349", level: "graduate", area: "School of Arts and Communication" },

  { name: "Applied Behavior Analysis, B.A.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8360", level: "bachelor", area: "School of Behavior Analysis" },
  { name: "Applied Behavior Analysis and Organizational Behavior Management, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8352", level: "graduate", area: "School of Behavior Analysis" },
  { name: "Applied Behavior Analysis, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8351", level: "graduate", area: "School of Behavior Analysis" },
  { name: "Behavior Analysis Practice, M.A.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8353", level: "graduate", area: "School of Behavior Analysis" },
  { name: "Behavior Analysis Professional Practice, M.A.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8493", level: "graduate", area: "School of Behavior Analysis" },
  { name: "Behavior Analysis, Ph.D.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8354", level: "graduate", area: "School of Behavior Analysis" },
  { name: "Organizational Behavior Management, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8179", level: "graduate", area: "School of Behavior Analysis" },

  { name: "Animal Behavior and Cognition, B.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8496", level: "bachelor", area: "School of Psychology" },
  { name: "Applied Psychology, B.A.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8361", level: "bachelor", area: "School of Psychology" },
  { name: "Forensic Psychology, B.A.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8363", level: "bachelor", area: "School of Psychology" },
  { name: "Psychology, B.A.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8364", level: "bachelor", area: "School of Psychology" },
  { name: "Psychology, B.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8365", level: "bachelor", area: "School of Psychology" },
  { name: "Clinical Psychology, Psy.D.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8370", level: "graduate", area: "School of Psychology" },
  { name: "Industrial/Organizational Psychology, M.S.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8368", level: "graduate", area: "School of Psychology" },
  { name: "Industrial/Organizational Psychology, Ph.D.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8369", level: "graduate", area: "School of Psychology" },
  { name: "Organizational Leadership, M.A.", url: "https://catalog.fit.edu/preview_program.php?catoid=20&poid=8438", level: "graduate", area: "School of Psychology" },
];

// Florida Tech is a four-year university, so an unqualified program name
// should resolve to the bachelor's rather than the graduate program of the
// same name.
export const fitCatalog = createProgramCatalog(FIT_PROGRAMS, { preferred: "bachelor" });
