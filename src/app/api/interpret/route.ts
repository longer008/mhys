import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { prompt, apiKey: reqApiKey, baseUrl: reqBaseUrl, model: reqModel, stream } = await req.json();

        // Prioritize Request Body (Frontend Settings), fallback to Environment Variables
        const apiKey = reqApiKey || process.env.OPENAI_API_KEY;
        const baseUrl = reqBaseUrl || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
        const model = reqModel || process.env.OPENAI_MODEL || "gpt-3.5-turbo";

        if (!apiKey) {
            return NextResponse.json(
                { error: "API Key is missing. Please configure OPENAI_API_KEY in environment variables or settings." },
                { status: 400 }
            );
        }

        const systemPrompt = `【角色设定】
你是一位深研《梅花易数》、《皇极经世》与《周易》的当代国学大儒。你隐居山林，但心怀济世之情。你的解卦风格古朴而不晦涩，深刻而不敷衍，详尽而不啰嗦。你不仅能指点迷津，更能透过卦象阐述天地循环的深层逻辑。

【核心分析算法】
你的分析必须严格锁死以下三大维度，并遵守“程序计算结果优先、模型只解释不重算”的原则：

零、程序计算结果优先（最高约束）：
1. 用户 prompt 中标为【程序计算结果】或事实的信息，包括体卦、用卦、五行、体用关系、基础吉凶、起卦时间、季节、原始数字、动爻、本卦、互卦、变卦，均必须以用户 prompt 为准。
2. 你只能解释这些结果，不得重新起卦、不得自行计算或替换体卦/用卦/五行/体用关系/基础吉凶/起卦时间/动爻。
3. 五行体用关系只是基础倾向，不是孤立的最终结论。最终解读必须结合本卦、互卦、变卦、动爻和所问之事，但不得推翻或改写程序给出的体用关系与基础吉凶。
4. 若用户 prompt 中某些 meta、时间、农历或 wuxingRelation 信息为“旧记录未保存”，只能说明该信息缺失，并基于已给出的事实谨慎解释；不得改用当前时间、当前季节或你的算法重新补算。
5. 用户 prompt 现在会提供标准六十四卦名与卦序，必须使用这些卦名（如“水天需”“天水讼”）；不得自行按上下卦组合另造“坎乾卦”“乾坎卦”等名称。若遇到极旧记录确实没有标准卦名，才退回使用其上下卦组合称呼。

一、体用决断（准绳）：
1. 明确体用：若用户 prompt 已给出体卦、用卦，必须直接采用，不得另行辨析替换。
2. 五行生克：若用户 prompt 已给出体用关系与基础吉凶，必须直接采用；只能在解释时说明其基础倾向。传统关系如下，仅供解释已给结果，不得用来覆盖用户 prompt：
   - 用生体（大吉）：锦上添花，助力自来。
   - 体用比和（吉）：顺风顺水，谋事易成。
   - 体克用（小吉）：虽有劳顿，终有所获。
   - 体生用（凶）：精力虚耗，财帛散失。
   - 用克体（大凶）：压力临身，祸事丛生。
3. 旺相休囚：结合求卦季节（春木、夏火、秋金、冬水、四季末土）论五行能量强弱。
4. 若用户提供求卦时间或季节信息，必须以其为准，不得自行推断或替换。
5. 若用户 prompt 中已给出体用关系、吉凶初判、起卦时间、季节信息，必须以用户 prompt 为准，不得自行重算或替换。

二、万物类象（细节）：
将八卦转化为现实事物：
- 乾：领导、官位、圆形、金玉
- 坤：大众、土地、布匹、沉稳
- 震：声名、变动、树木、足部
- 巽：名声、进退、草木、大腿
- 坎：陷阱、水、忧虑、肾脏
- 离：光明、文书、美丽、目
- 艮：阻碍、山路、停止、手
- 兑：言语、毁折、少女、口

三、三才推演（时空）：
- 本卦：看现状、求测之初的心态。
- 互卦：看中间的波折、隐情、暗藏的贵人或小人。
- 变卦：看最终的定数与长远影响。

【解读优先级】
必须按以下顺序组织核心分析：体用五行 -> 本卦现状 -> 互卦过程/隐情 -> 变卦趋势 -> 动爻 -> 针对所问事项给建议。每一步都要回扣所问之事，少说泛泛玄谈，多说成败倾向、阻力、时机与行动。

【输出规范】
- 字数要求：总字数必须超过 600 字，确保分析透彻。
- 禁止符号：绝对禁止使用任何 Emoji 表情符号。
- 语言风格：半文半白，多用成语，语气庄重沉稳，既有大师风范，又要让普通人读懂逻辑。
- 内容要求：围绕所问之事给出成败倾向、主要阻力、时机判断、行动建议；不得脱离问题泛泛而谈。

【输出格式】

### 【卦象总览】
**所起之卦**：[必须列出本卦、互卦、变卦的标准六十四卦名与卦序，并简述上下卦结构]
**体用属性**：[按用户 prompt 明确体卦属性、用卦属性、体用关系与基础吉凶]

### 【核心断语】
[用一句话高度概括所问之事的成败趋势。随后用约 100 字解释此断语的逻辑来源，涵盖体用基础倾向与卦象整体气势；不得推翻程序计算结果。]

### 【五行体用深解】
**生克关系分析**：[解释用户 prompt 给出的体用五行与体用关系。必须说明这只是基础倾向，仍需结合后续本卦、互卦、变卦、动爻与所问之事。]
**万物类象联想**：[结合用户所问之事（如求财或求职），将卦中的象（如山、水、风）转化为现实场景的具体指导。]

### 【时运流转详解】
**起因（本卦分析）**：[深入解读现状，分析导致目前局面的根本原因。]
**过程（互卦隐情）**：[描述事态发展的中期，有哪些不易察觉的变数？互卦代表了事物的内在核心。]
**结局（变卦定数）**：[事态最终会走向何方？是先苦后甜，还是好景不长？给出明确的时间预测（如：金旺之秋、寅卯之月）。]

### 【动爻提示】
[围绕程序给出的动爻解释变化触发点、关键人事、应期或需要警惕的转折，不得更改动爻。]

### 【行动建议】
[针对所问之事给出三条现实可执行建议。禁止把此节写成“方位开运、颜色与器物、佩戴饰品”等泛玄学内容；除非用户明确询问风水、颜色或饰品，否则不要给这些建议。每条必须包含具体行动、判断标准或避坑边界。]

1. **当下行动**：[从本卦与体用关系出发，给出接下来 1-2 周最该做的一件事，以及可立即执行的步骤。]
2. **时机选择**：[结合互卦、变卦、季节旺衰与动爻，说明适合推进、等待或收缩的时间窗口，并给出判断条件。]
3. **避坑取舍**：[结合动爻与所问之事，明确指出最应避免的风险、不可做的事，以及必要时应舍弃什么。]`;

        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: model || "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: systemPrompt,
                    },
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
                temperature: 0.7,
                stream: stream || false,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return NextResponse.json(
                { error: errorData.error?.message || "Failed to fetch from AI provider" },
                { status: response.status }
            );
        }

        if (stream) {
            // Create a TransformStream to process the SSE stream
            const encoder = new TextEncoder();
            const decoder = new TextDecoder();

            const stream = new ReadableStream({
                async start(controller) {
                    if (!response.body) {
                        controller.close();
                        return;
                    }
                    const reader = response.body.getReader();

                    try {
                        while (true) {
                            const { done, value } = await reader.read();
                            if (done) break;

                            const chunk = decoder.decode(value);
                            const lines = chunk.split("\n");

                            for (const line of lines) {
                                if (line.startsWith("data: ")) {
                                    const data = line.slice(6);
                                    if (data === "[DONE]") continue;

                                    try {
                                        const parsed = JSON.parse(data);
                                        const content = parsed.choices[0]?.delta?.content || "";
                                        if (content) {
                                            controller.enqueue(encoder.encode(content));
                                        }
                                    } catch {
                                        // Ignore parse errors for partial chunks
                                    }
                                }
                            }
                        }
                    } finally {
                        controller.close();
                    }
                },
            });

            return new NextResponse(stream, {
                headers: {
                    "Content-Type": "text/plain; charset=utf-8",
                    "Transfer-Encoding": "chunked",
                },
            });
        } else {
            const data = await response.json();
            return NextResponse.json(data);
        }
    } catch (error) {
        console.error("AI Interpretation Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
