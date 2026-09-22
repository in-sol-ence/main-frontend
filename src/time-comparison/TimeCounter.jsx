// The coefficient slot between "=" and N. Its width is tweened by the timeline,
// so a new numeral opens space and pushes N right instead of jumping the line.
// The hidden probe measures one tabular digit in the live font.
export default function TimeCounter({ value }) {
  return <span className="tc-coefficient">
    <span className="tc-digits">{value ?? ''}</span>
    <span className="tc-probe">0</span>
  </span>
}
