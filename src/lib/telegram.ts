import { getSettings } from "./settings";

export async function notifyTelegram(text: string) {
  try {
    const s = await getSettings();
    if (!s.tgBotToken || !s.tgChatId) return;
    await fetch(`https://api.telegram.org/bot${s.tgBotToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: s.tgChatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // уведомление не критично — заявка уже сохранена
  }
}

export function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
