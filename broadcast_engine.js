/**
 * Mass Broadcast Engine
 * ----------------------------------------------------------------------------
 * Mengirim pesan massal ke seluruh pengguna bot dengan sistem antrean (queue)
 * dan rate-limiting agar tidak melanggar batas Telegram API (~30 pesan/detik).
 *
 * Fitur:
 * - Antrean berurutan (sequential queue) dengan delay konfigurasi per pesan.
 * - Progres realtime (sent / failed / remaining) yang bisa dipantau.
 * - Berhenti otomatis saat semua pesan selesai atau saat dihentikan manual.
 * - Aman terhadap kegagalan: satu kirim gagal tidak menggagalkan seluruh antrean.
 * - Simpan riwayat ke database untuk tracking.
 * - Support inline keyboard buttons.
 */

// Singleton state for the currently running (or last completed) broadcast.
const broadcastState = {
  running: false,
  stop_requested: false,
  total: 0,
  sent: 0,
  failed: 0,
  remaining: 0,
  started_at: null,
  finished_at: null,
  last_error: null,
  delay_ms: 200, // Reduced from 1000ms to 200ms for faster delivery (~5 msg/sec)
  message_preview: '',
  broadcast_id: null,
  options: {}
};

export function getBroadcastStatus() {
  const performed = broadcastState.sent + broadcastState.failed;
  return {
    ...broadcastState,
    remaining: Math.max(0, broadcastState.total - performed)
  };
}

function resetState({ total, delayMs, messagePreview, broadcastId, options }) {
  broadcastState.running = true;
  broadcastState.stop_requested = false;
  broadcastState.total = total;
  broadcastState.sent = 0;
  broadcastState.failed = 0;
  broadcastState.remaining = total;
  broadcastState.started_at = new Date().toISOString();
  broadcastState.finished_at = null;
  broadcastState.last_error = null;
  broadcastState.delay_ms = delayMs;
  broadcastState.message_preview = (messagePreview || '').slice(0, 120);
  broadcastState.broadcast_id = broadcastId;
  broadcastState.options = options;
}

// Interruptible sleep that checks stop_requested every 50ms
const sleep = (ms) => new Promise((resolve) => {
  const start = Date.now();
  const checkStop = () => {
    if (broadcastState.stop_requested || Date.now() - start >= ms) {
      resolve();
    } else {
      setTimeout(checkStop, 50);
    }
  };
  checkStop();
});

function getTelegramSenders(activeBots) {
  const senders = [];
  if (!activeBots) return senders;
  for (const instance of activeBots.values()) {
    if (instance?.bot?.telegram?.sendMessage) {
      senders.push(instance.bot.telegram);
    }
  }
  return senders;
}

function buildInlineKeyboard(buttonLabel, buttonUrl) {
  if (!buttonLabel || !buttonUrl) return undefined;
  return {
    inline_keyboard: [[
      { text: buttonLabel, url: buttonUrl }
    ]]
  };
}

export async function runBroadcast(dbService, activeBots, message, options = {}) {
  if (broadcastState.running) {
    return { success: false, message: 'Broadcast lain sedang berjalan. Tunggu hingga selesai.' };
  }

  const delayMs = Math.max(50, Number(options.delayMs) || 200); // Minimum 50ms, default 200ms
  const adminId = options.adminId || 'system';
  const parseMode = options.parseMode || 'HTML';
  const photoUrl = options.photoUrl || null;
  const targetLanguage = options.targetLanguage || 'ALL';
  const buttonLabel = options.buttonLabel || null;
  const buttonUrl = options.buttonUrl || null;

  const senders = getTelegramSenders(activeBots);
  if (senders.length === 0) {
    return { success: false, message: 'Tidak ada bot aktif untuk mengirim broadcast. Jalankan bot terlebih dahulu.' };
  }

  let users = [];
  try {
    users = await dbService.getUsers();
  } catch (e) {
    return { success: false, message: `Gagal memuat daftar pengguna: ${e.message}` };
  }

  let recipients = (users || [])
    .map((u) => String(u.telegram_id || '').trim())
    .filter(Boolean);

  // Filter by language if specified
  if (targetLanguage !== 'ALL') {
    try {
      const filteredUsers = (users || []).filter(u => u.language === targetLanguage);
      recipients = filteredUsers.map(u => String(u.telegram_id || '').trim()).filter(Boolean);
    } catch (e) {}
  }

  if (recipients.length === 0) {
    return { success: false, message: 'Belum ada pengguna terdaftar untuk dikirimi broadcast.' };
  }

  const broadcastId = `bch_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  
  // Build inline keyboard once
  const replyMarkup = buildInlineKeyboard(buttonLabel, buttonUrl);

  // Save initial broadcast history to database
  try {
    await dbService.saveBroadcastHistory({
      broadcast_id: broadcastId,
      message,
      photo_url: photoUrl,
      target_language: targetLanguage,
      button_label: buttonLabel,
      button_url: buttonUrl,
      total_recipients: recipients.length,
      sent_count: 0,
      failed_count: 0,
      status: 'running',
      started_at: new Date().toISOString(),
      created_by: adminId
    });
  } catch (e) {
    console.warn('[Broadcast] Failed to save initial history:', e.message);
  }

  resetState({ total: recipients.length, delayMs, messagePreview: message, broadcastId, options });

  // Fire-and-forget processing loop so the caller (HTTP request) returns fast.
  (async () => {
    for (const telegramId of recipients) {
      if (broadcastState.stop_requested) break;

      let delivered = false;
      for (const sender of senders) {
        try {
          const sendOptions = {
            parse_mode: parseMode,
            disable_web_page_preview: true,
            ...(replyMarkup ? { reply_markup: replyMarkup } : {})
          };

          // If photo_url is provided, send as photo with caption
          if (photoUrl) {
            await sender.sendPhoto(telegramId, photoUrl, {
              caption: message,
              ...sendOptions
            });
          } else {
            await sender.sendMessage(telegramId, message, sendOptions);
          }
          delivered = true;
          break;
        } catch (err) {
          broadcastState.last_error = err.message;
        }
      }

      if (delivered) broadcastState.sent++;
      else broadcastState.failed++;

      broadcastState.remaining = Math.max(0, recipients.length - (broadcastState.sent + broadcastState.failed));

      // Update database history periodically (every 10 messages)
      if ((broadcastState.sent + broadcastState.failed) % 10 === 0) {
        try {
          await dbService.saveBroadcastHistory({
            broadcast_id: broadcastId,
            sent_count: broadcastState.sent,
            failed_count: broadcastState.failed,
            status: 'running'
          });
        } catch (e) {}
      }

      // Rate-limit delay between each message (interruptible)
      await sleep(delayMs);
    }

    broadcastState.running = false;
    broadcastState.finished_at = new Date().toISOString();
    const finalStatus = broadcastState.stop_requested ? 'stopped' : 'completed';

    // Save final history to database
    try {
      await dbService.saveBroadcastHistory({
        broadcast_id: broadcastId,
        sent_count: broadcastState.sent,
        failed_count: broadcastState.failed,
        status: finalStatus,
        finished_at: new Date().toISOString(),
        error: broadcastState.stop_requested ? 'Dihentikan manual' : (broadcastState.failed > 0 ? `Gagal: ${broadcastState.failed}` : null)
      });
      await dbService.addSystemLog({
        admin_id: adminId,
        action: `broadcast_finished sent=${broadcastState.sent} failed=${broadcastState.failed} status=${finalStatus}`
      });
    } catch (e) {}
  })();

  return {
    success: true,
    message: `Broadcast dimulai ke ${recipients.length} pengguna (delay ${delayMs}ms per pesan).`,
    total: recipients.length,
    delay_ms: delayMs,
    broadcast_id: broadcastId
  };
}

export function stopBroadcast() {
  if (!broadcastState.running) {
    return { success: false, message: 'Tidak ada broadcast yang sedang berjalan.' };
  }
  broadcastState.stop_requested = true;
  return { success: true, message: 'Proses broadcast dihentikan.' };
}

export default {
  runBroadcast,
  stopBroadcast,
  getBroadcastStatus
};
