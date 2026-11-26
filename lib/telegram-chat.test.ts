import assert from "node:assert/strict";
import test from "node:test";
import { telegramChatId } from "./telegram.ts";

test("live chat can use a different telegram group from clicks and leads", () => {
  const previousLive = process.env.TELEGRAM_LIVE_CHAT_ID;
  const previousAlerts = process.env.TELEGRAM_CHAT_ID;
  process.env.TELEGRAM_CHAT_ID = "-1001";
  process.env.TELEGRAM_LIVE_CHAT_ID = "-1002";
  try {
    assert.equal(telegramChatId("alerts"), "-1001");
    assert.equal(telegramChatId("live"), "-1002");
    delete process.env.TELEGRAM_LIVE_CHAT_ID;
    assert.equal(telegramChatId("live"), "-1001");
  } finally {
    if (previousLive === undefined) delete process.env.TELEGRAM_LIVE_CHAT_ID;
    else process.env.TELEGRAM_LIVE_CHAT_ID = previousLive;
    if (previousAlerts === undefined) delete process.env.TELEGRAM_CHAT_ID;
    else process.env.TELEGRAM_CHAT_ID = previousAlerts;
  }
});
