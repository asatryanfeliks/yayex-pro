interface Props {
  currentPage: 'home' | 'dashboard' | 'login' | 'signup'
  setCurrentPage: (page: 'home' | 'dashboard' | 'login' | 'signup') => void
  onLogout: () => void
}

export default function Header({ currentPage, setCurrentPage, onLogout }: Props) {
  return (
    <header className="header">
      <div className="logo" onClick={() => setCurrentPage('home')} style={{ cursor: 'pointer' }}>
        YAYEX
      </div>
      <nav>
        <button 
          className="btn-dashboard"
          onClick={() => setCurrentPage('dashboard')}
        >
          Dashboard
        </button>
        <button 
          className="btn-logout"
          onClick={onLogout}
        >
          Logout
        </button>
      </nav>
    </header>
  )
}