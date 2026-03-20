import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export const maxDuration = 60;

interface Correction {
  original: string;
  corrected: string;
  reason: string;
  type?: 'spelling' | 'grammar' | 'suggestion';
}

interface CheckResponse {
  corrected: string;
  corrections: Correction[];
}

function buildPrompt(text: string): string {
  return `คุณคือผู้เชี่ยวชาญด้านการตรวจสอบคำผิด ทั้งภาษาไทยและภาษาอังกฤษ

จงตรวจสอบข้อความต่อไปนี้และแก้ไขคำผิด (ถ้ามี):

"${text}"

กฎการตรวจสอบ:
1. ตรวจสอบการสะกดผิด (spelling)
2. ตรวจสอบไวยากรณ์หรือรูปประโยค (grammar)
3. ตรวจสอบข้อแนะนำการใช้คำ (suggestion)
4. ถ้าไม่มีคำผิด ให้คืนค่าข้อความเดิม

กรุณาตอบในรูปแบบ JSON ดังนี้เท่านั้น (อย่าเพิ่ม markdown code block):
{
  "corrected": "ข้อความที่แก้ไขแล้ว",
  "corrections": [
    {
      "original": "คำ/ประโยคที่ผิด",
      "corrected": "คำ/ประโยคที่ถูกต้อง",
      "reason": "เหตุผลที่แก้ไข",
      "type": "spelling" | "grammar" | "suggestion"
    }
  ]
}`;
}

function parseResult(raw: string): CheckResponse | null {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}

async function checkWithGeminiWeb(text: string): Promise<NextResponse> {
  const prompt = buildPrompt(text);
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    );

    await page.goto('https://gemini.google.com', { waitUntil: 'networkidle2', timeout: 30000 });

    const inputSelector = 'rich-textarea .ql-editor';
    await page.waitForSelector(inputSelector, { timeout: 15000 });
    await page.click(inputSelector);

    await page.evaluate((t: string, sel: string) => {
      const el = document.querySelector(sel) as HTMLElement;
      if (el) { el.focus(); document.execCommand('insertText', false, t); }
    }, prompt, inputSelector);

    await new Promise((r) => setTimeout(r, 200));
    await page.keyboard.press('Enter');

    await page.waitForSelector('model-response', { timeout: 30000 });
    await page.waitForFunction(
      () => !document.querySelector('button[aria-label*="Stop" i], button[data-test-id="stop-button"]'),
      { timeout: 60000, polling: 1000 }
    );
    await new Promise((r) => setTimeout(r, 800));

    const responseText = await page.evaluate(() => {
      const responses = document.querySelectorAll('model-response');
      if (!responses.length) return null;
      return responses[responses.length - 1].textContent;
    });

    if (!responseText) {
      return NextResponse.json({ error: 'ไม่ได้รับการตอบกลับจาก Gemini' }, { status: 500 });
    }

    const result = parseResult(responseText);
    if (!result) {
      return NextResponse.json({ original: text, corrected: responseText.trim(), corrections: [] });
    }
    return NextResponse.json({ original: text, corrected: result.corrected || text, corrections: result.corrections || [] });

  } finally {
    if (browser) await browser.close();
  }
}

async function checkWithGeminiApi(text: string, apiKey: string): Promise<NextResponse> {
  const prompt = buildPrompt(text);
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, topK: 40, topP: 0.95, maxOutputTokens: 2048 },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error('Gemini API error:', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดจาก Gemini API' }, { status: 500 });
  }

  const data = await res.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const result = parseResult(raw);
  if (!result) {
    return NextResponse.json({ original: text, corrected: raw.trim(), corrections: [] });
  }
  return NextResponse.json({ original: text, corrected: result.corrected || text, corrections: result.corrections || [] });
}

async function checkWithChatGPTWeb(text: string): Promise<NextResponse> {
  const prompt = buildPrompt(text);
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    );

    await page.goto('https://chatgpt.com', { waitUntil: 'networkidle2', timeout: 30000 });

    // รอ input และใส่ข้อความ
    const inputSelector = '#prompt-textarea';
    await page.waitForSelector(inputSelector, { timeout: 15000 });
    await page.click(inputSelector);

    await page.evaluate((t: string, sel: string) => {
      const el = document.querySelector(sel) as HTMLElement;
      if (el) { el.focus(); document.execCommand('insertText', false, t); }
    }, prompt, inputSelector);

    await new Promise((r) => setTimeout(r, 300));

    // คลิกปุ่ม Send
    const sendBtn = 'button[data-testid="send-button"]';
    await page.waitForSelector(sendBtn, { timeout: 5000 });
    await page.click(sendBtn);

    // รอให้ streaming เริ่ม
    await page.waitForSelector('[data-message-author-role="assistant"]', { timeout: 30000 });

    // รอให้ streaming จบ (ปุ่ม stop หายไป)
    await page.waitForFunction(
      () => !document.querySelector('button[data-testid="stop-button"]'),
      { timeout: 60000, polling: 1000 }
    );
    await new Promise((r) => setTimeout(r, 500));

    // ดึง text จาก response ล่าสุด
    const responseText = await page.evaluate(() => {
      const messages = document.querySelectorAll('[data-message-author-role="assistant"]');
      if (!messages.length) return null;
      return messages[messages.length - 1].textContent;
    });

    if (!responseText) {
      return NextResponse.json({ error: 'ไม่ได้รับการตอบกลับจาก ChatGPT' }, { status: 500 });
    }

    const result = parseResult(responseText);
    if (!result) {
      return NextResponse.json({ original: text, corrected: responseText.trim(), corrections: [] });
    }
    return NextResponse.json({ original: text, corrected: result.corrected || text, corrections: result.corrections || [] });

  } finally {
    if (browser) await browser.close();
  }
}

async function checkWithOpenAI(text: string, apiKey: string): Promise<NextResponse> {
  const prompt = buildPrompt(text);
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 2048,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('OpenAI API error:', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดจาก OpenAI API' }, { status: 500 });
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? '';
  const result = parseResult(raw);
  if (!result) {
    return NextResponse.json({ original: text, corrected: raw.trim(), corrections: [] });
  }
  return NextResponse.json({ original: text, corrected: result.corrected || text, corrections: result.corrections || [] });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { text, provider = 'gemini-web', geminiApiKey, openaiApiKey } = body;

  if (!text || text.trim().length === 0) {
    return NextResponse.json({ error: 'กรุณาใส่ข้อความที่ต้องการตรวจสอบ' }, { status: 400 });
  }

  try {
    if (provider === 'gemini-api') {
      if (!geminiApiKey) return NextResponse.json({ error: 'กรุณาใส่ Gemini API Key ในหน้าตั้งค่า' }, { status: 400 });
      return await checkWithGeminiApi(text, geminiApiKey);
    }
    if (provider === 'chatgpt-web') {
      return await checkWithChatGPTWeb(text);
    }
    if (provider === 'openai-api') {
      if (!openaiApiKey) return NextResponse.json({ error: 'กรุณาใส่ OpenAI API Key ในหน้าตั้งค่า' }, { status: 400 });
      return await checkWithOpenAI(text, openaiApiKey);
    }
    // default: gemini-web
    return await checkWithGeminiWeb(text);
  } catch (error) {
    console.error('Check error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบ กรุณาลองใหม่อีกครั้ง' }, { status: 500 });
  }
}
