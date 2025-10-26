import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import './css/App.css'

function App() {
  // useEffect(() => {
  //   const loadCount = async () => {
  //     // try {
  //     //   // const res = await fetch('http://localhost:3000/');
  //     // } catch (err) {
  //     //   console.error('Error fetching count:', err);
  //     // }
  //   };

  //   loadCount();
  // }, [count]);
  console.log(localStorage.getItem("token"));
  console.log(localStorage.getItem("googleId"));
  console.log(localStorage.getItem("googleName"));

  return (
    <BrowserRouter>
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm py-3">
        <div className="container">
          <NavLink className="navbar-brand fw-bold text-purple" to="/">
            MyApp
          </NavLink>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <NavLink className="nav-link text-purple-hover" to="/">
                  Home
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link text-purple-hover" to="/login">
                  Login
                </NavLink>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <main className="container py-5">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
