// Each input saves its value under its name. content.js applies the value.
// ponytail: chrome.storage.local, because a slider drag exceeds the write
// limit of chrome.storage.sync. Use sync if settings must follow the account.
const inputs = [...document.querySelectorAll('input')];

chrome.storage.local.get().then((saved) => {
  for (const input of inputs) {
    const value = saved[input.name];
    if (value === undefined) continue;
    if (input.type === 'checkbox') input.checked = value;
    else input.value = input.type === 'range' ? parseFloat(value) : value;
  }
});

document.addEventListener('input', ({ target }) => {
  const value =
    target.type === 'checkbox' ? target.checked : target.value + (target.dataset.unit ?? '');
  chrome.storage.local.set({ [target.name]: value });
});

document.getElementById('reset').addEventListener('click', async () => {
  await chrome.storage.local.clear();
  location.reload();
});
