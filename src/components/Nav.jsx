import { Link, NavLink } from 'react-router-dom'
import { useStore } from '../store/AppStore'
import { ROLE_COLOR, initials, shortAddr } from '../lib/format'
import { Logo } from './Icons'
import './nav.css'

const menuFor = (role) => {
  if (role === 'Admin') {
    return [
      ['/admin', 'Dashboard'],
      ['/bukti', 'Barang bukti'],
      ['/verifikasi', 'Verifikasi'],
      ['/kasus', 'Kasus'],
      ['/pengguna', 'Pengguna'],
      ['/log', 'Log aktivitas'],
      ['/profil', 'Profil'],
    ]
  }
  const items = [
    ['/', 'Dashboard'],
    ['/bukti', 'Barang bukti'],
    ['/registrasi', 'Registrasi'],
    ['/verifikasi', 'Verifikasi'],
    ['/kasus', 'Kasus'],
    ['/profil', 'Profil'],
  ]
  return role === 'Penyidik' ? items : items.filter(([to]) => to !== '/registrasi')
}

export default function Nav() {
  const { me } = useStore()

  return (
    <header className="nav">
      <div className="nav-left">
        <Link to="/" className="brand">
          <Logo />
          <span>evichain</span>
        </Link>
        <nav className="menu">
          {menuFor(me.role).map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/' || to === '/admin'}>
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="nav-right">
        <span className="nav-chip">
          <span className="dot" style={{ background: 'var(--green)' }} />
          Sepolia
        </span>
        <span className="nav-chip">
          <span className="dot" style={{ background: ROLE_COLOR[me.role] }} />
          {me.role}
          <span className="mono muted">{shortAddr(me.wallet)}</span>
        </span>
        <Link to="/profil" className="nav-avatar" title={me.name}>
          {initials(me.name)}
        </Link>
      </div>
    </header>
  )
}
