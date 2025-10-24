import "../css/Login.module.css"

function Login() {
  return (
    <div className="col-md-6 mx-auto mt-5">
      <div className="card shadow-sm p-4 border-0">
        <h3 className="text-center text-purple mb-4">Login</h3>
        <form>
          <div className="mb-3">
            <label className="form-label">Email address</label>
            <input type="email" className="form-control" />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input type="password" className="form-control" />
          </div>
          <button className="btn btn-purple w-100">Login</button>
        </form>
      </div>
    </div>
  );
}

export default Login;
