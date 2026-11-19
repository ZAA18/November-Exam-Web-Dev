/* Per-institution NSC scoring and conservative programme assessment. */
(() => {
    "use strict";
    const level = mark => mark >= 80 ? 7 : mark >= 70 ? 6 : mark >= 60 ? 5 : mark >= 50 ? 4 : mark >= 40 ? 3 : mark >= 30 ? 2 : 1;
    const LANGUAGES = new Set(["englishHome","englishFAL","afrikaansHome","afrikaansFAL","isiZuluHome","isiZuluFAL","isiXhosaHome","isiXhosaFAL","seSothoHome","seSothoFAL","SetswanaHome","SetswanaFAL","SepediHome","SepediFAL","siSwatiHome","siSwatiFAL","TshivendaHome","TshivendaFAL","isiNdebeleHome","isiNdebeleFAL","xiTsongaHome","xiTsongaFAL"]);
    function subjectKey(name) {
        const n=String(name||"").toLowerCase().replace(/\s+/g," ").trim();
        const aliases={"maths":"mathematics","mathematics (pure)":"mathematics","mathematical literacy":"mathLiteracy","math literacy":"mathLiteracy","english home language":"englishHome","english hl":"englishHome","english first additional language":"englishFAL","english fal":"englishFAL","physical sciences":"physicalSciences","life sciences":"lifeSciences","information technology":"informationTechnology","computer applications technology":"computerApplicationsTechnology","life orientation":"lifeOrientation","afrikaans home language":"afrikaansHome","afrikaans first additional language":"afrikaansFAL","isiZulu home language":"isiZuluHome","isiZulu first additional language":"isiZuluFAL","isiXhosa home language":"isiXhosaHome","isiXhosa first additional language":"isiXhosaFAL","seSotho home language":"seSothoHome","seSotho first additional language":"seSothoFAL","Setswana home language":"SetswanaHome","Setswana first additional language":"SetswanaFAL","Sepedi home language":"SepediHome","Sepedi first additional language":"SepediFAL","siSwati home language":"siSwatiHome","siSwati first additional language":"siSwatiFAL","Tshivenda home language":"TshivendaHome","Tshivenda first additional language":"TshivendaFAL","isiNdebele home language":"isiNdebeleHome","isiNdebele first additional language":"isiNdebeleFAL","xiTsonga home language":"xiTsongaHome","xiTsonga first additional language":"xiTsongaFAL"};
        if(aliases[n]) return aliases[n];
        return Object.keys(LANGUAGES).find(k=>k.toLowerCase()===n) || n;
    }
    function requirements(programme,marks={}) {
        return (programme?.subjects||[]).map(x=>{
            const key=subjectKey(x.subject);
            if(key==="english") return ["englishHome","englishFAL"].filter(k=>marks[k]!==undefined).sort((a,b)=>marks[b]-marks[a])[0]||key;
            return key;
        }).filter(k=>k&&k!=="lifeOrientation");
    }
    function hasAmbiguousSubjectPath(programme) {
        return (programme?.subjects||[]).some(x=>/\bor\b|alternative pathway|either/i.test(x.sourceText||"")&&subjectKey(x.subject)!=="english");
    }
    function witsPoints(subject,mark) {
        if(subject==="lifeOrientation") return mark>=90?4:mark>=80?3:mark>=70?2:mark>=60?1:0;
        if(["englishHome","englishFAL","mathematics"].includes(subject)) return mark>=90?10:mark>=80?9:mark>=70?8:mark>=60?7:mark>=50?4:mark>=40?3:0;
        return mark>=90?8:mark>=80?7:mark>=70?6:mark>=60?5:mark>=50?4:mark>=40?3:0;
    }
    function wsuPoints(mark) { return mark>=90?8:mark>=80?7:mark>=70?6:mark>=60?5:mark>=50?4:mark>=40?3:mark>=30?2:1; }
    function getMarkEntries(marks, exclude=[]) { return Object.entries(marks).filter(([k])=>k!=="lifeOrientation"&&!exclude.includes(k)).map(([key,mark])=>({key,mark})); }
    function pickBest(entries,count,required=[]) {
        const byKey=new Map(entries.map(x=>[x.key,x]));
        const fixed=[...new Set(required)].map(k=>byKey.get(k)).filter(Boolean);
        const rest=entries.filter(x=>!fixed.some(f=>f.key===x.key)).sort((a,b)=>b.mark-a.mark);
        return [...fixed,...rest.slice(0,Math.max(0,count-fixed.length))];
    }
    function score(university,marks,programme=null) {
        const cfg=university?.scoring;
        if(!cfg?.method) return {available:false,value:null,reason:"This institution's scoring method has not been configured."};
        const req=programme?requirements(programme,marks):[];
        if(programme&&hasAmbiguousSubjectPath(programme)) return {available:false,value:null,reason:"The programme has alternative subject pathways; its score depends on which pathway applies."};
        if(req.some(k=>marks[k]===undefined)) return {available:false,value:null,reason:"Enter every required subject needed for the programme-specific score."};
        const entries=getMarkEntries(marks);
        const notEnough=(n)=>({available:false,value:null,reason:`Enter at least ${n} recognised subjects for this score.`});
        let used=[],value=null,unit="APS",details="";
        switch(cfg.method) {
            case "wits-2027": {
                if(marks.lifeOrientation===undefined) return {available:false,value:null,reason:"Enter Life Orientation and six other subjects."};
                const best=entries.map(x=>({...x,points:witsPoints(x.key,x.mark)})).sort((a,b)=>b.points-a.points||b.mark-a.mark);
                const byKey=new Map(best.map(x=>[x.key,x])); const fixed=req.map(k=>byKey.get(k)).filter(Boolean);
                used=[...fixed,...best.filter(x=>!fixed.some(f=>f.key===x.key)).slice(0,Math.max(0,6-fixed.length)),{key:"lifeOrientation",mark:marks.lifeOrientation,points:witsPoints("lifeOrientation",marks.lifeOrientation)}];
                if(used.filter(x=>x.key!=="lifeOrientation").length<6) return notEnough(6);
                value=used.reduce((s,x)=>s+x.points,0); details="Best six subjects plus Life Orientation; Wits subject points applied."; break;
            }
            case "nsc-six-levels": {
                used=pickBest(entries,6,req).map(x=>({...x,points:level(x.mark)})); if(used.length<6)return notEnough(6);
                value=used.reduce((s,x)=>s+x.points,0); details="Six NSC subject achievement levels; Life Orientation excluded."; break;
            }
            case "rhodes-six-tenths": {
                used=pickBest(entries.filter(x=>x.mark>=40),6,req).map(x=>({...x,points:x.mark/10})); if(used.length<6)return notEnough(6);
                value=Number(used.reduce((s,x)=>s+x.points,0).toFixed(1)); details="Six subject percentages divided by ten; marks below 40 and Life Orientation excluded."; break;
            }
            case "uct-fps": {
                const faculty=String(programme?.faculty||"").toLowerCase();
                if(programme && university.scoring?.facultySpecific && !faculty) return {available:false,value:null,reason:"UCT admission scores vary by faculty; the extracted programme faculty is missing."};
                used=pickBest(entries,6,req).map(x=>({...x,points:x.mark})); if(used.length<6)return notEnough(6);
                if(/health science|medicine|health/.test(faculty)) return {available:false,value:null,reason:"UCT Health Sciences adds NBT results; those are not entered here."};
                const science=/science/.test(faculty);
                if(science) used=used.map(x=>({...x,points:x.mark*(["mathematics","physicalSciences"].includes(x.key)?2:1)}));
                value=used.reduce((s,x)=>s+x.points,0); unit=science?"FPS / 800":"FPS / 600"; details=science?"Faculty FPS with Mathematics and Physical Sciences doubled.":"Base faculty score; faculty requirements and NBT rules may also apply."; break;
            }
            case "su-nsc-average": {
                const langs=entries.filter(x=>["englishHome","englishFAL","afrikaansHome","afrikaansFAL"].includes(x.key));
                if(!langs.length)return {available:false,value:null,reason:"Enter English or Afrikaans as your language of learning and teaching."};
                const language=langs.sort((a,b)=>b.mark-a.mark)[0];
                const rest=entries.filter(x=>x.key!==language.key);
                used=[language,...rest.sort((a,b)=>b.mark-a.mark).slice(0,5)]; if(used.length<6)return notEnough(6);
                value=Number((used.reduce((s,x)=>s+x.mark,0)/6).toFixed(2)); unit="average %"; details="Highest English/Afrikaans language result plus five best 20-credit subjects, divided by six."; break;
            }
            case "wsu-six-categories": {
                const education=/education/i.test(String(programme?.faculty||programme?.name||""));
                const languages=entries.filter(x=>LANGUAGES.has(x.key)).sort((a,b)=>b.mark-a.mark);
                const english=languages.filter(x=>["englishHome","englishFAL"].includes(x.key));
                if(!english.length||languages.length<2)return {available:false,value:null,reason:"WSU requires English and another language result; enter both."};
                const languageSet=[english[0],languages.find(x=>!english.some(e=>e.key===x.key))]; const other=entries.filter(x=>!languageSet.some(l=>l.key===x.key)).sort((a,b)=>b.mark-a.mark);
                const fixed=req.map(k=>other.find(x=>x.key===k)).filter(Boolean);
                const rest=other.filter(x=>!fixed.some(f=>f.key===x.key));
                used=[...languageSet,...fixed,...rest.slice(0,Math.max(0,4-fixed.length))].map(x=>({...x,points:wsuPoints(x.mark)}));
                if(used.length<6)return notEnough(6);
                if(education){if(marks.lifeOrientation===undefined)return {available:false,value:null,reason:"WSU Education scores include Life Orientation; enter its mark."};used.push({key:"lifeOrientation",mark:marks.lifeOrientation,points:wsuPoints(marks.lifeOrientation)});}
                value=used.reduce((s,x)=>s+x.points,0); details=education?"Two languages, four other subjects and Life Orientation for Education.":"Two languages plus four other subjects; Life Orientation excluded."; break;
            }
            case "ufh-seven-nsc": {
                if(marks.lifeOrientation===undefined)return {available:false,value:null,reason:"Enter Life Orientation and six academic subjects."};
                used=[...entries,{key:"lifeOrientation",mark:marks.lifeOrientation}].map(x=>({...x,points:x.key==="lifeOrientation"?Math.min(level(x.mark),4):x.mark>=90?8:x.mark>=80?7:x.mark>=70?6:x.mark>=60?5:x.mark>=50?4:x.mark>=40?3:x.mark>=30?2:0})).sort((a,b)=>b.points-a.points);
                if(used.filter(x=>x.key!=="lifeOrientation").length<6)return notEnough(6);
                used=used.filter(x=>x.key!=="lifeOrientation").slice(0,6).concat(used.find(x=>x.key==="lifeOrientation"));
                value=used.reduce((s,x)=>s+x.points,0); details="Six academic subjects plus Life Orientation capped at four points."; break;
            }
            case "ufs-six-ap": {
                unit="AP";
                const academic=entries.map(x=>({...x,points:x.mark>=90?8:x.mark>=80?7:x.mark>=70?6:x.mark>=60?5:x.mark>=50?4:x.mark>=40?3:x.mark>=30?2:0}));
                used=pickBest(academic,6,req); if(used.length<6)return notEnough(6);
                if(marks.lifeOrientation===undefined)return {available:false,value:used.reduce((s,x)=>s+x.points,0),reason:"Enter Life Orientation to add a UFS bonus point if your mark is 60% or higher.",unit:"AP (base)",subjectsUsed:used};
                const lo=marks.lifeOrientation>=60?1:0; value=used.reduce((s,x)=>s+x.points,lo); details=`Six academic subjects${lo?" plus one Life Orientation point":"; no Life Orientation point awarded"}.`; used.push({key:"lifeOrientation",mark:marks.lifeOrientation,points:lo}); break;
            }
            default: return {available:false,value:null,reason:"No scorer is available for this method."};
        }
        return {available:true,value,unit,details,subjectsUsed:used,source:cfg.source||null};
    }
    function scoreForProgramme(university,marks,programme) { return score(university,marks,programme); }
    function findMark(subject,marks) {
        const key=subjectKey(subject);
        if(key==="english"){
            const choices=["englishHome","englishFAL"].filter(k=>marks[k]!==undefined).map(k=>({key:k,mark:marks[k]})).sort((a,b)=>b.mark-a.mark);
            return choices[0]||null;
        }
        return marks[key]===undefined?null:{key,mark:marks[key]};
    }
    function assess(university,marks,programme,studentScore) {
        const reasons=[],unknown=[];
        const programScore=scoreForProgramme(university,marks,programme);
        if(university.scoringStatus!=="configured"||!programScore.available) unknown.push(programScore.reason||"This score needs more student or programme information.");
        const aps=Array.isArray(programme.aps)?programme.aps:[];
        const requirementsByType=new Map();
        for(const item of aps){const type=String(item.type||"APS").toUpperCase();const n=Number(item.score);if(Number.isFinite(n)){if(!requirementsByType.has(type))requirementsByType.set(type,[]);requirementsByType.get(type).push(n);}}
        const scoreRequirements=[...new Set([...requirementsByType.values()].flat())];
        if(requirementsByType.has("WPS")) unknown.push("UCT Weighted Points Score depends on the applicant's disadvantage factor, which is not collected.");
        else if(scoreRequirements.length===1&&programScore.available){
            const met=programScore.value>=scoreRequirements[0]; reasons.push(`${programScore.unit||"Admission score"}: ${programScore.value}; minimum ${scoreRequirements[0]} (${met?"met":"not met"}).`); if(!met)reasons.push("Confirmed admission score requirement is not met.");
        } else unknown.push("A unique programme admission-score threshold was not extracted reliably.");
        for(const req of programme.subjects||[]){
            if(/\bor\b|alternative pathway|either/i.test(req.sourceText||"")&&subjectKey(req.subject)!=="english"){unknown.push(`${req.subject||"Subject"} has an alternative pathway that needs more information.`);continue;}
            const found=findMark(req.subject,marks),min=Number(req.minimumLevel);
            if(!found||!Number.isInteger(min)||min<1||min>7){unknown.push(`${req.subject||"Subject"} requirement could not be assessed reliably.`);continue;}
            const met=level(found.mark)>=min; reasons.push(`${req.subject}: requires level ${min}; student level ${level(found.mark)} (${met?"met":"not met"}).`);if(!met)reasons.push(`Confirmed requirement not met: ${req.subject}.`);
        }
        if(!(programme.subjects||[]).length)unknown.push("This prospectus section yielded no subject-level requirements.");
        if(programme.reviewStatus==="invalid")unknown.push("Some extracted programme fields could not be used in the assessment.");
        if(!(programme.aps||[]).length&&!(programme.subjects||[]).length)unknown.push("The prospectus did not yield enough admission requirements for this course.");
        if((programme.selectionRequirements||[]).length)unknown.push("Additional selection criteria apply and are listed below.");
        const status=reasons.some(x=>x.startsWith("Confirmed"))?"not-eligible":unknown.length?"incomplete":"eligible";
        return {programme,status,reasons,unknown,score:programScore,universityScore:studentScore};
    }
    window.UniCompanionEligibilityEngine={score,scoreForProgramme,assess,getNSCLevel:level};
})();
