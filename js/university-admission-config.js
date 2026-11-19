/* =========================================================
   UNICOMPANION - UNIVERSITY ADMISSION SCORING CONFIGURATION
   Every institution uses a separately implemented NSC method.
========================================================= */

(() => {
    "use strict";

    const subjectMap = {
        englishHome: "English Home Language",
        englishFAL: "English First Additional Language",
        mathematics: "Mathematics",
        mathLiteracy: "Mathematical Literacy",
        physicalSciences: "Physical Sciences",
        lifeSciences: "Life Sciences",
        accounting: "Accounting",
        businessStudies: "Business Studies",
        economics: "Economics",
        geography: "Geography",
        history: "History",
        informationTechnology: "Information Technology",
        computerApplicationsTechnology: "Computer Applications Technology",
        lifeOrientation: "Life Orientation",
        visualArts: "Visual Arts"
    };

    const configurations = {
        wits: {
            key: "wits",
            name: "Wits University",
            scoreName: "Wits APS",
            status: "configured",
            method: "wits",
            subjectCount: 6,
            excludeLifeOrientation: true
        },
        uct: {
            key: "uct",
            name: "University of Cape Town",
            scoreName: "UCT APS aggregate",
            status: "configured",
            method: "uct",
            subjectCount: 6,
            excludeLifeOrientation: true
        },
        up: {
            key: "up",
            name: "University of Pretoria",
            scoreName: "UP APS",
            status: "configured",
            method: "best-six-levels",
            subjectCount: 6,
            excludeLifeOrientation: true
        },
        uj: {
            key: "uj",
            name: "University of Johannesburg",
            scoreName: "UJ APS",
            status: "configured",
            method: "best-six-levels",
            subjectCount: 6,
            excludeLifeOrientation: true
        },
        ufh: {
            key: "ufh",
            name: "University of Fort Hare",
            scoreName: "UFH APS",
            status: "configured",
            method: "best-six-levels",
            subjectCount: 6,
            excludeLifeOrientation: true
        },
        rhodes: {
            key: "rhodes",
            name: "Rhodes University",
            scoreName: "Rhodes APS",
            status: "configured",
            method: "rhodes",
            subjectCount: 6,
            excludeLifeOrientation: true
        },
        wsu: {
            key: "wsu",
            name: "Walter Sisulu University",
            scoreName: "WSU APS",
            status: "configured",
            method: "wsu",
            subjectCount: 6,
            excludeLifeOrientation: true
        },
        stellenbosch: {
            key: "stellenbosch",
            name: "Stellenbosch University",
            scoreName: "SU six-subject aggregate",
            status: "configured",
            method: "stellenbosch",
            subjectCount: 6,
            excludeLifeOrientation: true
        }
    };

    function getNSCLevel(mark) {
        if (mark >= 80) return 7;
        if (mark >= 70) return 6;
        if (mark >= 60) return 5;
        if (mark >= 50) return 4;
        if (mark >= 40) return 3;
        if (mark >= 30) return 2;
        return 1;
    }

    function getWitsPoints(subject, mark) {
        if (subject === "lifeOrientation") {
            if (mark >= 90) return 4;
            if (mark >= 80) return 3;
            if (mark >= 70) return 2;
            if (mark >= 60) return 1;
            return 0;
        }
        if (subject === "englishHome" || subject === "englishFAL" || subject === "mathematics") {
            if (mark >= 90) return 10;
            if (mark >= 80) return 9;
            if (mark >= 70) return 8;
            if (mark >= 60) return 7;
            if (mark >= 50) return 4;
            if (mark >= 40) return 3;
            return 0;
        }
        if (mark >= 90) return 8;
        if (mark >= 80) return 7;
        if (mark >= 70) return 6;
        if (mark >= 60) return 5;
        if (mark >= 50) return 4;
        if (mark >= 40) return 3;
        return 0;
    }

    function getAcademicSubjects(marks) {
        return Object.entries(marks)
            .filter(([subject]) => subject !== "lifeOrientation")
            .map(([subject, mark]) => ({ subject, mark: Number(mark) }))
            .filter(item => Number.isFinite(item.mark));
    }

    function calculateWits(marks) {
        if (marks.lifeOrientation === undefined) {
            return { score: null, unavailable: "Wits APS requires a Life Orientation mark." };
        }
        const others = getAcademicSubjects(marks)
            .map(item => ({ ...item, points: getWitsPoints(item.subject, item.mark) }))
            .sort((a, b) => b.points - a.points || b.mark - a.mark);
        if (others.length < 6) {
            return { score: null, unavailable: "Wits APS requires at least six academic subjects." };
        }
        const subjectsUsed = [
            ...others.slice(0, 6),
            {
                subject: "lifeOrientation",
                mark: marks.lifeOrientation,
                points: getWitsPoints("lifeOrientation", marks.lifeOrientation)
            }
        ];
        return {
            score: subjectsUsed.reduce((sum, item) => sum + item.points, 0),
            subjectsUsed,
            method: "Wits institution APS",
            nscLevels: subjectsUsed.map(item => ({
                subject: item.subject,
                mark: item.mark,
                level: getNSCLevel(item.mark)
            }))
        };
    }

    function calculateBestSixLevels(marks) {
        const subjectsUsed = getAcademicSubjects(marks)
            .sort((a, b) => b.mark - a.mark)
            .slice(0, 6)
            .map(item => ({
                ...item,
                level: getNSCLevel(item.mark),
                points: getNSCLevel(item.mark)
            }));
        if (subjectsUsed.length < 6) {
            return { score: null, unavailable: "This institution requires marks for at least six academic subjects." };
        }
        return {
            score: subjectsUsed.reduce((sum, item) => sum + item.points, 0),
            subjectsUsed,
            method: "Best six NSC achievement levels",
            nscLevels: subjectsUsed
        };
    }

    function calculateUCT(marks) {
        const subjectsUsed = getAcademicSubjects(marks)
            .sort((a, b) => b.mark - a.mark)
            .slice(0, 6);
        if (subjectsUsed.length < 6) {
            return { score: null, unavailable: "UCT APS requires marks for at least six academic subjects." };
        }
        return {
            score: subjectsUsed.reduce((sum, item) => sum + item.mark, 0),
            subjectsUsed,
            method: "UCT six-subject percentage aggregate",
            nscLevels: subjectsUsed.map(item => ({
                subject: item.subject,
                mark: item.mark,
                level: getNSCLevel(item.mark)
            }))
        };
    }

    function calculateRhodes(marks) {
        const subjectsUsed = getAcademicSubjects(marks)
            .sort((a, b) => b.mark - a.mark)
            .slice(0, 6);
        if (subjectsUsed.length < 6) {
            return { score: null, unavailable: "Rhodes University requires marks for at least six academic subjects." };
        }
        if (marks.lifeOrientation === undefined) {
            return { score: null, unavailable: "Rhodes University requires a Life Orientation mark." };
        }
        if (marks.lifeOrientation < 50) {
            return { score: null, unavailable: "Rhodes University requires Life Orientation of at least 50%." };
        }
        return {
            score: subjectsUsed.reduce((sum, item) => sum + item.mark, 0) / 10,
            subjectsUsed,
            method: "Rhodes six-subject percentage total divided by 10",
            nscLevels: subjectsUsed.map(item => ({
                subject: item.subject,
                mark: item.mark,
                level: getNSCLevel(item.mark)
            }))
        };
    }

    function calculateWSU(marks) {
        const subjectsUsed = getAcademicSubjects(marks)
            .sort((a, b) => getNSCLevel(b.mark) - getNSCLevel(a.mark) || b.mark - a.mark)
            .slice(0, 6)
            .map(item => ({ ...item, level: getNSCLevel(item.mark), points: getNSCLevel(item.mark) }));
        if (subjectsUsed.length < 6) {
            return { score: null, unavailable: "Walter Sisulu University requires marks for at least six subjects." };
        }
        return {
            score: subjectsUsed.reduce((sum, item) => sum + item.points, 0),
            subjectsUsed,
            method: "WSU best-six NSC level points",
            nscLevels: subjectsUsed
        };
    }

    function calculateStellenbosch(marks) {
        const subjectsUsed = getAcademicSubjects(marks)
            .sort((a, b) => b.mark - a.mark)
            .slice(0, 6);
        if (subjectsUsed.length < 6) {
            return { score: null, unavailable: "Stellenbosch University requires marks for at least six academic subjects." };
        }
        return {
            score: subjectsUsed.reduce((sum, item) => sum + item.mark, 0) / 6,
            subjectsUsed,
            method: "Stellenbosch six-subject average percentage",
            nscLevels: subjectsUsed.map(item => ({
                subject: item.subject,
                mark: item.mark,
                level: getNSCLevel(item.mark)
            }))
        };
    }

    function calculate(key, marks) {
        const config = configurations[key];
        if (!config) return { score: null, unavailable: "University admission configuration is missing." };
        if (config.method === "wits") return calculateWits(marks);
        if (config.method === "best-six-levels") return calculateBestSixLevels(marks);
        if (config.method === "uct") return calculateUCT(marks);
        if (config.method === "rhodes") return calculateRhodes(marks);
        if (config.method === "wsu") return calculateWSU(marks);
        if (config.method === "stellenbosch") return calculateStellenbosch(marks);
        return { score: null, unavailable: "Admission-scoring method is not implemented." };
    }

    window.UniCompanionAdmissionConfig = {
        configurations,
        subjectMap,
        getNSCLevel,
        calculate
    };
})();
