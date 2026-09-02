interface Props {
  currentPage: 'home' | 'dashboard' | 'login' | 'signup' | 'trading' | 'challenges'
  setCurrentPage: (page: 'home' | 'dashboard' | 'login' | 'signup' | 'trading' | 'challenges') => void
  onLogout: () => void
}

export default function Header({ setCurrentPage, onLogout }: Props) {
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
          className="btn-dashboard"
          onClick={() => setCurrentPage('trading')}
        >
          Trading
        </button>
        <button 
          className="btn-dashboard"
          onClick={() => setCurrentPage('challenges')}
        >
          Challenges
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