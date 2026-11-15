const path = require('path');
const fs = require('fs');

const {
  normalizeSkill,
  normalizeSkills,
  extractResumeSkills,
  extractSkillsFromJD,
  calculateExperienceCompatibility,
  calculateJobMatch,
  ALIAS_MAP,
} = require('../src/services/jobMatcher.service');

function runJobMatcherVerification() {
  console.log('===================================================================');
  console.log('   RESUPREP - PHASE 5 CHECKPOINT 4: JOB MATCHER UNIT TEST SUITE   ');
  console.log('   Stateless, Deterministic Pure-Function Verification             ');
  console.log('===================================================================\n');

  const testResults = [];
  function record(testNum, name, pass, details) {
    testResults.push({ testNum, name, pass, details });
    console.log(`[TEST ${String(testNum).padStart(2, '0')}] ${pass ? '✅ PASS' : '❌ FAIL'}: ${name}`);
    if (details) console.log(`   └─ ${details}`);
  }

  try {
    // -------------------------------------------------------------------------
    // GROUP A: MODULE & RESUME SKILL EXTRACTION
    // -------------------------------------------------------------------------
    console.log('\n--- GROUP A: MODULE & RESUME SKILL EXTRACTION ---');

    // TEST 01: Exports all required functions
    const functionsCheck =
      typeof normalizeSkill === 'function' &&
      typeof normalizeSkills === 'function' &&
      typeof extractResumeSkills === 'function' &&
      typeof extractSkillsFromJD === 'function' &&
      typeof calculateJobMatch === 'function' &&
      typeof calculateExperienceCompatibility === 'function';
    record(1, 'Service Exports All Required Core Functions', functionsCheck, `Functions verified: ${functionsCheck}`);

    // TEST 02: Resume skills extracted correctly from resume.skills
    const sampleResume1 = {
      skills: ['JavaScript', 'React', 'HTML/CSS'],
    };
    const extracted1 = extractResumeSkills(sampleResume1);
    const pass02 =
      extracted1.length === 3 &&
      extracted1.includes('JavaScript') &&
      extracted1.includes('React') &&
      extracted1.includes('HTML/CSS');
    record(2, 'Resume Skills Extracted from resume.skills', pass02, `Extracted count: ${extracted1.length}`);

    // TEST 03: Project technologies split correctly from projects[].technologies
    const sampleResume2 = {
      skills: ['React'],
      projects: [
        { technologies: 'Node.js, MongoDB, Express' },
        { technologies: 'Docker / Kubernetes' },
      ],
    };
    const extracted2 = extractResumeSkills(sampleResume2);
    const pass03 =
      extracted2.includes('React') &&
      extracted2.includes('Node.js') &&
      extracted2.includes('MongoDB') &&
      extracted2.includes('Express') &&
      extracted2.includes('Docker') &&
      extracted2.includes('Kubernetes');
    record(3, 'Project Technologies Split & Merged Correctly', pass03, `Extracted: [${extracted2.join(', ')}]`);

    // TEST 04: Summary text is NOT used for skill extraction
    const sampleResumeSummary = {
      skills: ['Python'],
      summary: 'Experienced with JavaScript, React, Node.js, and AWS in cloud development.',
    };
    const extractedSummary = extractResumeSkills(sampleResumeSummary);
    const pass04 =
      extractedSummary.length === 1 &&
      extractedSummary[0] === 'Python' &&
      !extractedSummary.includes('JavaScript');
    record(4, 'Summary Text Strictly Excluded from Skill Extraction', pass04, `Extracted only explicit skills: [${extractedSummary.join(', ')}]`);

    // TEST 05: Experience description is NOT used for skill extraction
    const sampleResumeExp = {
      skills: ['TypeScript'],
      experience: [
        {
          position: 'Senior Engineer',
          description: 'Heavily developed in Java, Go, Kubernetes, and PostgreSQL microservices.',
        },
      ],
    };
    const extractedExp = extractResumeSkills(sampleResumeExp);
    const pass05 =
      extractedExp.length === 1 &&
      extractedExp[0] === 'TypeScript' &&
      !extractedExp.includes('Java');
    record(5, 'Experience Description Strictly Excluded from Skill Extraction', pass05, `Extracted only explicit skills: [${extractedExp.join(', ')}]`);

    // TEST 06: Null and invalid values handled safely
    const nullResume = null;
    const undefResume = undefined;
    const emptyResume = {};
    const invalidTypesResume = {
      skills: [null, undefined, 123, '', '   ', 'React'],
      projects: [null, { technologies: null }, { technologies: '' }, { technologies: 'Docker, , ' }],
    };
    const pass06 =
      extractResumeSkills(nullResume).length === 0 &&
      extractResumeSkills(undefResume).length === 0 &&
      extractResumeSkills(emptyResume).length === 0 &&
      extractResumeSkills(invalidTypesResume).length === 2 && // React and Docker
      extractResumeSkills(invalidTypesResume).includes('React') &&
      extractResumeSkills(invalidTypesResume).includes('Docker');
    record(6, 'Null, Undefined, and Empty Elements Handled Safely', pass06, 'Safe fallback with zero runtime exceptions');

    // TEST 07: Duplicate skills removed during extraction
    const dupResume = {
      skills: ['JavaScript', 'javascript', 'JS', 'React', 'ReactJS'],
      projects: [{ technologies: 'React, JS, Node.js' }],
    };
    const extractedDup = extractResumeSkills(dupResume);
    const pass07 =
      extractedDup.length === 3 && // JavaScript, React, Node.js
      extractedDup.includes('JavaScript') &&
      extractedDup.includes('React') &&
      extractedDup.includes('Node.js');
    record(7, 'Duplicate Skills and Alias Collisions Filtered on Extraction', pass07, `Deduplicated to 3 skills: [${extractedDup.join(', ')}]`);

    // -------------------------------------------------------------------------
    // GROUP B: NORMALIZATION ENGINE
    // -------------------------------------------------------------------------
    console.log('\n--- GROUP B: NORMALIZATION ENGINE ---');

    // TEST 08: JS normalizes to javascript
    const normJS = normalizeSkill('JS');
    record(8, 'JS Resolves to Canonical "javascript"', normJS === 'javascript', `Resolved: "${normJS}"`);

    // TEST 09: Javascript and JavaScript resolve to same canonical skill
    const normJ1 = normalizeSkill('Javascript');
    const normJ2 = normalizeSkill('JavaScript');
    const normJ3 = normalizeSkill('Java Script');
    const pass09 = normJ1 === 'javascript' && normJ2 === 'javascript' && normJ3 === 'javascript';
    record(9, 'Javascript, JavaScript, and Java Script Resolve to "javascript"', pass09, `All resolved to "${normJ1}"`);

    // TEST 10: ReactJS resolves to react
    const normR1 = normalizeSkill('ReactJS');
    const normR2 = normalizeSkill('React.js');
    const normR3 = normalizeSkill('React JS');
    const pass10 = normR1 === 'react' && normR2 === 'react' && normR3 === 'react';
    record(10, 'ReactJS, React.js, and React JS Resolve to "react"', pass10, `All resolved to "${normR1}"`);

    // TEST 11: NodeJS resolves to node.js
    const normN1 = normalizeSkill('NodeJS');
    const normN2 = normalizeSkill('Node.js');
    const normN3 = normalizeSkill('Node');
    const pass11 = normN1 === 'node.js' && normN2 === 'node.js' && normN3 === 'node.js';
    record(11, 'NodeJS, Node.js, and Node Resolve to "node.js"', pass11, `All resolved to "${normN1}"`);

    // TEST 12: Mongo DB resolves to mongodb
    const normM1 = normalizeSkill('Mongo DB');
    const normM2 = normalizeSkill('Mongo');
    const normM3 = normalizeSkill('MongoDB');
    const pass12 = normM1 === 'mongodb' && normM2 === 'mongodb' && normM3 === 'mongodb';
    record(12, 'Mongo DB, Mongo, and MongoDB Resolve to "mongodb"', pass12, `All resolved to "${normM1}"`);

    // TEST 13: TypeScript aliases resolve correctly
    const normT1 = normalizeSkill('TS');
    const normT2 = normalizeSkill('TypeScript');
    const normT3 = normalizeSkill('Type Script');
    const pass13 = normT1 === 'typescript' && normT2 === 'typescript' && normT3 === 'typescript';
    record(13, 'TS, TypeScript, and Type Script Resolve to "typescript"', pass13, `All resolved to "${normT1}"`);

    // TEST 14: Tailwind aliases resolve correctly
    const normTw1 = normalizeSkill('Tailwind');
    const normTw2 = normalizeSkill('TailwindCSS');
    const normTw3 = normalizeSkill('Tailwind CSS');
    const pass14 = normTw1 === 'tailwind css' && normTw2 === 'tailwind css' && normTw3 === 'tailwind css';
    record(14, 'Tailwind, TailwindCSS, and Tailwind CSS Resolve to "tailwind css"', pass14, `All resolved to "${normTw1}"`);

    // TEST 15: Unknown valid skills are preserved
    const unknownSkill = normalizeSkill('Solidity');
    const unknownSkillCompound = normalizeSkill('Apache Flink');
    const pass15 = unknownSkill === 'solidity' && unknownSkillCompound === 'apache flink';
    record(15, 'Unknown Valid Skills Preserved with Lowercase Normalization', pass15, `Solidity -> "${unknownSkill}", Apache Flink -> "${unknownSkillCompound}"`);

    // TEST 16: Whitespace and case differences normalize correctly
    const normSpaces = normalizeSkill('   React   Native   ');
    const pass16 = normSpaces === 'react native';
    record(16, 'Surrounding and Redundant Internal Whitespace Collapsed', pass16, `Collapsed to "${normSpaces}"`);

    // TEST 17: C++ and C# are preserved
    const normCpp = normalizeSkill('C++');
    const normCSharp = normalizeSkill('C#');
    const normDotNet = normalizeSkill('.NET');
    const pass17 = normCpp === 'c++' && normCSharp === 'c#' && normDotNet === '.net';
    record(17, 'Punctuation-Heavy Languages Preserved (C++, C#, .NET)', pass17, `C++ -> "${normCpp}", C# -> "${normCSharp}", .NET -> "${normDotNet}"`);

    // TEST 18: Java never matches JavaScript
    const normJava = normalizeSkill('Java');
    const pass18 = normJava === 'java' && normJava !== normJ1;
    record(18, 'Boundary Safety: "Java" NEVER Matches "JavaScript"', pass18, `Java: "${normJava}" !== JavaScript: "${normJ1}"`);

    // TEST 19: C never matches C++ or CSS
    const normC = normalizeSkill('C');
    const normCss = normalizeSkill('CSS');
    const pass19 = normC === 'c' && normC !== normCpp && normC !== normCss;
    record(19, 'Boundary Safety: "C" NEVER Matches "C++" or "CSS"', pass19, `C: "${normC}" !== C++: "${normCpp}" !== CSS: "${normCss}"`);

    // TEST 20: Express never matches Node.js
    const normExp = normalizeSkill('Express');
    const pass20 = normExp === 'express' && normExp !== normN1;
    record(20, 'Distinction: "Express" NEVER Automatically Equates to "Node.js"', pass20, `Express: "${normExp}" !== Node.js: "${normN1}"`);

    // -------------------------------------------------------------------------
    // GROUP C: MATCHING ENGINE & APPROVED SCORING FORMULA
    // -------------------------------------------------------------------------
    console.log('\n--- GROUP C: MATCHING ENGINE & SCORING ---');

    // TEST 21: Correct 85/15 formula (Worked example from specification)
    // Job: 4 required (JS, React, Node.js, MongoDB), 2 preferred (TS, Docker)
    // Resume: JS, ReactJS, Express, Docker
    // M_req = [JS, React] (2/4 = 50%), M_pref = [Docker] (1/2 = 50%)
    // Score = 0.85*50 + 0.15*50 = 50%
    const workedJob = {
      requiredSkills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
      preferredSkills: ['TypeScript', 'Docker'],
      experience: { min: 3, level: 'mid' },
    };
    const workedResume = {
      skills: ['JS', 'ReactJS', 'Express', 'Docker'],
    };
    const workedMatch = calculateJobMatch(workedResume, workedJob);
    const pass21 =
      workedMatch.matchPercentage === 50 &&
      workedMatch.breakdown.requiredScore === 50 &&
      workedMatch.breakdown.preferredScore === 50 &&
      workedMatch.breakdown.requiredWeight === 85 &&
      workedMatch.breakdown.preferredWeight === 15 &&
      workedMatch.matchedRequiredSkills.length === 2 &&
      workedMatch.missingRequiredSkills.length === 2 &&
      workedMatch.matchedPreferredSkills.length === 1 &&
      workedMatch.missingPreferredSkills.length === 1;
    record(21, 'Approved 85/15 Scoring Formula Yields Exact Expected 50%', pass21, `Match: ${workedMatch.matchPercentage}%, ReqScore: ${workedMatch.breakdown.requiredScore}%, PrefScore: ${workedMatch.breakdown.preferredScore}%`);

    // TEST 22: Required-only job gives 100% weight to required skills
    const reqOnlyJob = {
      requiredSkills: ['React', 'Node.js', 'TypeScript', 'Docker'],
      preferredSkills: [],
    };
    const partialResume = {
      skills: ['React', 'Node.js', 'TypeScript'], // 3 of 4 = 75%
    };
    const reqOnlyMatch = calculateJobMatch(partialResume, reqOnlyJob);
    const pass22 =
      reqOnlyMatch.matchPercentage === 75 &&
      reqOnlyMatch.breakdown.requiredWeight === 100 &&
      reqOnlyMatch.breakdown.preferredWeight === 0 &&
      reqOnlyMatch.breakdown.requiredScore === 75;
    record(22, 'Required-Only Job Assigns 100% Weight to Required Skills (75%)', pass22, `Match: ${reqOnlyMatch.matchPercentage}%, ReqWeight: ${reqOnlyMatch.breakdown.requiredWeight}%`);

    // TEST 23: Preferred-only job scores correctly
    const prefOnlyJob = {
      requiredSkills: [],
      preferredSkills: ['Python', 'FastAPI'],
    };
    const prefMatch = calculateJobMatch({ skills: ['Python'] }, prefOnlyJob);
    const pass23 =
      prefMatch.matchPercentage === 50 &&
      prefMatch.breakdown.preferredWeight === 100 &&
      prefMatch.breakdown.requiredWeight === 0 &&
      prefMatch.breakdown.preferredScore === 50;
    record(23, 'Preferred-Only Job Assigns 100% Weight to Preferred Skills (50%)', pass23, `Match: ${prefMatch.matchPercentage}%, PrefWeight: ${prefMatch.breakdown.preferredWeight}%`);

    // TEST 24: Fully matched resume produces exactly 100%
    const perfectResume = {
      skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'TypeScript', 'Docker'],
    };
    const perfectMatch = calculateJobMatch(perfectResume, workedJob);
    const pass24 =
      perfectMatch.matchPercentage === 100 &&
      perfectMatch.missingRequiredSkills.length === 0 &&
      perfectMatch.missingPreferredSkills.length === 0;
    record(24, 'Fully Matched Candidate Produces Exactly 100%', pass24, `Match: ${perfectMatch.matchPercentage}%, Missing req: 0, Missing pref: 0`);

    // TEST 25: Zero matching skills produces 0%
    const zeroResume = {
      skills: ['Ruby', 'PHP', 'Laravel'],
    };
    const zeroMatch = calculateJobMatch(zeroResume, workedJob);
    const pass25 =
      zeroMatch.matchPercentage === 0 &&
      zeroMatch.matchedRequiredSkills.length === 0 &&
      zeroMatch.matchedPreferredSkills.length === 0;
    record(25, 'Zero Matching Skills Yields Exactly 0% with All Skills Missing', pass25, `Match: ${zeroMatch.matchPercentage}%, Missing: ${zeroMatch.missingRequiredSkills.length + zeroMatch.missingPreferredSkills.length}`);

    // TEST 26: Empty resume returns all requirements as missing
    const emptyMatch = calculateJobMatch({ skills: [] }, workedJob);
    const pass26 =
      emptyMatch.matchPercentage === 0 &&
      emptyMatch.missingRequiredSkills.length === 4 &&
      emptyMatch.missingPreferredSkills.length === 2 &&
      emptyMatch.status === 'success';
    record(26, 'Empty Candidate Resume Lists All Job Skills Under Missing Arrays', pass26, `Missing req: ${emptyMatch.missingRequiredSkills.length}, Missing pref: ${emptyMatch.missingPreferredSkills.length}`);

    // TEST 27: Duplicate skills in resume or job cannot inflate score
    const dupJob = {
      requiredSkills: ['React', 'react', 'ReactJS', 'Node.js'],
      preferredSkills: ['React', 'TypeScript'], // React is already required, so excluded from preferred
    };
    const dupMatch = calculateJobMatch({ skills: ['React', 'React.js', 'ReactJS'] }, dupJob);
    // Unique req: React, Node.js (2). Matched: React (1/2 = 50%).
    // Unique pref: TypeScript (1). Matched: 0 (0%).
    // Score: 0.85*50 + 0 = 42.5 -> 43%
    const pass27 =
      dupMatch.breakdown.totalRequiredCount === 2 &&
      dupMatch.breakdown.totalPreferredCount === 1 &&
      dupMatch.matchPercentage === 43;
    record(27, 'Duplicate Skills and Cross-List Collisions Deduplicated Before Scoring', pass27, `Deduplicated req count: 2, pref count: 1, Score: ${dupMatch.matchPercentage}%`);

    // TEST 28: Extra resume skills do not increase the score
    const extraResume = {
      skills: [
        'React', 'Node.js', // 2 of 4 req
        'Docker', // 1 of 2 pref
        'Go', 'Rust', 'C++', 'Python', 'AWS', 'Linux', 'Kubernetes', 'GraphQL', 'Tailwind',
      ],
    };
    const extraMatch = calculateJobMatch(extraResume, workedJob);
    const pass28 = extraMatch.matchPercentage === 50; // Remains exactly 50%
    record(28, 'Extraneous Candidate Skills Do Not Artificially Alter Score (50%)', pass28, `Match: ${extraMatch.matchPercentage}%`);

    // TEST 29: Matched and missing skills retain readable display labels from job
    const pass29 =
      workedMatch.matchedRequiredSkills.includes('JavaScript') &&
      workedMatch.matchedRequiredSkills.includes('React') &&
      workedMatch.missingRequiredSkills.includes('Node.js') &&
      workedMatch.missingRequiredSkills.includes('MongoDB');
    record(29, 'Preserves Original Readable Display Labels in Output', pass29, `Matched: [${workedMatch.matchedRequiredSkills.join(', ')}], Missing: [${workedMatch.missingRequiredSkills.join(', ')}]`);

    // TEST 30: Job with no requirements returns insufficient-job-skills
    const emptyJobMatch = calculateJobMatch(workedResume, { requiredSkills: [], preferredSkills: [] });
    const pass30 =
      emptyJobMatch.matchPercentage === 0 &&
      emptyJobMatch.status === 'insufficient-job-skills';
    record(30, 'Job with Zero Skills Returns 0% and "insufficient-job-skills"', pass30, `Status: "${emptyJobMatch.status}", Score: ${emptyJobMatch.matchPercentage}%`);

    // TEST 31: Partial skills remain empty array
    const pass31 = Array.isArray(workedMatch.partialSkills) && workedMatch.partialSkills.length === 0;
    record(31, 'Partial Skills Remains Empty Array (No Arbitrary Equivalency)', pass31, `partialSkills: [${workedMatch.partialSkills}]`);

    // TEST 32: Experience compatibility does NOT affect match percentage
    const resumeNoExp = {
      skills: ['JS', 'ReactJS', 'Express', 'Docker'],
      experience: [],
    };
    const resumeSeniorExp = {
      skills: ['JS', 'ReactJS', 'Express', 'Docker'],
      experience: [
        { startDate: '2015', endDate: '2026', current: true },
      ],
    };
    const matchNoExp = calculateJobMatch(resumeNoExp, workedJob);
    const matchSeniorExp = calculateJobMatch(resumeSeniorExp, workedJob);
    const pass32 =
      matchNoExp.matchPercentage === 50 &&
      matchSeniorExp.matchPercentage === 50 &&
      matchNoExp.experienceCompatibility.status === 'unknown' &&
      matchSeniorExp.experienceCompatibility.status === 'match';
    record(32, 'Experience Evaluation Isolated from Numeric Skill Match Percentage', pass32, `Both scores 50%; Exp 1: "${matchNoExp.experienceCompatibility.status}", Exp 2: "${matchSeniorExp.experienceCompatibility.status}"`);

    // -------------------------------------------------------------------------
    // GROUP D: JOB DESCRIPTION TEXT EXTRACTION
    // -------------------------------------------------------------------------
    console.log('\n--- GROUP D: JOB DESCRIPTION TEXT EXTRACTION ---');

    const sampleJdText = `
      About the Role:
      We are looking for an exceptional Senior Software Engineer to build scalable microservices.

      Requirements:
      - 5+ years of experience with JavaScript and TypeScript.
      - Strong production background in React and Node.js.
      - Experience with MongoDB and PostgreSQL databases.

      Preferred Skills:
      - Familiarity with Docker and Kubernetes container workflows.
      - Knowledge of CI/CD pipelines and AWS cloud services.

      What We Offer:
      Competitive salary, equity, and remote flexibility.
    `;

    // TEST 33: Recognizes JavaScript, React, Node.js and MongoDB
    const jdExtract1 = extractSkillsFromJD(sampleJdText);
    const pass33 =
      jdExtract1.status === 'success' &&
      jdExtract1.requiredSkills.includes('JavaScript') &&
      jdExtract1.requiredSkills.includes('TypeScript') &&
      jdExtract1.requiredSkills.includes('React') &&
      jdExtract1.requiredSkills.includes('Node.js') &&
      jdExtract1.requiredSkills.includes('MongoDB') &&
      jdExtract1.requiredSkills.includes('PostgreSQL');
    record(33, 'Recognizes Core Stack from Unstructured Text (JS, React, Node, Mongo)', pass33, `Required extracted: [${jdExtract1.requiredSkills.join(', ')}]`);

    // TEST 34: Recognizes punctuation-heavy skills (C++, C#, .NET, CI/CD)
    const punctuationJd = `
      Must have hands-on experience in C++, C#, and .NET application frameworks.
      Must maintain automated CI/CD deployment pipelines.
    `;
    const jdExtract2 = extractSkillsFromJD(punctuationJd);
    const pass34 =
      jdExtract2.requiredSkills.includes('C++') &&
      jdExtract2.requiredSkills.includes('C#') &&
      jdExtract2.requiredSkills.includes('.NET') &&
      jdExtract2.requiredSkills.includes('CI/CD');
    record(34, 'Recognizes Punctuation-Heavy Technologies (C++, C#, .NET, CI/CD)', pass34, `Extracted: [${jdExtract2.requiredSkills.join(', ')}]`);

    // TEST 35: Correctly identifies preferred skills under Preferred Skills heading
    const pass35 =
      jdExtract1.preferredSkills.includes('Docker') &&
      jdExtract1.preferredSkills.includes('Kubernetes') &&
      jdExtract1.preferredSkills.includes('CI/CD') &&
      jdExtract1.preferredSkills.includes('AWS');
    record(35, 'Preferred Skills Heading Correctly Partitions Skills', pass35, `Preferred extracted: [${jdExtract1.preferredSkills.join(', ')}]`);

    // TEST 36: Correctly resets preferred classification after another heading
    const multiSectionJd = `
      Required Qualifications:
      - Python and Django

      Nice to Have:
      - Redis and Kafka

      Responsibilities:
      - Build high-scale services using FastAPI and PostgreSQL.
    `;
    const jdExtract3 = extractSkillsFromJD(multiSectionJd);
    const pass36 =
      jdExtract3.requiredSkills.includes('Python') &&
      jdExtract3.requiredSkills.includes('Django') &&
      jdExtract3.preferredSkills.includes('Redis') &&
      jdExtract3.preferredSkills.includes('Kafka') &&
      jdExtract3.requiredSkills.includes('FastAPI') && // Reset to required
      jdExtract3.requiredSkills.includes('PostgreSQL');
    record(36, 'Preferred Section Context Resets Cleanly on Subsequent Heading', pass36, `Required: [${jdExtract3.requiredSkills.join(', ')}], Preferred: [${jdExtract3.preferredSkills.join(', ')}]`);

    // TEST 37: Does not falsely match Java inside JavaScript
    const jsOnlyJd = `
      Senior JavaScript Developer needed. Must have 5 years with modern JavaScript frameworks.
    `;
    const jdExtractJava = extractSkillsFromJD(jsOnlyJd);
    const pass37 =
      jdExtractJava.requiredSkills.includes('JavaScript') &&
      !jdExtractJava.requiredSkills.includes('Java');
    record(37, 'Boundary Check: "Java" Not Falsely Extracted from "JavaScript"', pass37, `Extracted: [${jdExtractJava.requiredSkills.join(', ')}]`);

    // TEST 38: Does not falsely match C inside CSS or C++
    const cssOnlyJd = `
      Frontend styling specialist with expertise in CSS, Tailwind CSS, and C++ graphics rendering.
    `;
    const jdExtractC = extractSkillsFromJD(cssOnlyJd);
    const pass38 =
      jdExtractC.requiredSkills.includes('CSS') &&
      jdExtractC.requiredSkills.includes('C++') &&
      !jdExtractC.requiredSkills.includes('C');
    record(38, 'Boundary Check: "C" Not Falsely Extracted from "CSS" or "C++"', pass38, `Extracted: [${jdExtractC.requiredSkills.join(', ')}]`);

    // TEST 39: Deduplicates aliases found in the same JD
    const dupJd = `
      We use React, React.js, ReactJS, NodeJS, and Node.js across our teams.
    `;
    const jdExtractDup = extractSkillsFromJD(dupJd);
    const pass39 =
      jdExtractDup.requiredSkills.length === 2 &&
      jdExtractDup.requiredSkills.includes('React') &&
      jdExtractDup.requiredSkills.includes('Node.js');
    record(39, 'Deduplicates Alias Variants Found Within the Same JD Text', pass39, `Extracted count: ${jdExtractDup.requiredSkills.length} [${jdExtractDup.requiredSkills.join(', ')}]`);

    // TEST 40: Returns no-skills-found when no known skills exist
    const noSkillsJd = `
      Looking for an office receptionist to manage phone calls, mail, and greeting visitors.
    `;
    const jdExtractEmpty = extractSkillsFromJD(noSkillsJd);
    const pass40 =
      jdExtractEmpty.status === 'no-skills-found' &&
      jdExtractEmpty.extractedSkillsCount === 0 &&
      jdExtractEmpty.requiredSkills.length === 0;
    record(40, 'Returns "no-skills-found" When Zero Tech Skills are Detected', pass40, `Status: "${jdExtractEmpty.status}", Count: ${jdExtractEmpty.extractedSkillsCount}`);

    // TEST 41: Handles empty and invalid JD inputs safely
    const pass41 =
      extractSkillsFromJD(null).status === 'no-skills-found' &&
      extractSkillsFromJD(undefined).status === 'no-skills-found' &&
      extractSkillsFromJD('').status === 'no-skills-found' &&
      extractSkillsFromJD('     ').status === 'no-skills-found' &&
      extractSkillsFromJD(12345).status === 'no-skills-found';
    record(41, 'Null, Non-String, and Whitespace-Only JD Inputs Handled Safely', pass41, 'All gracefully returned "no-skills-found"');

    // -------------------------------------------------------------------------
    // GROUP E: DETERMINISM & REPRODUCIBILITY
    // -------------------------------------------------------------------------
    console.log('\n--- GROUP E: DETERMINISM & REPRODUCIBILITY ---');

    // TEST 42: Repeated identical inputs produce identical results across 100 iterations
    let identicalPass = true;
    const baseResult = calculateJobMatch(workedResume, workedJob);
    const serializedBase = JSON.stringify(baseResult);

    for (let i = 0; i < 100; i++) {
      const iterResult = calculateJobMatch(workedResume, workedJob);
      if (JSON.stringify(iterResult) !== serializedBase) {
        identicalPass = false;
        break;
      }
    }
    record(42, '100 Repeated Executions Produce 100% Identical Output', identicalPass, 'Zero stochastic drift detected');

    // TEST 43: Result does not depend on array ordering in resume.skills
    const shuffledResume1 = { skills: ['JS', 'ReactJS', 'Docker', 'Express'] };
    const shuffledResume2 = { skills: ['Docker', 'Express', 'ReactJS', 'JS'] };
    const res1 = calculateJobMatch(shuffledResume1, workedJob);
    const res2 = calculateJobMatch(shuffledResume2, workedJob);
    const pass43 =
      res1.matchPercentage === res2.matchPercentage &&
      res1.breakdown.requiredScore === res2.breakdown.requiredScore &&
      res1.breakdown.preferredScore === res2.breakdown.preferredScore;
    record(43, 'Output Invariant to Input Skill Array Permutation', pass43, `Permutation 1: ${res1.matchPercentage}%, Permutation 2: ${res2.matchPercentage}%`);

    // TEST 44: Zero Math.random() or LLM calls in service source code
    const serviceSource = fs.readFileSync(
      path.resolve(__dirname, '../src/services/jobMatcher.service.js'),
      'utf-8'
    );
    const pass44 =
      !serviceSource.includes('Math.random()') &&
      !serviceSource.includes('openai') &&
      !serviceSource.includes('OpenAI') &&
      !serviceSource.includes('fetch(') &&
      !serviceSource.includes('axios');
    record(44, 'Source Code Contains Zero Math.random() or External AI Invocations', pass44, 'Pure deterministic local algorithm verified');

  } catch (error) {
    console.error('Fatal harness error:', error);
    record(99, 'Harness Execution Exception', false, error.message);
  } finally {
    console.log('\n===================================================================');
    const allPassed = testResults.every((t) => t.pass);
    console.log(`VERIFICATION SUMMARY: ${allPassed ? 'ALL TESTS PASSED ✅' : 'FAILURES DETECTED ❌'}`);
    console.log(`Total Tests: ${testResults.length} | Passed: ${testResults.filter((t) => t.pass).length} | Failed: ${testResults.filter((t) => !t.pass).length}`);
    console.log('===================================================================\n');

    process.exit(allPassed ? 0 : 1);
  }
}

runJobMatcherVerification();

