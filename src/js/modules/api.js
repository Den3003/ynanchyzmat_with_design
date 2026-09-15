// src/js/api.js

export async function sendFeedback(payload) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch('/api/send.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    // 429 — rate limit, 4xx — ошибки валидации, 5xx — ошибка сервера
    const json = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        success: false,
        message: json?.message || `Ошибка сервера (${response.status})`,
        errors: json?.errors || null,
      };
    }

    console.log('json: ', json);
    return json ?? { success: false, message: 'Пустой ответ сервера' };
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      return { success: false, message: 'Превышено время ожидания ответа' };
    }
    throw err;
  }
}