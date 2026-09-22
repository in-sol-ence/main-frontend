import TimeCounter from './TimeCounter.jsx'
import { COUNT_END } from './timeline.js'

// [time] [=] [coefficient][N] as separate pieces, anchored on "=" so only the
// right-hand side grows. The display row is the same equation set in the
// editorial italic face; the timeline crossfades into it in place.
export default function TimeEquation({ coefficient }) {
  return <div className="tc-equation">
    <div className="tc-equation-row tc-upright">
      <span className="tc-time">time</span>
      <span className="tc-equals">=</span>
      <span className="tc-rhs"><TimeCounter value={coefficient} /><span className="tc-variable">N</span></span>
    </div>
    <div className="tc-equation-row tc-display">
      <span className="tc-time">time</span>
      <span className="tc-equals">=</span>
      <span className="tc-rhs">{COUNT_END}N</span>
    </div>
  </div>
}
