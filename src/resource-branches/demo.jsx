import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ResourceBranchesDemo from './ResourceBranchesDemo.jsx'

createRoot(document.querySelector('#root')).render(
  <StrictMode><ResourceBranchesDemo /></StrictMode>,
)
