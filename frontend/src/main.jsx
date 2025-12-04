import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

import 'bootstrap/dist/css/bootstrap.min.css' // CSS (já estava aqui)
import 'bootstrap/dist/js/bootstrap.bundle.min.js' // <--- ADICIONE ESTA LINHA (JS)
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)