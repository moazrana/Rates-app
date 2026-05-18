import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import Layout from './components/Layout.jsx'
import App from './App.jsx'
import QuotationsPage from './pages/QuotationsPage.jsx'
import FbrPage from './pages/FbrPage.jsx'
import InventoryPage from './pages/InventoryPage.jsx'
import StorePage from './pages/StorePage.jsx'
import AccountingPage from './pages/accounting/AccountingPage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<App />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="stores" element={<StorePage />} />
          <Route path="quotations" element={<QuotationsPage />} />
          <Route path="fbr" element={<FbrPage />} />
          <Route path="accounting" element={<AccountingPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
