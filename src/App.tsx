import { Route, Routes } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Home } from '@/pages/Home'
import { About } from '@/pages/About'
import { ServicesOverview } from '@/pages/services/ServicesOverview'
import { ErpSolutions } from '@/pages/services/ErpSolutions'
import { WebDevelopment } from '@/pages/services/WebDevelopment'
import { Industries } from '@/pages/Industries'
import { Products } from '@/pages/Products'
import { Contact } from '@/pages/Contact'
import { NotFound } from '@/pages/NotFound'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="services" element={<ServicesOverview />} />
        <Route path="services/erp-solutions" element={<ErpSolutions />} />
        <Route path="services/web-development" element={<WebDevelopment />} />
        <Route path="industries" element={<Industries />} />
        <Route path="products" element={<Products />} />
        <Route path="contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App
