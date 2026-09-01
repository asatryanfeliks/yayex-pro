interface Props {
  currentPage: 'home' | 'dashboard'
  setCurrentPage: (page: 'home' | 'dashboard') => void
}

export default function Header({ currentPage, setCurrentPage }: Props) {
  return (
    <header className="header">
      <div className="logo" onClick={() => setCurrentPage('home')} style={{ cursor: 'pointer' }}>
        YAYEX
      </div>
      <nav>
        <a 
          href="#features"
          onClick={(e) => {
            if (currentPage !== 'home') {
              e.preventDefault()
              setCurrentPage('home')
            }
          }}
        >
          Features
        </a>
        <a href="#compare">Compare</a>
        <a href="#faq">FAQ</a>
        <button 
          className="btn-dashboard"
          onClick={() => setCurrentPage('dashboard')}
        >
          Dashboard
        </button>
      </nav>
    </header>
  )
}