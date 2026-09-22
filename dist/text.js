import { landing } from './copy/landing.js';

// Wording lives in copy/landing.js; [brackets] there mark the red characters.
const messages = landing.phrases.map(phrase => phrase.replace(/[[\]]/g, ''));
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const text = document.querySelector('#typed');
let typing;
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

function _startTyping() {
  typing?.destroy();
  typing = null;
  text.innerHTML = _coloredMessages()[0];
  if (reducedMotion.matches || typeof Typed === 'undefined') return;
  text.textContent = '';
  typing = new Typed(text, {
    strings: _coloredMessages(),
    typeSpeed: 65,
    backSpeed: 28,
    startDelay: 650,
    backDelay: 2100,
    smartBackspace: false,
    loop: true,
    showCursor: true,
    cursorChar: '',
    autoInsertCss: false,
    contentType: 'html'
  });
}

_startTyping();
reducedMotion.addEventListener('change', _startTyping);
