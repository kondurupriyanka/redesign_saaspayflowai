import { Buffer } from 'buffer';

// Lazy load xlsx to avoid startup issues
async function loadXlsx() {
  const xlsx = await import('xlsx');
  return xlsx;
}

// PDF parsing - use a simple text extraction fallback
async function extractPdfText(buffer: Buffer): Promise<string> {
  // Extract readable text from PDF bytes as fallback
  const text = buffer.toString('binary');
  const textMatches = text.match(/\(([^\)]{2,})\)/g) || [];
  const extracted = textMatches
    .map(m => m.slice(1, -1))
    .filter(t => /[a-zA-Z0-9]/.test(t))
    .join(' ');
  return extracted || '[PDF content - could not extract text]';
}

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface OpenRouterResponse {
  error?: { message?: string };
  choices?: Array<{ message?: { content?: string } }>;
}

type AIContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

type AIMessageContent = string | AIContentPart[];

function stripJsonWrapping(content: string) {
  let jsonStr = content.trim();
  if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7);
  if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3);
  if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);
  return jsonStr.trim();
}

function parseJsonContent<T>(content: string): T {
  const jsonStr = stripJsonWrapping(content);
  const start = jsonStr.indexOf('{');
  const end = jsonStr.lastIndexOf('}');
  const candidate = start >= 0 && end >= 0 ? jsonStr.slice(start, end + 1) : jsonStr;
  return JSON.parse(candidate) as T;
}

async function requestJson<T>(
  messages: Array<{ role: 'system' | 'user'; content: AIMessageContent }>,
  temperature = 0.3
): Promise<T> {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('Missing OPENROUTER_API_KEY');
  }

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
      messages,
      temperature,
    }),
  });

  const body = (await response.json().catch(() => ({}))) as OpenRouterResponse;
  if (!response.ok) {
    throw new Error(body?.error?.message || 'OpenRouter request failed');
  }

  const content = body?.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error('Received empty response from AI');
  }

  try {
    return parseJsonContent<T>(content);
  } catch {
    throw new Error('AI returned invalid JSON');
  }
}

export class AIService {
  static async generatePaymentReminder(input: {
    businessName?: string;
    clientName: string;
    amount: number;
    invoiceNumber: string;
    dueDate: string;
    daysOverdue: number;
    tone?: 'friendly' | 'firm' | 'serious';
  }) {
    const tone = input.tone || (input.daysOverdue > 14 ? 'serious' : input.daysOverdue > 5 ? 'firm' : 'friendly');
    const systemPrompt =
      'You write concise professional payment reminder messages for freelancers. Return valid JSON only.';

    const userPrompt = [
      `Business: ${input.businessName || 'PayFlow AI user'}`,
      `Client: ${input.clientName}`,
      `Invoice: ${input.invoiceNumber}`,
      `Amount due: ${input.amount}`,
      `Due date: ${input.dueDate}`,
      `Days overdue: ${input.daysOverdue}`,
      `Tone: ${tone}`,
      'Return JSON with keys: tone, subject, message.',
      'Keep the reminder direct, respectful, and concise.',
    ].join('\n');

    const result = await requestJson<{ tone: string; subject: string; message: string }>([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], 0.4);

    return {
      tone,
      subject: result.subject?.trim() || `Payment reminder for ${input.invoiceNumber}`,
      message: result.message?.trim() || '',
    };
  }

  static async extractInvoiceData(input: {
    base64File: string;
    mimeType: string;
  }) {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('Missing OPENROUTER_API_KEY');
    }

    let extractedText = '';
    const buffer = Buffer.from(input.base64File, 'base64');

    if (input.mimeType === 'application/pdf') {
      try {
        extractedText = await extractPdfText(buffer);
      } catch (err) {
        throw new Error('Failed to parse PDF document. Please ensure it is a valid PDF.');
      }
    } else if (
      input.mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      input.mimeType === 'application/vnd.ms-excel' ||
      input.mimeType === 'text/csv'
    ) {
      try {
        const xlsx = await loadXlsx();
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        extractedText = xlsx.utils.sheet_to_csv(worksheet);
      } catch (err) {
        throw new Error('Failed to parse spreadsheet. Please ensure it is a valid Excel or CSV file.');
      }
    } else if (input.mimeType === 'text/plain') {
      extractedText = buffer.toString('utf8');
    }

    const systemPrompt =
      'Extract invoice details and return valid JSON only with keys: client_name, project_title, amount, currency, due_date_days, line_items, tax_percent.';

    let userContent: AIMessageContent;

    if (input.mimeType.startsWith('image/')) {
      userContent = [
        {
          type: 'image_url',
          image_url: {
            url: `data:${input.mimeType};base64,${input.base64File}`,
          },
        },
        {
          type: 'text',
          text: 'Return invoice extraction JSON only.',
        },
      ];
    } else {
      if (!extractedText) {
        throw new Error(`Format ${input.mimeType} is not supported or extraction produced no text.`);
      }
      userContent = [
        {
          type: 'text',
          text: `Extracted data from ${input.mimeType} invoice document:\n\n${extractedText}\n\nReturn invoice extraction JSON only.`,
        },
      ];
    }

    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        temperature: 0.2,
      }),
    });

    const body = (await response.json().catch(() => ({}))) as OpenRouterResponse;
    if (!response.ok) {
      throw new Error(body?.error?.message || 'Failed to extract invoice data');
    }

    const content = body?.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new Error('Received empty response from AI');
    }

    return parseJsonContent<{
      client_name: string;
      project_title: string;
      amount: number;
      currency: string;
      due_date_days: number;
      line_items: Array<{ description: string; quantity: number; unit_price: number }>;
      tax_percent: number;
    }>(content);
  }

  static async generateFinancialInsights(input: {
    summary: Record<string, unknown>;
    topClients: Array<{ name: string; revenue: number; avgDelay?: number }>;
    overdueClients: Array<{ name: string; revenue: number; avgDelay?: number }>;
  }) {
    const systemPrompt =
      'You are a financial analyst for a SaaS billing app. Return valid JSON only.';

    const userPrompt = JSON.stringify(
      {
        summary: input.summary,
        topClients: input.topClients,
        overdueClients: input.overdueClients,
        requiredKeys: ['insights', 'recommended_actions', 'risk_flags', 'best_day_to_send'],
      },
      null,
      2
    );

    return requestJson<{
      insights: string[];
      recommended_actions: string[];
      risk_flags: string[];
      best_day_to_send: string;
    }>([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], 0.2);
  }
}
