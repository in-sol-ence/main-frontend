import { landing } from './copy/landing.js';

// Wording lives in copy/landing.js; [brackets] there mark the red characters.
const messages = landing.phrases.map(phrase => phrase.replace(/[[\]]/g, ''));
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const text = document.querySelector('#typed');
// Reserve every phrase's height, and each current phrase's untyped ending.
const sizing = document.createElement('span');
sizing.className = 'landing-sizing';
sizing.setAttribute('aria-hidden', 'true');
for (const message of messages) {
  const phrase = document.createElement('span');
  phrase.textContent = message.replace(/\^\d+/g, '');
  sizing.append(phrase);
}
text.closest('h1').prepend(sizing);
let fullMessage = messages[0];
new MutationObserver(() => {
  text.dataset.rest = fullMessage.slice(text.textContent.length);
}).observe(text, { childList: true, characterData: true, subtree: true });
let typing;
let firstMessage = 0;
let resumeTimer;
let deleting = null;
// Character indices, including newlines; null inherits cream.
const wordColors = [];
for (const phrase of landing.phrases) {
  let red = false;
  for (const character of phrase.match(/\^\d+|[\s\S]/g) || []) {
    if (character === '[' || character === ']') { red = character === '['; continue; }
    if (!/^\^\d+$/.test(character)) wordColors.push(red ? '#f04c4c' : null);
  }
  wordColors.push(null); // Newline separating phrases.
}

document.querySelector('#demo-button').textContent = landing.demoButton;
const contact = document.querySelector('#contact-link');
contact.textContent = landing.contactButton;
contact.href = `mailto:${landing.contactEmail}`;

function _coloredMessages() {
  let index = 0;
  return messages.map(message => {
    let html = '';
    for (const token of message.match(/\^\d+|[\s\S]/g)) {
      if (/^\^\d+$/.test(token)) { html += token; continue; }
      const color = wordColors[index++];
      const escaped = token.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      html += color ? `<span style="color:${color}">${escaped}</span>` : escaped;
    }
    index++; // Newline separating phrases in the transcript.
    return html;
  });
}

// A readable transcript avoids announcing every individual keystroke.
document.querySelector('#transcript').textContent = messages.slice(1)
  .map(message => message.replace(/\^\d+/g, '').replace(/\n/g, ' ')).join(' ');

function _startTyping(startAt = 0) {
  clearTimeout(resumeTimer);
  typing?.destroy();
  typing = null;
  firstMessage = startAt;
  deleting = null;
  fullMessage = messages[startAt].replace(/\^\d+/g, '');
  const colored = _coloredMessages();
  text.innerHTML = colored[startAt];
  if (reducedMotion.matches || typeof Typed === 'undefined') return;
  text.textContent = '';
  typing = new Typed(text, {
    strings: [...colored.slice(startAt), ...colored.slice(0, startAt)],
    typeSpeed: 65,
    backSpeed: 28,
    startDelay: startAt ? 0 : 650,
    backDelay: 2100,
    smartBackspace: false,
    loop: true,
    showCursor: true,
    cursorChar: '',
    autoInsertCss: false,
    contentType: 'html',
    preStringTyped(index) { deleting = null; fullMessage = messages[(startAt + index) % messages.length].replace(/\^\d+/g, ''); },
    onStringTyped(index) { deleting = index; }
  });
}

_startTyping();
reducedMotion.addEventListener('change', () => _startTyping());

function _skipTyping() {
  if (!typing || document.querySelector('#home').inert) return false;
  const current = (firstMessage + typing.arrayPos) % messages.length;
  if (text.textContent === messages[current]) return false;
  if (deleting === typing.arrayPos) {
    _startTyping((current + 1) % messages.length);
    return true;
  }
  typing.destroy();
  typing = null;
  text.innerHTML = _coloredMessages()[current];
  resumeTimer = setTimeout(() => _startTyping((current + 1) % messages.length), 2100);
  return true;
}

document.querySelector('#home').addEventListener('click', event => {
  if (!typing || deleting !== typing.arrayPos) return;
  if (!event.target.closest?.('button, a, input, textarea, select, [contenteditable="true"]')) _skipTyping();
});
document.addEventListener('keydown', event => {
  if (event.code !== 'Space' || event.repeat || event.metaKey || event.ctrlKey || event.altKey ||
      event.target.closest?.('button, a, input, textarea, select, [contenteditable="true"]')) return;
  if (_skipTyping()) event.preventDefault();
});
