import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Hero from './components/Hero'
import WhyUs from './components/WhyUs'
import Process from './components/Process'
import Niche from './components/Niche'
import Pricing from './components/Pricing'
import AuditForm from './components/AuditForm'
import Footer from './components/Footer'
import Admin from './pages/Admin'
import { ContentProvider } from './context/ContentContext'

const LandingPage = () => (
  <>
    <Header />
    <main>
      <Hero />
      <WhyUs />
      <Process />
      <Niche />
      <Pricing />
      <AuditForm />
    </main>
    <Footer />
  </>
);

function App() {
  return (
    <ContentProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </BrowserRouter>
    </ContentProvider>
  )
}

export default App
