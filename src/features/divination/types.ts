export type DivinationMethod = "manual" | "random" | "time";

export interface DivinationNumbers {
    num1: number;
    num2: number;
    num3: number;
    movingLine?: number;
}

export interface DivinationSubmission {
    question: string;
    method: DivinationMethod;
    numbers: DivinationNumbers;
    generatedAt: string;
}

export interface DivinationRequestContext extends DivinationSubmission {
    clientRequestId: string;
}
