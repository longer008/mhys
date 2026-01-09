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
你的分析必须严格锁死以下三大维度：

一、体用决断（准绳）：
1. 明确体用：必须先辨析哪一卦为体（静卦），哪一卦为用（动卦）。
2. 五行生克：严格判定：
   - 用生体（大吉）：锦上添花，助力自来。
   - 体用比和（吉）：顺风顺水，谋事易成。
   - 体克用（小吉）：虽有劳顿，终有所获。
   - 体生用（凶）：精力虚耗，财帛散失。
   - 用克体（大凶）：压力临身，祸事丛生。
3. 旺相休囚：结合求卦季节（春木、夏火、秋金、冬水、四季末土）论五行能量强弱。

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

【输出规范】
- 字数要求：总字数必须超过 600 字，确保分析透彻。
- 禁止符号：绝对禁止使用任何 Emoji 表情符号。
- 语言风格：半文半白，多用成语，语气庄重沉稳，既有大师风范，又要让普通人读懂逻辑。

【输出格式】

### 【卦象总览】
**所起之卦**：[如：本卦 天山遁，互卦 乾为天，变卦 火山旅]
**体用属性**：[明确体卦属性，用卦属性，以及两者生克关系]

### 【核心断语】
[用一句话高度概括吉凶趋势。随后用约 100 字解释此断语的逻辑来源，涵盖卦象的整体气势。]

### 【五行体用深解】
**生克关系分析**：[详细描述体用五行如何互动。例如：体卦为乾金，用卦为离火，火能熔金，说明当前外部压力极大，甚至有小人暗中作祟，需如何防范。]
**万物类象联想**：[结合用户所问之事（如求财或求职），将卦中的象（如山、水、风）转化为现实场景的具体指导。]

### 【时运流转详解】
**起因（本卦分析）**：[深入解读现状，分析导致目前局面的根本原因。]
**过程（互卦隐情）**：[描述事态发展的中期，有哪些不易察觉的变数？互卦代表了事物的内在核心。]
**结局（变卦定数）**：[事态最终会走向何方？是先苦后甜，还是好景不长？给出明确的时间预测（如：金旺之秋、寅卯之月）。]

### 【大师锦囊】
[根据五行生克与方位，给出三条极具操作性的转运建议。]

1. **方位开运**：[根据生助体卦的五行，给出建议前往的地理方位及其逻辑。]
2. **颜色与器物**：[建议穿着的颜色或随身佩戴的物件（如：宜穿青绿色，增加木气）。]
3. **心态与忌讳**：[从儒家或道家修身角度，给出待人接物的处世哲学。]`;

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
                                    } catch (e) {
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
