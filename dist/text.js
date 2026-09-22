const messages = [
  'skatebored',
  'an adaptive learning platform',
  'skatebored',
  'revolutionizing edtech?',
  'skatebored',
  'mathematically optimal learning',
  'skatebored',
  'indexing all of math in an embedding space',
  'skatebored',
  'estimating your knowledge',
  'skatebored',
  'navigating the mathematics of learning',
  'skatebored',
  'rl edtech',
  'skatebored',
  'click on the demo bro'
];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const text = document.querySelector('#typed');
let typing;
const plainText = messages.join('\n');
// Exported offsets are character indices, including newlines; null inherits cream.
const wordColors = Array(plainText.length).fill(null);
wordColors.fill('#f04c4c', 66, 92);

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
