function fmt(ts) {
  if (!ts) return "never";
  const d = new Date(ts);
  const now = Date.now();
  const diff = ts - now;
  if (Math.abs(diff) < 60_000) return "just now";
  if (diff > 0) {
    const mins = Math.round(diff / 60_000);
    if (mins < 60) return `in ${mins}m`;
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem ? `in ${hrs}h ${rem}m` : `in ${hrs}h`;
  }
  const mins = Math.round(-diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

async function render() {
  const { lastVotedAt, nextVoteAt } = await chrome.storage.local.get([
    "lastVotedAt",
    "nextVoteAt",
  ]);
  document.getElementById("last").textContent = fmt(lastVotedAt);
  document.getElementById("next").textContent = fmt(nextVoteAt);
}

document.getElementById("voteNow").addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "voteNow" });
  window.close();
});

render();
