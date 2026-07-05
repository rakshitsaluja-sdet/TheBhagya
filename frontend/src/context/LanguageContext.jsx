import { createContext, useContext, useState, useEffect } from 'react'

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(
    () => localStorage.getItem('bhagya-lang') || 'en'
  )

  useEffect(() => {
    localStorage.setItem('bhagya-lang', lang)
  }, [lang])

  const toggle = () => setLang(l => l === 'en' ? 'hi' : 'en')

  return (
    <LanguageContext.Provider value={{ lang, toggle, isHindi: lang === 'hi' }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
