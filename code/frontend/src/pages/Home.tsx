import '../css/Home.module.css';

function Home() {
  return (
    <div className="text-center">
      <h1 className="display-5 fw-bold text-purple mb-3">Welcome Home {localStorage.getItem('googleName')}</h1>
      <p className="lead text-muted mb-4">
        This is your dashboard — clean, simple, and modern.
      </p>
      <button className="btn btn-purple px-4 py-2 rounded-pill">
        Get Started
      </button>
    </div>
  );
}

export default Home;