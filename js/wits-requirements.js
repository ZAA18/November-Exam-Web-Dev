/* Wits NSC school-leaver requirements checked against official course-finder pages. */
window.WITS_REQUIREMENTS = (() => {
    const english5 = [{ subjects: ["englishHome", "englishFAL"], level: 5, mode: "any" }];
    const english6 = [{ subjects: ["englishHome", "englishFAL"], level: 6, mode: "any" }];
    const english7 = [{ subjects: ["englishHome", "englishFAL"], level: 7, mode: "any" }];
    const mathematics5 = [{ subjects: ["mathematics"], level: 5, mode: "all" }];
    const mathematics6 = [{ subjects: ["mathematics"], level: 6, mode: "all" }];
    const mathematics7 = [{ subjects: ["mathematics"], level: 7, mode: "all" }];
    const physicalScience5 = [{ subjects: ["physicalSciences"], level: 5, mode: "all" }];
    const nbt = "NBT required";
    const nbtInPerson = "NBT required in person; selection uses a Composite Index (75% matric results, 25% NBT)";

    function programmes(faculty, aps, entries, selectionRequirements = "") {
        return entries.map(([name, path, requirements]) => ({
            name,
            faculty,
            aps,
            requirements,
            selectionRequirements,
            url: `https://www.wits.ac.za/course-finder/undergraduate/${path}/`
        }));
    }

    return {
        year: 2027,
        source: "https://www.wits.ac.za/undergraduate/entry-requirements/",
        programmes: [
            ...programmes("Commerce, Law and Management", 38, [
                ["Accounting", "clm/accounting", [...english5, ...mathematics5]],
                ["BCom (General)", "clm/bcom", [...english5, ...mathematics5]],
                ["Economics", "clm/economics", [...english5, ...mathematics5]],
                ["Finance", "clm/finance", [...english5, ...mathematics5]],
                ["Human Resource Management", "clm/human-resource-management", [...english5, ...mathematics5]],
                ["Information Systems", "clm/information-systems", [...english5, ...mathematics5]],
                ["Insurance and Risk Management", "clm/insurance-and-risk-management", [...english5, ...mathematics5]],
                ["Management", "clm/management", [...english5, ...mathematics5]],
                ["Marketing", "clm/marketing", [...english5, ...mathematics5]],
                ["Politics, Philosophy and Economics (PPE)", "clm/ppe", [...english5, ...mathematics5]]
            ]),
            ...programmes("Commerce, Law and Management", 44, [
                ["Accounting Science (BAccSc)", "clm/accounting-science-baccsc", [
                    ...english5,
                    { subjects: ["mathematics"], level: 6, mode: "all" }
                ]]
            ]),
            ...programmes("Commerce, Law and Management", 42, [
                ["BCom Financial Sciences", "clm/bcom-financial-sciences", [...english5, ...mathematics7]],
                ["Economic Science", "clm/economic-science", [...english5, ...mathematics7]]
            ]),
            ...programmes("Commerce, Law and Management", 43, [
                ["Law", "clm/law", [...english5, ...mathematics5]],
                ["BCom part-time with Law", "clm/bcom-part-time-with-law", [...english5, ...mathematics5]]
            ]),
            ...programmes("Commerce, Law and Management", 46, [
                ["LLB (four-year stream)", "clm/llb-law", [
                    { subjects: ["englishHome", "englishFAL"], level: 6, mode: "any" },
                    { subjects: ["mathematics", "mathLiteracy"], level: 5, mode: "any" }
                ]]
            ]),
            ...programmes("Engineering and the Built Environment", 42, [
                ["Aeronautical Engineering", "ebe/aeronautical-engineering", [...english5, ...mathematics5, ...physicalScience5]],
                ["Biomedical Engineering", "ebe/biomedical-engineering", [...english5, ...mathematics5, ...physicalScience5]],
                ["Chemical Engineering", "ebe/chemical-engineering", [...english5, ...mathematics5, ...physicalScience5]],
                ["Civil Engineering", "ebe/civil-engineering", [...english5, ...mathematics5, ...physicalScience5]],
                ["Electrical Engineering", "ebe/electrical-engineering", [...english5, ...mathematics5, ...physicalScience5]],
                ["Industrial Engineering", "ebe/industrial-engineering", [...english5, ...mathematics5, ...physicalScience5]],
                ["Information Engineering", "ebe/information-engineering", [...english5, ...mathematics5, ...physicalScience5]],
                ["Mechanical Engineering", "ebe/mechanical-engineering", [...english5, ...mathematics5, ...physicalScience5]],
                ["Metallurgy and Materials Engineering", "ebe/metallurgy-and-materials-engineering", [...english5, ...mathematics5, ...physicalScience5]],
                ["Mining Engineering", "ebe/mining-engineering", [...english5, ...mathematics5, ...physicalScience5]],
                ["Engineering Science in Digital Arts", "ebe/digital-arts", [...english5, ...mathematics5, ...physicalScience5]]
            ], "Wait-listing and final selection may apply."),
            ...programmes("Engineering and the Built Environment", 29, [
                ["Architectural Studies", "ebe/architectural-studies", [
                    { subjects: ["englishHome", "englishFAL"], level: 4, mode: "any" },
                    { subjects: ["mathematics"], level: 4, mode: "all" }
                ]]
            ], "Written and graphic exercise; shortlisted applicants are interviewed. These and APS are factored equally."),
            ...programmes("Engineering and the Built Environment", 36, [
                ["Construction Studies", "ebe/construction-studies", [...english5, ...mathematics5]],
                ["Urban and Regional Planning", "ebe/urban-and-regional-planning", [...english5, ...mathematics5]],
                ["Property Studies", "ebe/property-studies", [...english5, ...mathematics5]]
            ]),
            ...programmes("Health Sciences", null, [
                ["Biokinetics", "health/biokinetics", [
                    ...english5, ...mathematics5,
                    { subjects: ["lifeSciences", "physicalSciences"], level: 5, mode: "any" }
                ]],
                ["Biomedical Sciences", "health/biomedical-sciences", [
                    ...english5, ...mathematics5,
                    { subjects: ["lifeSciences", "physicalSciences"], level: 5, mode: "any" }
                ]],
                ["Health Systems Sciences", "health/health-systems-science", [
                    ...english5, ...mathematics5,
                    { subjects: ["lifeSciences", "physicalSciences"], level: 5, mode: "any" }
                ]],
                ["Medicine and Surgery", "health/medicine-and-surgery", [
                    ...english5, ...mathematics5,
                    { subjects: ["lifeSciences", "physicalSciences"], level: 5, mode: "any" }
                ]],
                ["Pharmacy", "health/pharmacy", [
                    ...english5, ...mathematics5,
                    { subjects: ["lifeSciences", "physicalSciences"], level: 5, mode: "any" }
                ]],
                ["Physiotherapy", "health/physiotherapy", [
                    ...english5, ...mathematics5,
                    { subjects: ["lifeSciences", "physicalSciences"], level: 5, mode: "any" }
                ]],
                ["Dental Science", "health/dental-science", [
                    ...english5, ...mathematics5,
                    { subjects: ["lifeSciences"], level: 5, mode: "all" },
                    { subjects: ["physicalSciences"], level: 5, mode: "all" }
                ]],
                ["Clinical Medical Practice", "health/clinical-medical-practice", [
                    { subjects: ["englishHome", "englishFAL"], level: 4, mode: "any" },
                    { subjects: ["mathematics"], level: 4, mode: "all" },
                    { subjects: ["lifeSciences", "physicalSciences"], level: 4, mode: "any" }
                ]],
                ["Nursing", "health/nursing", [
                    { subjects: ["englishHome", "englishFAL"], level: 4, mode: "any" },
                    { subjects: ["mathematics"], level: 4, mode: "all" },
                    { subjects: ["lifeSciences", "physicalSciences"], level: 4, mode: "any" }
                ]],
                ["Occupational Therapy", "health/occupational-therapy", [
                    { subjects: ["englishHome", "englishFAL"], level: 4, mode: "any" },
                    { subjects: ["mathematics"], level: 4, mode: "all" },
                    { subjects: ["lifeSciences", "physicalSciences"], level: 4, mode: "any" }
                ]],
                ["Oral Health Sciences", "health/oral-health-sciences", [
                    { subjects: ["englishHome", "englishFAL"], level: 4, mode: "any" },
                    { subjects: ["mathematics", "mathLiteracy"], level: 4, mode: "any" },
                    { subjects: ["lifeSciences", "physicalSciences"], level: 4, mode: "any" }
                ]]
            ], nbtInPerson),
            ...programmes("Humanities", 36, [
                ["BA", "humanities/ba", english5],
                ["Digital Arts", "humanities/digital-arts", english5],
                ["Social Work", "humanities/social-work", english5]
            ]),
            ...programmes("Humanities", 43, [
                ["BA part-time with Law", "humanities/ba-part-time-with-law", [
                    ...english5,
                    { subjects: ["mathematics", "mathLiteracy"], level: 3, mode: "any" }
                ]],
                ["Law", "humanities/law", [
                    ...english5,
                    { subjects: ["mathematics", "mathLiteracy"], level: 3, mode: "any" }
                ]]
            ]),
            ...programmes("Humanities", 37, [
                ["BEd Foundation Phase Teaching", "humanities/bed-foundation-phase-teaching", [
                    ...english5,
                    { subjects: ["mathematics", "mathLiteracy"], level: 4, mode: "any" }
                ]],
                ["BEd Intermediate Phase Teaching", "humanities/bed-intermediate-phase-teaching", [
                    ...english5,
                    { subjects: ["mathematics", "mathLiteracy"], level: 4, mode: "any" }
                ]]
            ]),
            ...programmes("Humanities", 37, [
                ["BEd Senior Phase and Further Education and Training", "humanities/bed-senior-phase-teaching", english5]
            ], "Prerequisite matric subject combinations also apply; check the official programme page."),
            ...programmes("Humanities", 34, [
                ["Audiology", "humanities/audiology", [...english5, { subjects: ["mathematics"], level: 4, mode: "all" }]],
                ["Speech-Language Pathology", "humanities/speech-language-pathology", [...english5, { subjects: ["mathematics"], level: 4, mode: "all" }]]
            ], "NBT required"),
            ...programmes("Humanities", 34, [
                ["Music", "humanities/music", english5]
            ], "Interview and audition required."),
            ...programmes("Humanities", 34, [
                ["Film and Television", "humanities/film-and-television", english5]
            ], "Portfolio required; interview may be required."),
            ...programmes("Humanities", 34, [
                ["Fine Arts", "humanities/fine-arts", english5]
            ], "Online questionnaire, portfolio of artworks and CV required."),
            ...programmes("Humanities", 34, [
                ["Theatre and Performance", "humanities/theatre-and-performance", english5]
            ], "Auditions and interviews form part of departmental selection."),
            ...programmes("Science", 42, [
                ["BSc General", "science/bsc", [...english5, ...mathematics5]],
                ["Environmental Studies", "science/environmental-studies", [...english5, ...mathematics5]],
                ["Geographical and Archaeological Studies", "science/geographical-and-archaeological-sciences", [...english5, ...mathematics5]],
                ["Geospatial Sciences", "science/geospatial-sciences", [...english5, ...mathematics5]]
            ], nbt),
            ...programmes("Science", 43, [
                ["Applied Bioinformatics", "science/applied-bioinformatics", [...english5, ...mathematics5]],
                ["Applied Ecology and Global Change", "science/applied-ecology-and-global-change", [...english5, ...mathematics5]],
                ["Biochemistry and Cell Biology", "science/biochemistry-and-cell-biology", [...english5, ...mathematics5]],
                ["Biodiversity in a Changing World", "science/biodiversity", [...english5, ...mathematics5]],
                ["Genetics and Developmental Biology", "science/genetics-and-developmental-biology", [...english5, ...mathematics5]],
                ["Microbiology and Biotechnology", "science/microbiology-and-biotechnology", [...english5, ...mathematics5]]
            ], nbt),
            ...programmes("Science", 44, [
                ["Computational and Applied Mathematics", "science/computational-and-applied-mathematics", [...english5, ...mathematics6]],
                ["Computer Science", "science/computer-science", [...english5, ...mathematics6]]
            ], nbt),
            ...programmes("Science", 44, [
                ["Actuarial Science", "science/actuarial-science", [...english7, ...mathematics7, { subjects: ["physicalSciences"], level: 7, mode: "all" }]],
                ["Mathematical Sciences", "science/mathematical-sciences", [...english7, ...mathematics7, { subjects: ["physicalSciences"], level: 7, mode: "all" }]]
            ], nbt),
            ...programmes("Science", 43, [
                ["Astronomy and Astrophysics", "science/astronomy-and-astrophysics", [
                    ...english5, ...mathematics6,
                    { subjects: ["physicalSciences"], level: 6, mode: "all" }
                ]]
            ], nbt),
            ...programmes("Science", 42, [
                ["Chemistry", "science/chemistry", [...english5, ...mathematics6, ...physicalScience5]],
                ["Applied Chemistry", "science/applied-chemistry", [...english5, ...mathematics6, ...physicalScience5]],
                ["Geological Sciences", "science/geological-sciences", [...english5, ...mathematics6, ...physicalScience5]],
                ["Physics", "science/physics", [...english5, ...mathematics6, ...physicalScience5]]
            ], nbt),
            ...programmes("Science", 43, [
                ["Chemistry with Chemical Engineering", "science/chemistry-with-chemical-engineering", [
                    ...english5, ...mathematics6,
                    { subjects: ["physicalSciences"], level: 6, mode: "all" }
                ]]
            ], nbt),
            ...programmes("Science", 43, [
                ["Physics and Finance", "science/physics-and-finance", [
                    { subjects: ["englishHome", "englishFAL"], level: 6, mode: "any" },
                    { subjects: ["mathematics"], level: 6, mode: "all" },
                    { subjects: ["physicalSciences"], level: 6, mode: "all" }
                ]],
                ["Physics and Philosophy", "science/physics-and-philosophy", [
                    { subjects: ["englishHome", "englishFAL"], level: 6, mode: "any" },
                    { subjects: ["mathematics"], level: 6, mode: "all" },
                    { subjects: ["physicalSciences"], level: 6, mode: "all" }
                ]],
                ["Physics, Ecology and Sustainability", "science/physics-ecology-and-sustainability", [
                    { subjects: ["englishHome", "englishFAL"], level: 6, mode: "any" },
                    { subjects: ["mathematics"], level: 6, mode: "all" },
                    { subjects: ["physicalSciences"], level: 6, mode: "all" }
                ]]
            ], nbt)
        ]
    };
})();
