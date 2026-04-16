import OpenAI from 'openai';
import { IAnalysis } from '../models/Contract';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are an expert legal contract risk analyzer. Analyze the given contract text and identify potential risks, issues, and areas of concern.

For each risk found, provide:
1. title: A brief title for the risk
2. severity: One of "critical", "high", "medium", or "low"
3. category: One of "legal", "financial", "compliance", or "operational"
4. description: A detailed description of the risk
5. mitigation: A recommended mitigation strategy
6. clauseLocation: The approximate location or section where this risk was found

Also provide:
- summary: A 2-3 sentence executive summary of the contract's overall risk profile
- score: An overall safety score from 0-100 (higher = safer). Consider:
  - 90-100: Very safe, minimal risks
  - 70-89: Generally safe with minor concerns
  - 50-69: Moderate risks requiring attention
  - 30-49: High risk, significant concerns
  - 0-29: Critical risk, major issues found
- riskCategories: Count of risks in each category (legal, financial, compliance, operational)

Focus on analyzing these key areas:
- Liability and indemnification clauses
- Termination and renewal terms
- Confidentiality and data protection
- Payment terms and penalties
- Intellectual property rights
- Force majeure provisions
- Dispute resolution mechanisms
- Compliance with regulations
- Insurance requirements
- Non-compete and non-solicitation clauses

IMPORTANT: Return ONLY valid JSON in the exact format specified below. Do not include any text before or after the JSON.

{
  "risks": [
    {
      "title": "string",
      "severity": "critical|high|medium|low",
      "category": "legal|financial|compliance|operational",
      "description": "string",
      "mitigation": "string",
      "clauseLocation": "string"
    }
  ],
  "summary": "string",
  "score": number,
  "riskCategories": {
    "legal": number,
    "financial": number,
    "compliance": number,
    "operational": number
  }
}`;

export async function analyzeContract(contractText: string): Promise<IAnalysis> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Analyze the following contract for risks:\n\n${contractText}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const analysis: IAnalysis = JSON.parse(content);

    // Validate the response structure
    if (!analysis.risks || !Array.isArray(analysis.risks)) {
      analysis.risks = [];
    }
    if (typeof analysis.score !== 'number' || analysis.score < 0 || analysis.score > 100) {
      analysis.score = 50;
    }
    if (!analysis.summary) {
      analysis.summary = 'Analysis completed. Please review the identified risks.';
    }
    if (!analysis.riskCategories) {
      analysis.riskCategories = { legal: 0, financial: 0, compliance: 0, operational: 0 };
    }

    // Ensure risk categories count matches actual risks
    const categoryCounts = { legal: 0, financial: 0, compliance: 0, operational: 0 };
    analysis.risks.forEach((risk) => {
      if (risk.category in categoryCounts) {
        categoryCounts[risk.category]++;
      }
    });
    analysis.riskCategories = categoryCounts;

    return analysis;
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
    throw error;
  }
}
