// Runs on https://top.gg/bot/646937666251915264/vote
// Tries to click the "Vote" button, then watches for a success indicator and
// reports back to the background script. The hCaptcha must be solved manually.

(function () {
  const SUCCESS_PHRASES = [
    "thanks for voting",
    "thank you for voting",
    "vote received",
    "you have already voted",
    "you've already voted",
    "next vote in"
  ];

  function findVoteButton() {
    const candidates = document.querySelectorAll("button, a, [role='button']");
    for (const el of candidates) {
      const text = (el.innerText || el.textContent || "").trim().toLowerCase();
      const visible = !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
      if (!visible || el.disabled) continue;
      if (text === "vote" || text === "vote now" || /^vote for /.test(text)) {
        return el;
      }
    }
    return null;
  }

  function pageIndicatesSuccess() {
    const body = (document.body.innerText || "").toLowerCase();
    return SUCCESS_PHRASES.some((p) => body.includes(p));
  }

  function reportSuccess() {
    try {
      chrome.runtime.sendMessage({ type: "voted" });
    } catch (_) {}
  }

  // Poll: click any visible Vote button each tick, stop when the page reports
  // success. Handles both "single click → silent captcha pass → done" and
  // "click → captcha resolves → button re-enables → click again to submit".
  async function clickUntilDone() {
    const start = Date.now();
    const TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
    let lastClickAt = 0;
    while (Date.now() - start < TIMEOUT_MS) {
      if (pageIndicatesSuccess()) {
        reportSuccess();
        return;
      }
      const btn = findVoteButton();
      // Throttle clicks to avoid spamming if the button stays present after click.
      if (btn && Date.now() - lastClickAt > 3000) {
        btn.click();
        lastClickAt = Date.now();
      }
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  clickUntilDone();
})();
