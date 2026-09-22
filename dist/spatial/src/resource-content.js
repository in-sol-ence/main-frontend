// The body of an expanded resource card: the lecture segment itself. A DOM port
// of the resource-branch prototype's ResourceContent.jsx (spatial-expansion),
// so the study needs no React. Only presentation lives here; every word of
// educational text and every answer key stays in resource-library.js.

// Only http(s) links are ever opened; a YouTube link is sent to its start.
export function resourceUrl(resource) {
  try {
    const url = new URL(resource.url);
    if (!['https:', 'http:'].includes(url.protocol)) return null;
    if (Number.isFinite(resource.start) && ['www.youtube.com', 'youtube.com', 'youtu.be'].includes(url.hostname)) {
      url.searchParams.set('t', String(resource.start));
    }
    return url.href;
  } catch { return null; }
}

// The privacy-enhanced embed, cut to exactly this segment.
export function videoEmbed(resource) {
  if (resource.type !== 'video') return null;
  try {
    const source = new URL(resourceUrl(resource));
    const id = source.hostname === 'youtu.be' ? source.pathname.slice(1)
      : ['youtube.com', 'www.youtube.com'].includes(source.hostname) ? source.searchParams.get('v') : null;
    if (!id || !/^[\w-]{11}$/.test(id)) return null;
    const embed = new URL(`https://www.youtube-nocookie.com/embed/${id}`);
    if (Number.isFinite(resource.start)) embed.searchParams.set('start', String(Math.max(0, resource.start)));
    if (Number.isFinite(resource.end)) embed.searchParams.set('end', String(resource.end));
    return embed.href;
  } catch { return null; }
}

function _element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function createResourceContent(resource, onClose) {
  const root = _element('div', 'resource-content');
  const close = _element('button', 'resource-close', 'Close');
  close.type = 'button';
  close.setAttribute('aria-label', `Close ${resource.title}`);
  close.addEventListener('click', onClose);
  root.append(close);

  if (resource.image?.src) {
    const image = _element('img');
    image.src = resource.image.src; image.alt = resource.image.alt || '';
    root.append(image);
  }
  // Nothing is fetched from a video host until the reader asks for it.
  const embed = videoEmbed(resource);
  if (embed) {
    const load = _element('button', 'resource-video-load', 'Load video segment');
    load.type = 'button';
    load.addEventListener('click', () => {
      const frame = _element('iframe', 'resource-video');
      frame.src = embed; frame.title = resource.title;
      frame.allow = 'encrypted-media; fullscreen; picture-in-picture';
      frame.allowFullscreen = true;
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      load.replaceWith(frame);
    });
    root.append(load);
  }
  root.append(_element('p', '', resource.body || resource.summary));

  if (resource.choices?.length) {
    const set = _element('fieldset');
    set.append(_element('legend', '', 'Choose an answer'));
    const feedback = _element('p');
    feedback.setAttribute('role', 'status'); feedback.hidden = true;
    const buttons = resource.choices.map(item => {
      const button = _element('button', '', item.text);
      button.type = 'button'; button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => {
        for (const other of buttons) other.setAttribute('aria-pressed', String(other === button));
        feedback.textContent = `${item.correct ? 'Correct. ' : 'Try again. '}${resource.answerExplanation || ''}`;
        feedback.hidden = false;
      });
      return button;
    });
    set.append(...buttons, feedback);
    root.append(set);
  }
  if (Number.isFinite(resource.start)) {
    root.append(_element('p', 'resource-meta', `Segment: ${resource.start}s${Number.isFinite(resource.end) ? ` to ${resource.end}s` : ''}`));
  }
  const url = resourceUrl(resource);
  if (url) {
    const link = _element('a', '', `${resource.type === 'video' ? 'Watch segment' : 'Open resource'} ↗`);
    link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer';
    root.append(link);
  }
  if (resource.source) root.append(_element('p', 'resource-meta', `${resource.source}${resource.license ? ` · ${resource.license}` : ''}`));
  return root;
}
