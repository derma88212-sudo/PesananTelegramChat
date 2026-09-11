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
  delay_ms: 1000,
  message_preview: ''
};

export function getBroadcastStatus() {
  const performed = broadcastState.sent + broadcastState.failed;
  return {
    ...broadcastState,
    remaining: Math.max(0, broadcastState.total - performed)
  };
}

function resetState({ total, delayMs, messagePreview }) {
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
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Extract a set of usable Telegram text destinations from the bot engine.
 * Uses all active bot instances; each user is sent through the first bot that
 * succeeds, matching the reliability approach used by delivery notifications.
 */
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

/**
 * Run a broadcast across all provided user records.
 *
 * @param {object}   dbService        Universal DB service (getUsers, addSystemLog)
 * @param {Map}      activeBots       bot_engine activeBots map
 * @param {string}   message          Message text (HTML allowed)
 * @param {object}   options          { delayMs, adminId, parseMode }
 * @returns {Promise<object>}         Final broadcast summary
 */
export async function runBroadcast(dbService, activeBots, message, options = {}) {
  if (broadcastState.running) {
    return { success: false, message: 'Broadcast lain sedang berjalan. Tunggu hingga selesai.' };
  }

  const delayMs = Math.max(100, Number(options.delayMs) || 1000);
  const adminId = options.adminId || 'system';
  const parseMode = options.parseMode || 'HTML';

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

  const recipients = (users || [])
    .map((u) => String(u.telegram_id || '').trim())
    .filter(Boolean);

  if (recipients.length === 0) {
    return { success: false, message: 'Belum ada pengguna terdaftar untuk dikirimi broadcast.' };
  }

  resetState({ total: recipients.length, delayMs, messagePreview: message });

  // Fire-and-forget processing loop so the caller (HTTP request) returns fast.
  (async () => {
    for (const telegramId of recipients) {
      if (broadcastState.stop_requested) break;

      let delivered = false;
      for (const sender of senders) {
        try {
          await sender.sendMessage(telegramId, message, {
            parse_mode: parseMode,
            disable_web_page_preview: true
          });
          delivered = true;
          break;
        } catch (err) {
          broadcastState.last_error = err.message;
        }
      }

      if (delivered) broadcastState.sent++;
      else broadcastState.failed++;

      broadcastState.remaining = Math.max(0, recipients.length - (broadcastState.sent + broadcastState.failed));

      // Rate-limit delay between each message
      await sleep(delayMs);
    }

    broadcastState.running = false;
    broadcastState.finished_at = new Date().toISOString();

    try {
      await dbService.addSystemLog({
        admin_id: adminId,
        action: `broadcast_finished sent=${broadcastState.sent} failed=${broadcastState.failed}`
      });
    } catch (e) {}
  })();

  return {
    success: true,
    message: `Broadcast dimulai ke ${recipients.length} pengguna (delay ${delayMs}ms per pesan).`,
    total: recipients.length,
    delay_ms: delayMs
  };
}

export function stopBroadcast() {
  if (!broadcastState.running) {
    return { success: false, message: 'Tidak ada broadcast yang sedang berjalan.' };
  }
  broadcastState.stop_requested = true;
  return { success: true, message: 'Permintaan berhenti broadcast telah dikirim.' };
}

export default {
  runBroadcast,
  stopBroadcast,
  getBroadcastStatus
};
