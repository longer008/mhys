import { describe, expect, it } from "vitest";
import { calculateHexagrams, getStandardHexagramName } from "@/lib/meihua";

describe("标准六十四卦名称", () => {
    it("返回截图对应的正式卦名", () => {
        expect(getStandardHexagramName(1, 7)).toBe("天山遁");
        expect(getStandardHexagramName(1, 5)).toBe("天风姤");
        expect(getStandardHexagramName(2, 7)).toBe("泽山咸");
    });

    it("覆盖全部上下卦组合且名称不重复", () => {
        const names = new Set<string>();

        for (let upper = 1; upper <= 8; upper += 1) {
            for (let lower = 1; lower <= 8; lower += 1) {
                names.add(getStandardHexagramName(upper, lower));
            }
        }

        expect(names.size).toBe(64);
    });

    it("为本卦、互卦和变卦附加正式名称与卦序", () => {
        const result = calculateHexagrams(1, 7, 1);

        expect(result.main.name).toBe("天山遁");
        expect(result.main.info.sequence).toBe(33);
        expect(result.mutual.name).toBeTruthy();
        expect(result.changed.name).toBeTruthy();
    });

    it("保留起卦方式、时间、原始数字与体用关系", () => {
        const generatedAt = new Date("2026-07-13T08:00:00.000Z");
        const result = calculateHexagrams(1, 7, 9, 4, "random", generatedAt);

        expect(result.meta?.method).toBe("random");
        expect(result.meta?.generatedAt).toBe(generatedAt.toISOString());
        expect(result.meta?.rawNumbers).toEqual({
            num1: 1,
            num2: 7,
            num3: 9,
            movingLine: 4,
        });
        expect(result.wuxingRelation?.label).toBeTruthy();
    });
});
