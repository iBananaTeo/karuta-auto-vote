const VOTE_URL = "https://top.gg/bot/646937666251915264/vote";
const VOTE_INTERVAL_MIN = 12 * 60;   // 12 hours between successful votes
const RETRY_INTERVAL_MIN = 60;       // retry hourly if a vote attempt didn't complete
const ALARM_NAME = "karuta-vote";

chrome.runtime.onInstalled.addListener(async () => {
  // Open immediately on first install so the user can complete the first vote.
  await scheduleAlarm(0);
});

chrome.runtime.onStartup.addListener(async () => {
  const { nextVoteAt } = await chrome.storage.local.get("nextVoteAt");
  const delayMin = nextVoteAt ? Math.max(0, (nextVoteAt - Date.now()) / 60000) : 0;
  chrome.alarms.create(ALARM_NAME, { delayInMinutes: delayMin });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) await openVoteTab();
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "voted") {
    handleVoteSuccess().then(() => sendResponse({ ok: true }));
    return true;
  }
  if (msg.type === "voteNow") {
    openVoteTab().then(() => sendResponse({ ok: true }));
    return true;
  }
});

async function openVoteTab() {
  await chrome.tabs.create({ url: VOTE_URL, active: true });
  await chrome.storage.local.set({ lastAttemptAt: Date.now() });
  // Schedule a fallback retry. If the user actually votes, the success handler
  // will overwrite this with the full 12h interval.
  await scheduleAlarm(RETRY_INTERVAL_MIN);
  setBadge("…", "#888");
}

async function handleVoteSuccess() {
  await chrome.storage.local.set({ lastVotedAt: Date.now() });
  await scheduleAlarm(VOTE_INTERVAL_MIN);
  setBadge("✓", "#2a9d4a");
  // Clear the badge after a few minutes so it doesn't linger.
  setTimeout(() => setBadge("", "#000"), 5 * 60 * 1000);
}

async function scheduleAlarm(delayMin) {
  const nextVoteAt = Date.now() + delayMin * 60 * 1000;
  await chrome.storage.local.set({ nextVoteAt });
  chrome.alarms.create(ALARM_NAME, { delayInMinutes: delayMin });
}

function setBadge(text, color) {
  chrome.action.setBadgeText({ text });
  if (text) chrome.action.setBadgeBackgroundColor({ color });
}
