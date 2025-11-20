import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { prompt, apiKey: reqApiKey, baseUrl: reqBaseUrl, model: reqModel, stream } = await req.json();

        // Prioritize Environment Variables, fallback to Request Body
        const apiKey = process.env.OPENAI_API_KEY || reqApiKey;
        const baseUrl = process.env.OPENAI_BASE_URL || reqBaseUrl || "https://api.openai.com/v1";
        const model = process.env.OPENAI_MODEL || reqModel || "gpt-3.5-turbo";

        if (!apiKey) {
            return NextResponse.json(
                { error: "API Key is missing. Please configure OPENAI_API_KEY in environment variables or settings." },
                { status: 400 }
            );
        }

        const systemPrompt = `你是一位隐居深山的国学大师，精通《梅花易数》、《皇极经世》与《周易》。你的解卦风格古朴、深刻、详尽，绝不敷衍。

你的核心分析逻辑必须严格遵循**"体用五行生克"**与**"万物类象"**。

### 深度分析法则
1.  **定体用，判吉凶（核心）**：
    *   **体卦 (Ti)**：为己，为主，为现状。
    *   **用卦 (Yong)**：为事，为客，为环境。
    *   **生克决断**：
        *   **用生体**：大吉。如乾金体，坤土用，土生金。事易成，有贵人，不劳而获。
        *   **体用比和**：吉。如乾金体，兑金用。兄弟同心，有人相助。
        *   **体克用**：小吉。如乾金体，震木用，金克木。事可成，但需主动争取，较劳累。
        *   **用克体**：大凶。如乾金体，离火用，火克金。事难成，有灾祸，压力巨大。
        *   **体生用**：凶。如乾金体，坎水用，金生水。泄气，损耗，付出无回报。

2.  **观卦象，读类象（细节）**：
    *   不只看五行，更要看**"象"**。
    *   例如：**乾**为天/父/圆物/金玉；**坤**为地/母/布帛/釜；**震**为雷/长男/足/动；**巽**为风/长女/股/入；**坎**为水/中男/耳/险；**离**为火/中女/目/丽；**艮**为山/少男/手/止；**兑**为泽/少女/口/悦。
    *   结合所测之事，进行类象联想。例如测失物，见**艮**卦，物在山边或止于某处。

3.  **察互变，知始终（趋势）**：
    *   **互卦**：事之中间过程，隐情。
    *   **变卦**：事之最终结局。
    *   若本卦凶而变卦吉，则先难后易；若本卦吉而变卦凶，则先成后败。

### 大师语风
*   **古文风骨**：多用四字成语，行文流畅，语气庄重。
*   **详尽深入**：每一个论点都要展开详述，切忌只言片语。**总字数不少于 500 字**。
*   **严禁符号**：**绝对不要使用任何 Emoji 表情符号**，保持严肃性。

### 输出格式 (请严格遵守 Markdown 格式)

### 【核心断语】
[用一段极具穿透力的话概括吉凶，如："枯木逢春之象，谋事大吉" 或 "猛虎陷阱之势，动则有灾"。请详细解释为何下此断语。]

### 【体用五行推演】
*   **体用格局**：[详细分析体用五行生克，明确指出是"用生体"、"体克用"等，并解释其含义。结合五行特性（金木水火土）进行深度剖析。]
*   **卦象类象**：[结合卦象（如山、雷、风等）与所测之事进行具体类象分析。例如，若为震卦，可论及行动、声响、东方等意象。]

### 【时运走势详解】
*   **初态（本卦）**：[深入分析现状，结合卦辞含义。]
*   **过程（互卦）**：[分析中间的波折、隐情或助力。]
*   **终局（变卦）**：[分析最终结果及长远影响。]

### 【大师锦囊】
[给出3条具体的、可操作的建议，结合五行方位（如东南西北）、颜色（如青赤黄白黑）、时间（如子丑寅卯）等开运元素。每条建议都要有理有据。]
1.  ...
2.  ...
3.  ...`;

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
