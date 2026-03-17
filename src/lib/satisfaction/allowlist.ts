/**
 * Satisfaction survey 18-question allowlist with robust header matching.
 */

export interface AllowlistEntry {
  /** Full canonical label */
  label: string;
  /** Shorter key phrases for fuzzy matching (if exact match fails) */
  keywords: string[];
  /** Expected column kind hint */
  expectedKind: "choice" | "score" | "freetext";
}

export const SATISFACTION_ALLOWLIST: AllowlistEntry[] = [
  // Q1-Q2: Choice
  {
    label: "1. 어떤 경로로 강의를 알게 되었나요?",
    keywords: ["경로로 강의를 알게"],
    expectedKind: "choice",
  },
  {
    label: "2. 강의에 참여하게 된 가장 큰 이유는 무엇입니까?",
    keywords: ["참여하게 된 가장 큰 이유"],
    expectedKind: "choice",
  },
  // Q3: Score (3 sub-questions)
  {
    label: "3. 학습 성취도 [강의 전, 본인의 건기식 제조 이해도는 어느정도였나요?]",
    keywords: ["강의 전", "건기식 제조 이해도"],
    expectedKind: "score",
  },
  {
    label: "3. 학습 성취도 [강의 후, 본인의 건기식 제조 이해도는 어느정도였나요?]",
    keywords: ["강의 후", "건기식 제조 이해도"],
    expectedKind: "score",
  },
  {
    label: "3. 학습 성취도 [이 강의를 주변 동료, 지인에게 추천할 의향이 있나요?]",
    keywords: ["추천할 의향"],
    expectedKind: "score",
  },
  // Q4: Score (3 sub-questions)
  {
    label: "4. 강의 내용 및 구성 [강의 난이도는 어땠나요?]",
    keywords: ["강의 난이도"],
    expectedKind: "score",
  },
  {
    label: "4. 강의 내용 및 구성 [강의자료는 이해하기 쉬웠나요?]",
    keywords: ["강의자료는 이해하기"],
    expectedKind: "score",
  },
  {
    label: "4. 강의 내용 및 구성 [본인 사업 진행에 있어 유익한 내용이었나요?]",
    keywords: ["사업 진행에 있어 유익"],
    expectedKind: "score",
  },
  // Q5: Score (4 sub-questions)
  {
    label: "5. 강사 / 강의 전달력 [강의 주제와 목표가 명확히 전달되었나요?]",
    keywords: ["주제와 목표가 명확히"],
    expectedKind: "score",
  },
  {
    label: "5. 강사 / 강의 전달력 [강사는 해당 분야에 대해 정확히 알고 있나요?]",
    keywords: ["해당 분야에 대해 정확히"],
    expectedKind: "score",
  },
  {
    label: "5. 강사 / 강의 전달력 [강의 전달 방식(목소리, 속도, 열정)은 적절했나요?]",
    keywords: ["전달 방식", "목소리"],
    expectedKind: "score",
  },
  {
    label: "5. 강사 / 강의 전달력 [학습자의 질문이나 의견에 성실히 답변했나요?]",
    keywords: ["질문이나 의견에 성실히"],
    expectedKind: "score",
  },
  // Q6: Score (2 sub-questions)
  {
    label: "6. 운영 및 환경 [강의 시간 및 일정 배분은 적절했나요?]",
    keywords: ["시간 및 일정 배분"],
    expectedKind: "score",
  },
  {
    label: "6. 운영 및 환경 [강의실 환경(또는 온라인 플랫폼)은 안정, 쾌적했나요?]",
    keywords: ["강의실 환경", "온라인 플랫폼"],
    expectedKind: "score",
  },
  // Q7-Q10: Freetext
  {
    label: "7. 강의 내용을 실행함에 있어 예상되는 어려움이 있나요?",
    keywords: ["예상되는 어려움"],
    expectedKind: "freetext",
  },
  {
    label: "8. 이번 강의에서 가장 좋았던 점은 무엇인가요?",
    keywords: ["가장 좋았던 점"],
    expectedKind: "freetext",
  },
  {
    label: "9. 강의 내용 중 보완이 필요하거나 아쉬웠던 점은 무엇인가요?",
    keywords: ["보완이 필요하거나 아쉬웠던"],
    expectedKind: "freetext",
  },
  {
    label: "10. 향후 개설을 희망하는 강의 주제가 있다면 작성해주세요",
    keywords: ["희망하는 강의 주제"],
    expectedKind: "freetext",
  },
];

/**
 * Normalize header for comparison:
 * - replace unicode whitespace with regular space
 * - trim, collapse multiple spaces
 * - lowercase
 */
export function normalizeHeader(header: string): string {
  return header
    .replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, " ")
    .trim()
    .replace(/\s{2,}/g, " ")
    .toLowerCase();
}

export interface AllowlistMatch {
  allowlistIndex: number;
  entry: AllowlistEntry;
}

/**
 * Match CSV headers against the allowlist using two-pass strategy:
 * Pass 1: exact match (after normalization)
 * Pass 2: keyword-based fuzzy match
 *
 * Returns a sparse record: headerIndex → AllowlistMatch (only for matched headers)
 */
export function matchAllowlist(
  headers: string[]
): Record<number, AllowlistMatch | undefined> {
  const result: Record<number, AllowlistMatch | undefined> = {};
  const normalizedHeaders = headers.map(normalizeHeader);
  const normalizedAllowlist = SATISFACTION_ALLOWLIST.map((e) => normalizeHeader(e.label));
  const claimed = new Set<number>(); // allowlist indices already matched

  // Pass 1: exact normalized match
  for (let hi = 0; hi < normalizedHeaders.length; hi++) {
    const nh = normalizedHeaders[hi];
    for (let ai = 0; ai < normalizedAllowlist.length; ai++) {
      if (claimed.has(ai)) continue;
      if (nh === normalizedAllowlist[ai]) {
        result[hi] = { allowlistIndex: ai, entry: SATISFACTION_ALLOWLIST[ai] };
        claimed.add(ai);
        break;
      }
    }
  }

  // Pass 2: keyword fuzzy match for unclaimed allowlist entries
  for (let ai = 0; ai < SATISFACTION_ALLOWLIST.length; ai++) {
    if (claimed.has(ai)) continue;
    const entry = SATISFACTION_ALLOWLIST[ai];
    const normalizedKeywords = entry.keywords.map((k) => normalizeHeader(k));

    for (let hi = 0; hi < normalizedHeaders.length; hi++) {
      if (result[hi] !== undefined) continue; // header already matched
      const nh = normalizedHeaders[hi];
      // All keywords must be present in the header
      if (normalizedKeywords.every((kw) => nh.includes(kw))) {
        result[hi] = { allowlistIndex: ai, entry };
        claimed.add(ai);
        break;
      }
    }
  }

  return result;
}
