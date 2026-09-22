import { useState } from 'react'

// Only presentation lives here; all educational text and answer keys remain
// in resourceData.js (or the host's replacement data).
function _resourceUrl(resource) {
  try {
    const url = new URL(resource.url)
    if (!['https:', 'http:'].includes(url.protocol)) return null
    if (Number.isFinite(resource.start) && ['www.youtube.com', 'youtube.com', 'youtu.be'].includes(url.hostname)) {
      url.searchParams.set('t', String(resource.start))
    }
    return url.href
  } catch { return null }
}

function _videoEmbed(resource) {
  if (resource.type !== 'video') return null
  try {
    const source = new URL(_resourceUrl(resource))
    const id = source.hostname === 'youtu.be' ? source.pathname.slice(1) : ['youtube.com', 'www.youtube.com'].includes(source.hostname) ? source.searchParams.get('v') : null
    if (!id || !/^[\w-]{11}$/.test(id)) return null
    const embed = new URL(`https://www.youtube-nocookie.com/embed/${id}`)
    if (Number.isFinite(resource.start)) embed.searchParams.set('start', String(Math.max(0, resource.start)))
    if (Number.isFinite(resource.end)) embed.searchParams.set('end', String(resource.end))
    return embed.href
  } catch { return null }
}

export default function ResourceContent({ resource, onClose }) {
  const [answer, setAnswer] = useState(null)
  const [playing, setPlaying] = useState(false)
  const embed = _videoEmbed(resource)
  const choice = resource.choices?.find(item => item.id === answer)
  const url = _resourceUrl(resource)
  return <div className="resource-content">
    <button type="button" className="resource-close" onClick={onClose} aria-label={`Close ${resource.title}`}>Close</button>
    {resource.image?.src && <img src={resource.image.src} alt={resource.image.alt || ''} />}
    {embed && (playing
      ? <iframe className="resource-video" src={embed} title={resource.title} allow="encrypted-media; fullscreen; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
      : <button type="button" className="resource-video-load" onClick={() => setPlaying(true)}>Load video segment</button>)}
    <p>{resource.body || resource.summary}</p>
    {resource.choices?.length > 0 && <fieldset>
      <legend>Choose an answer</legend>
      {resource.choices.map(item => <button type="button" key={item.id} aria-pressed={answer === item.id}
        onClick={() => setAnswer(item.id)}>{item.text}</button>)}
      {choice && <p role="status">{choice.correct ? 'Correct. ' : 'Try again. '}{resource.answerExplanation}</p>}
    </fieldset>}
    {Number.isFinite(resource.start) && <p className="resource-meta">Segment: {resource.start}s{Number.isFinite(resource.end) ? ` to ${resource.end}s` : ''}</p>}
    {url && <a href={url} target="_blank" rel="noopener noreferrer">{resource.type === 'video' ? 'Watch segment' : 'Open resource'} ↗</a>}
    {resource.source && <p className="resource-meta">{resource.source}{resource.license ? ` · ${resource.license}` : ''}</p>}
  </div>
}
