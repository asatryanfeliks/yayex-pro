interface Props {
  currentPage: 'home' | 'dashboard' | 'login' | 'signup' | 'trading' | 'challenges' | 'admin'
  setCurrentPage: (page: 'home' | 'dashboard' | 'login' | 'signup' | 'trading' | 'challenges' | 'admin') => void
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
          CChallenges
</button>
<button 
  className="btn-dashboard"
  onClick={() => setCurrentPage('admin')}
>
  Admin
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