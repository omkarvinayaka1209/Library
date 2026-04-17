import { Link } from 'react-router-dom';
import PublicNavbar from '../../components/common/PublicNavbar';
import PublicFooter from '../../components/common/PublicFooter';
import { useLibraryState } from '../../services/LibraryStateContext';

function HomePage() {
  const { state, loading, error } = useLibraryState();

  return (
    <>
      {/* <PublicNavbar /> */}

      <section className="hero">
        <div className="container hero-content">
          <h1>
            Welcome to <span>VEMU Library</span>
          </h1>

          <p>
            A smart digital library system designed for students, faculty,
            librarians, and administrators with real-time management features.
          </p>

          {/* MongoDB Data Test */}
          {loading ? <p>Loading MongoDB data...</p> : null}
          {error ? <p>{error}</p> : null}
          {!loading && !error ? (
            <p>
              Books: {state.books.length} | Users: {state.users.length}
            </p>
          ) : null}

          <div style={{ marginTop: '20px' }}>
            <Link to="/login" className="btn btn-primary">
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* <PublicFooter /> */}
    </>
  );
}

export default HomePage;