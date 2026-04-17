import { Link } from 'react-router-dom';

function PublicNavbar() {
  return (
    <nav>
      <div className="container nav-container">
        <Link to="/" className="nav-logo">
          <img
            src="https://vemu.org/images/logo.png"
            alt="VEMU Logo"
            style={{ height: '50px' }}
          />
          <span>
            VEMU <span style={{ color: 'var(--accent-copper)' }}>Library</span>
          </span>
        </Link>

        <ul className="nav-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/about-library">About Library</Link></li>
          <li><Link to="/digital-library">Digital Resources</Link></li>
        </ul>

        <Link to="/login" className="btn btn-primary">Login</Link>
      </div>
    </nav>
  );
}

export default PublicNavbar;