import { Lunar } from "lunar-javascript";

export type Trigram = {
    id: number;
    name: string;
    nature: string;
    wuxing: string; // Five Elements: 金, 木, 水, 火, 土
    lines: boolean[]; // [bottom, middle, top], true = Yang, false = Yin
};

export type HexagramInfo = {
    sequence: number;
    name: string;
    judgment: string;
};

export type Hexagram = {
    upper: Trigram;
    lower: Trigram;
    lines: boolean[]; // [bottom -> top] (6 lines)
    info: HexagramInfo;
    name: string;
};

export type DivinationResult = {
    main: Hexagram;
    mutual: Hexagram;
    changed: Hexagram;
    movingLine: number; // 1-6
    tiTrigram: Trigram; // Body/Subject
    yongTrigram: Trigram; // Function/Object
    tiWuxing: string;
    yongWuxing: string;
    wuxingRelation?: WuxingRelation;
    meta?: DivinationMeta;
};

export type DivinationMethod = "manual" | "random" | "time";

export type DivinationMeta = {
    method: DivinationMethod;
    generatedAt: string;
    timeZone: string;
    timeText: string;
    rawNumbers: {
        num1: number;
        num2: number;
        num3: number;
        movingLine?: number;
    };
    lunar: {
        month: number;
        day: number;
        season: string;
        seasonRule: string;
        yearGanZhi?: string;
        monthGanZhi?: string;
        dayGanZhi?: string;
        timeGanZhi?: string;
    };
};

export type WuxingRelation = {
    type: "yong-sheng-ti" | "bihe" | "ti-ke-yong" | "ti-sheng-yong" | "yong-ke-ti";
    label: string;
    judgment: "大吉" | "吉" | "小吉" | "凶" | "大凶";
    description: string;
    tiWuxing: string;
    yongWuxing: string;
};

const TRIGRAMS: Record<number, Trigram> = {
    1: { id: 1, name: "乾", nature: "天", wuxing: "金", lines: [true, true, true] },
    2: { id: 2, name: "兑", nature: "泽", wuxing: "金", lines: [true, true, false] },
    3: { id: 3, name: "离", nature: "火", wuxing: "火", lines: [true, false, true] },
    4: { id: 4, name: "震", nature: "雷", wuxing: "木", lines: [true, false, false] },
    5: { id: 5, name: "巽", nature: "风", wuxing: "木", lines: [false, true, true] },
    6: { id: 6, name: "坎", nature: "水", wuxing: "水", lines: [false, true, false] },
    7: { id: 7, name: "艮", nature: "山", wuxing: "土", lines: [false, false, true] },
    8: { id: 8, name: "坤", nature: "地", wuxing: "土", lines: [false, false, false] },
};

// 键格式为“上卦编号-下卦编号”，名称与卦序采用通行的六十四卦顺序。
const STANDARD_HEXAGRAMS: Record<string, HexagramInfo> = {
    "1-1": { sequence: 1, name: "乾为天", judgment: "乾上乾下" },
    "8-8": { sequence: 2, name: "坤为地", judgment: "坤上坤下" },
    "6-4": { sequence: 3, name: "水雷屯", judgment: "坎上震下" },
    "7-6": { sequence: 4, name: "山水蒙", judgment: "艮上坎下" },
    "6-1": { sequence: 5, name: "水天需", judgment: "坎上乾下" },
    "1-6": { sequence: 6, name: "天水讼", judgment: "乾上坎下" },
    "8-6": { sequence: 7, name: "地水师", judgment: "坤上坎下" },
    "6-8": { sequence: 8, name: "水地比", judgment: "坎上坤下" },
    "5-1": { sequence: 9, name: "风天小畜", judgment: "巽上乾下" },
    "1-2": { sequence: 10, name: "天泽履", judgment: "乾上兑下" },
    "8-1": { sequence: 11, name: "地天泰", judgment: "坤上乾下" },
    "1-8": { sequence: 12, name: "天地否", judgment: "乾上坤下" },
    "1-3": { sequence: 13, name: "天火同人", judgment: "乾上离下" },
    "3-1": { sequence: 14, name: "火天大有", judgment: "离上乾下" },
    "8-7": { sequence: 15, name: "地山谦", judgment: "坤上艮下" },
    "4-8": { sequence: 16, name: "雷地豫", judgment: "震上坤下" },
    "2-4": { sequence: 17, name: "泽雷随", judgment: "兑上震下" },
    "7-5": { sequence: 18, name: "山风蛊", judgment: "艮上巽下" },
    "8-2": { sequence: 19, name: "地泽临", judgment: "坤上兑下" },
    "5-8": { sequence: 20, name: "风地观", judgment: "巽上坤下" },
    "3-4": { sequence: 21, name: "火雷噬嗑", judgment: "离上震下" },
    "7-3": { sequence: 22, name: "山火贲", judgment: "艮上离下" },
    "7-8": { sequence: 23, name: "山地剥", judgment: "艮上坤下" },
    "8-4": { sequence: 24, name: "地雷复", judgment: "坤上震下" },
    "1-4": { sequence: 25, name: "天雷无妄", judgment: "乾上震下" },
    "7-1": { sequence: 26, name: "山天大畜", judgment: "艮上乾下" },
    "7-4": { sequence: 27, name: "山雷颐", judgment: "艮上震下" },
    "2-5": { sequence: 28, name: "泽风大过", judgment: "兑上巽下" },
    "6-6": { sequence: 29, name: "坎为水", judgment: "坎上坎下" },
    "3-3": { sequence: 30, name: "离为火", judgment: "离上离下" },
    "2-7": { sequence: 31, name: "泽山咸", judgment: "兑上艮下" },
    "4-5": { sequence: 32, name: "雷风恒", judgment: "震上巽下" },
    "1-7": { sequence: 33, name: "天山遁", judgment: "乾上艮下" },
    "4-1": { sequence: 34, name: "雷天大壮", judgment: "震上乾下" },
    "3-8": { sequence: 35, name: "火地晋", judgment: "离上坤下" },
    "8-3": { sequence: 36, name: "地火明夷", judgment: "坤上离下" },
    "5-3": { sequence: 37, name: "风火家人", judgment: "巽上离下" },
    "3-2": { sequence: 38, name: "火泽睽", judgment: "离上兑下" },
    "6-7": { sequence: 39, name: "水山蹇", judgment: "坎上艮下" },
    "4-6": { sequence: 40, name: "雷水解", judgment: "震上坎下" },
    "7-2": { sequence: 41, name: "山泽损", judgment: "艮上兑下" },
    "5-4": { sequence: 42, name: "风雷益", judgment: "巽上震下" },
    "2-1": { sequence: 43, name: "泽天夬", judgment: "兑上乾下" },
    "1-5": { sequence: 44, name: "天风姤", judgment: "乾上巽下" },
    "2-8": { sequence: 45, name: "泽地萃", judgment: "兑上坤下" },
    "8-5": { sequence: 46, name: "地风升", judgment: "坤上巽下" },
    "2-6": { sequence: 47, name: "泽水困", judgment: "兑上坎下" },
    "6-5": { sequence: 48, name: "水风井", judgment: "坎上巽下" },
    "2-3": { sequence: 49, name: "泽火革", judgment: "兑上离下" },
    "3-5": { sequence: 50, name: "火风鼎", judgment: "离上巽下" },
    "4-4": { sequence: 51, name: "震为雷", judgment: "震上震下" },
    "7-7": { sequence: 52, name: "艮为山", judgment: "艮上艮下" },
    "5-7": { sequence: 53, name: "风山渐", judgment: "巽上艮下" },
    "4-2": { sequence: 54, name: "雷泽归妹", judgment: "震上兑下" },
    "4-3": { sequence: 55, name: "雷火丰", judgment: "震上离下" },
    "3-7": { sequence: 56, name: "火山旅", judgment: "离上艮下" },
    "5-5": { sequence: 57, name: "巽为风", judgment: "巽上巽下" },
    "2-2": { sequence: 58, name: "兑为泽", judgment: "兑上兑下" },
    "5-6": { sequence: 59, name: "风水涣", judgment: "巽上坎下" },
    "6-2": { sequence: 60, name: "水泽节", judgment: "坎上兑下" },
    "5-2": { sequence: 61, name: "风泽中孚", judgment: "巽上兑下" },
    "4-7": { sequence: 62, name: "雷山小过", judgment: "震上艮下" },
    "6-3": { sequence: 63, name: "水火既济", judgment: "坎上离下" },
    "3-6": { sequence: 64, name: "火水未济", judgment: "离上坎下" },
};

export function getStandardHexagramInfo(upper: Trigram, lower: Trigram): HexagramInfo {
    return STANDARD_HEXAGRAMS[`${upper.id}-${lower.id}`];
}

export function getStandardHexagramName(upper: number | Trigram, lower: number | Trigram): string {
    const upperTrigram = typeof upper === "number" ? getTrigram(upper) : upper;
    const lowerTrigram = typeof lower === "number" ? getTrigram(lower) : lower;
    return getStandardHexagramInfo(upperTrigram, lowerTrigram).name;
}

function buildHexagram(upper: Trigram, lower: Trigram, lines = getHexagramLines(lower, upper)): Hexagram {
    const info = getStandardHexagramInfo(upper, lower);
    return {
        upper,
        lower,
        lines,
        info,
        name: info.name,
    };
}
function getTrigram(num: number): Trigram {
    const remainder = num % 8;
    return TRIGRAMS[remainder === 0 ? 8 : remainder];
}

function getHexagramLines(lower: Trigram, upper: Trigram): boolean[] {
    return [...lower.lines, ...upper.lines];
}

function getTrigramFromLines(lines: boolean[]): Trigram {
    // Simple matching based on lines
    const target = JSON.stringify(lines);
    for (const t of Object.values(TRIGRAMS)) {
        if (JSON.stringify(t.lines) === target) return t;
    }
    return TRIGRAMS[8]; // Fallback
}

function getLunarSeason(month: number): string {
    if (month >= 1 && month <= 3) return "春";
    if (month >= 4 && month <= 6) return "夏";
    if (month >= 7 && month <= 9) return "秋";
    if (month >= 10 && month <= 12) return "冬";
    return "未知";
}

function getTimeText(date: Date): string {
    return date.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });
}

function buildDivinationMeta(
    method: DivinationMethod,
    num1: number,
    num2: number,
    num3: number,
    movingLine: number,
    generatedAt: Date
): DivinationMeta {
    const lunar = Lunar.fromDate(generatedAt);
    const lunarMonth = lunar.getMonth();
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "local";

    return {
        method,
        generatedAt: generatedAt.toISOString(),
        timeZone,
        timeText: getTimeText(generatedAt),
        rawNumbers: {
            num1,
            num2,
            num3,
            movingLine,
        },
        lunar: {
            month: lunarMonth,
            day: lunar.getDay(),
            season: getLunarSeason(lunarMonth),
            seasonRule: "农历1-3春、4-6夏、7-9秋、10-12冬",
            yearGanZhi: lunar.getYearInGanZhi(),
            monthGanZhi: lunar.getMonthInGanZhi(),
            dayGanZhi: lunar.getDayInGanZhi(),
            timeGanZhi: lunar.getTimeInGanZhi(),
        },
    };
}

function calculateWuxingRelation(tiWuxing: string, yongWuxing: string): WuxingRelation {
    const generates: Record<string, string> = {
        木: "火",
        火: "土",
        土: "金",
        金: "水",
        水: "木",
    };
    const controls: Record<string, string> = {
        木: "土",
        土: "水",
        水: "火",
        火: "金",
        金: "木",
    };

    if (tiWuxing === yongWuxing) {
        return {
            type: "bihe",
            label: "体用比和",
            judgment: "吉",
            description: "体用比和吉",
            tiWuxing,
            yongWuxing,
        };
    }

    if (generates[yongWuxing] === tiWuxing) {
        return {
            type: "yong-sheng-ti",
            label: "用生体",
            judgment: "大吉",
            description: "用生体大吉",
            tiWuxing,
            yongWuxing,
        };
    }

    if (controls[tiWuxing] === yongWuxing) {
        return {
            type: "ti-ke-yong",
            label: "体克用",
            judgment: "小吉",
            description: "体克用小吉",
            tiWuxing,
            yongWuxing,
        };
    }

    if (generates[tiWuxing] === yongWuxing) {
        return {
            type: "ti-sheng-yong",
            label: "体生用",
            judgment: "凶",
            description: "体生用凶",
            tiWuxing,
            yongWuxing,
        };
    }

    return {
        type: "yong-ke-ti",
        label: "用克体",
        judgment: "大凶",
        description: "用克体大凶",
        tiWuxing,
        yongWuxing,
    };
}

export function calculateHexagrams(
    num1: number,
    num2: number,
    num3: number,
    movingLineIndex?: number,
    method: DivinationMethod = "manual",
    generatedAt: Date = new Date()
): DivinationResult {
    // 1. Calculate Main Hexagram (本卦)
    const upperNum = num1;
    const lowerNum = num2;

    const upperTrigram = getTrigram(upperNum);
    const lowerTrigram = getTrigram(lowerNum);

    const mainLines = getHexagramLines(lowerTrigram, upperTrigram);
    const mainHexagram = buildHexagram(upperTrigram, lowerTrigram, mainLines);

    // 2. Calculate Moving Line (动爻)
    // If movingLineIndex is provided (e.g. from Time Divination), use it.
    // Otherwise fallback to classic number method: (num1 + num2 + num3) % 6
    let movingLine: number;
    if (movingLineIndex !== undefined) {
        movingLine = movingLineIndex;
    } else {
        const sum = num1 + num2 + num3;
        movingLine = sum % 6 === 0 ? 6 : sum % 6;
    }

    // 3. Calculate Changed Hexagram (变卦)
    const changedLines = [...mainLines];
    // movingLine is 1-based, array is 0-based
    changedLines[movingLine - 1] = !changedLines[movingLine - 1];

    const changedLowerLines = changedLines.slice(0, 3);
    const changedUpperLines = changedLines.slice(3, 6);

    const changedUpperTrigram = getTrigramFromLines(changedUpperLines);
    const changedLowerTrigram = getTrigramFromLines(changedLowerLines);
    const changedHexagram = buildHexagram(changedUpperTrigram, changedLowerTrigram, changedLines);

    // 4. Calculate Mutual Hexagram (互卦)
    // Lower mutual: lines 2,3,4 (indices 1,2,3)
    // Upper mutual: lines 3,4,5 (indices 2,3,4)
    const mutualLowerLines = [mainLines[1], mainLines[2], mainLines[3]];
    const mutualUpperLines = [mainLines[2], mainLines[3], mainLines[4]];

    const mutualUpperTrigram = getTrigramFromLines(mutualUpperLines);
    const mutualLowerTrigram = getTrigramFromLines(mutualLowerLines);
    const mutualHexagram = buildHexagram(mutualUpperTrigram, mutualLowerTrigram, [
        ...mutualLowerLines,
        ...mutualUpperLines,
    ]);

    // 5. Determine Ti (Body) and Yong (Function)
    // Moving line in lower trigram (1, 2, 3) -> Upper is Ti, Lower is Yong
    // Moving line in upper trigram (4, 5, 6) -> Lower is Ti, Upper is Yong
    let tiTrigram: Trigram;
    let yongTrigram: Trigram;

    if (movingLine <= 3) {
        tiTrigram = upperTrigram;
        yongTrigram = lowerTrigram;
    } else {
        tiTrigram = lowerTrigram;
        yongTrigram = upperTrigram;
    }

    const wuxingRelation = calculateWuxingRelation(tiTrigram.wuxing, yongTrigram.wuxing);

    return {
        main: mainHexagram,
        mutual: mutualHexagram,
        changed: changedHexagram,
        movingLine,
        tiTrigram,
        yongTrigram,
        tiWuxing: tiTrigram.wuxing,
        yongWuxing: yongTrigram.wuxing,
        wuxingRelation,
        meta: buildDivinationMeta(method, num1, num2, num3, movingLine, generatedAt),
    };
}

export function generateTimeBasedNumbers(): { num1: number; num2: number; num3: number; movingLine: number; generatedAt: Date } {
    const now = new Date();
    const lunar = Lunar.fromDate(now);

    // Traditional Meihua Yishu Time Method (Lunar):
    // Year: Earthly Branch Index (1-12) (Zi=1...Hai=12)
    // lunar.getYearZhiIndex() returns 0 for Zi, 11 for Hai. So add 1.
    const yearZhi = lunar.getYearZhiIndex() + 1;

    // Month: Lunar Month (1-12)
    const month = lunar.getMonth();

    // Day: Lunar Day (1-30)
    const day = lunar.getDay();

    // Hour: Earthly Branch Index (1-12) (Zi=1...Hai=12)
    // lunar.getTimeZhiIndex() returns 0 for Zi, 11 for Hai. So add 1.
    const timeZhi = lunar.getTimeZhiIndex() + 1;

    // Upper Trigram: (Year + Month + Day) % 8
    const num1 = yearZhi + month + day;

    // Lower Trigram: (Upper Sum + Time) % 8
    // Note: num2 here represents the sum "Years+Month+Day+Hour" effectively for the purpose of the modulo in calculation
    const num2 = num1 + timeZhi;

    // Moving Line: (Upper Sum + Time) % 6
    const totalSum = num1 + timeZhi;
    let movingLine = totalSum % 6;
    if (movingLine === 0) movingLine = 6;

    // num3 is returned as timeZhi just for display/reference, 
    // but the actual calculation should rely on the explicit 'movingLine' we return.
    return { num1, num2, num3: timeZhi, movingLine, generatedAt: now };
}
