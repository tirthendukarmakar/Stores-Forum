import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import OwnerDashboard from './components/OwnerDashboard';
import PasswordModal from './components/PasswordModal';

const API_BASE = 'http://localhost:5000/api';

const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  
  * { box-sizing: border-box; margin: 0; padding: 0; }
  
  body { 
    font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; 
    background-color: #f8fafc; 
    color: #0f172a; 
    min-height: 100vh;
    position: relative;
    overflow-x: hidden;
  }

  .particles-canvas {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 0;
  }

  .app-container { 
    max-width: 1240px; 
    margin: 0 auto; 
    padding: 36px 24px; 
    position: relative; 
    z-index: 1; 
  }

  .navbar { 
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
    background: rgba(255, 255, 255, 0.85); 
    backdrop-filter: blur(16px);
    padding: 18px 28px; 
    border-radius: 18px; 
    border: 1px solid rgba(226, 232, 240, 0.85); 
    box-shadow: 0 10px 30px -10px rgba(15, 23, 42, 0.04); 
    margin-bottom: 32px; 
  }

  .user-badge { 
    font-size: 0.75rem; 
    font-weight: 700; 
    padding: 5px 12px; 
    background: linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%); 
    color: #4f46e5; 
    border-radius: 9999px; 
    border: 1px solid #c7d2fe;
    letter-spacing: 0.03em;
    margin-left: 10px;
  }

  .metrics-grid { 
    display: grid; 
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
    gap: 24px; 
    margin-bottom: 32px; 
  }

  .metric-card { 
    background: rgba(255, 255, 255, 0.88); 
    backdrop-filter: blur(14px);
    padding: 26px; 
    border-radius: 18px; 
    border: 1px solid rgba(226, 232, 240, 0.85); 
    box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.03); 
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .metric-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 16px 30px -8px rgba(99, 102, 241, 0.12);
  }
  .metric-card p { font-size: 0.875rem; color: #64748b; font-weight: 600; margin-bottom: 8px; }
  .metric-card h3 { font-size: 2rem; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; }

  .card-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; margin-bottom: 32px; }
  .card { 
    background: rgba(255, 255, 255, 0.92); 
    backdrop-filter: blur(16px);
    padding: 30px; 
    border-radius: 20px; 
    border: 1px solid rgba(226, 232, 240, 0.85); 
    box-shadow: 0 12px 32px -8px rgba(15, 23, 42, 0.04); 
  }
  .card h3 { font-size: 1.15rem; font-weight: 700; margin-bottom: 18px; color: #0f172a; }

  .input-group { margin-bottom: 16px; position: relative; }
  .input-group label { display: block; font-size: 0.8125rem; font-weight: 600; color: #475569; margin-bottom: 6px; }
  input, select { 
    width: 100%; 
    padding: 12px 14px; 
    border: 1px solid #cbd5e1; 
    border-radius: 10px; 
    font-size: 0.875rem; 
    outline: none; 
    background: rgba(255, 255, 255, 0.95); 
    font-family: inherit; 
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }
  input:focus, select:focus { 
    border-color: #6366f1; 
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15); 
  }

  .password-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }
  .password-input-wrapper input {
    padding-right: 42px;
  }
  .password-toggle-btn {
    position: absolute;
    right: 12px;
    background: none;
    border: none;
    color: #64748b;
    cursor: pointer;
    font-size: 1.1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
  }
  .password-toggle-btn:hover {
    color: #4f46e5;
  }

  button { cursor: pointer; font-family: inherit; font-size: 0.875rem; font-weight: 600; border-radius: 10px; border: none; transition: all 0.2s ease; }
  .btn-primary { 
    background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); 
    color: #fff; 
    padding: 12px 20px; 
    width: 100%; 
    margin-top: 6px; 
    box-shadow: 0 4px 14px rgba(79, 70, 229, 0.25);
  }
  .btn-primary:hover { 
    background: linear-gradient(135deg, #4338ca 0%, #4f46e5 100%);
    box-shadow: 0 6px 20px rgba(79, 70, 229, 0.35);
    transform: translateY(-1px);
  }
  .btn-danger { background: #ef4444; color: #fff; padding: 9px 18px; }
  .btn-danger:hover { background: #dc2626; transform: translateY(-1px); }
  .btn-secondary { background: #ffffff; color: #0f172a; border: 1px solid #cbd5e1; padding: 9px 18px; }
  .btn-secondary:hover { background: #f8fafc; border-color: #94a3b8; }

  .table-wrapper { 
    background: rgba(255, 255, 255, 0.92); 
    backdrop-filter: blur(16px);
    border-radius: 20px; 
    border: 1px solid rgba(226, 232, 240, 0.85); 
    overflow: hidden; 
    box-shadow: 0 12px 32px -8px rgba(15, 23, 42, 0.04); 
    margin-bottom: 32px; 
  }
  .table-header-box { padding: 20px 26px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
  table { width: 100%; border-collapse: collapse; text-align: left; }
  th { background: rgba(248, 250, 252, 0.7); color: #64748b; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; padding: 16px 26px; border-bottom: 1px solid #e2e8f0; }
  th.sortable { cursor: pointer; }
  td { padding: 16px 26px; font-size: 0.875rem; border-bottom: 1px solid #f1f5f9; }
  tr:last-child td { border-bottom: none; }
  tr:hover { background: rgba(241, 245, 249, 0.6); }

  .rating-pill { display: inline-flex; gap: 6px; }
  .rating-btn { padding: 6px 11px; font-size: 0.8125rem; border-radius: 8px; border: 1px solid #cbd5e1; background: #ffffff; transition: all 0.15s ease; }
  .rating-btn:hover { border-color: #f59e0b; color: #d97706; }
  .rating-btn.active { background: #fef3c7; color: #b45309; border-color: #fcd34d; font-weight: 700; box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2); }

  .landing-hero {
    min-height: 85vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 40px 24px 72px 24px;
    position: relative;
    z-index: 1;
  }
  .hero-tag {
    display: inline-block;
    background: #eef2ff;
    color: #4f46e5;
    font-size: 0.8125rem;
    font-weight: 700;
    padding: 6px 16px;
    border-radius: 9999px;
    border: 1px solid #c7d2fe;
    margin-bottom: 20px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .hero-title {
    font-size: 3.25rem;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.15;
    max-width: 800px;
    margin-bottom: 18px;
    letter-spacing: -0.02em;
  }
  .hero-title span {
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .hero-subtitle {
    font-size: 1.125rem;
    color: #64748b;
    max-width: 620px;
    line-height: 1.6;
    margin-bottom: 36px;
  }
  .role-cards-container {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
    max-width: 1040px;
    width: 100%;
    margin-top: 20px;
  }
  .role-card {
    background: rgba(255, 255, 255, 0.88);
    backdrop-filter: blur(14px);
    padding: 32px 26px;
    border-radius: 20px;
    border: 1px solid rgba(226, 232, 240, 0.85);
    box-shadow: 0 20px 35px -10px rgba(15, 23, 42, 0.04);
    text-align: left;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
  }
  .role-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 24px 45px -12px rgba(79, 70, 229, 0.16);
    border-color: #c7d2fe;
    background: #ffffff;
  }
  .role-card-badge {
    font-size: 0.75rem;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 6px;
    display: inline-block;
    margin-bottom: 14px;
  }
  .role-admin { background: #fee2e2; color: #dc2626; }
  .role-user { background: #e0e7ff; color: #4338ca; }
  .role-owner { background: #fef3c7; color: #d97706; }

  .auth-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(15, 23, 42, 0.5);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    padding: 20px;
  }
`;

const ParticleBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const colors = ['#818cf8', '#a78bfa', '#f59e0b', '#38bdf8', '#34d399'];
    const particles = Array.from({ length: 45 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2.5 + 1.2,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.5 + 0.3
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(148, 163, 184, ${0.18 * (1 - dist / 130)})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[i].x, particles[i].y);
            ctx.stroke();
          }
        }
      }

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="particles-canvas" />;
};

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [selectedRoleType, setSelectedRoleType] = useState('ALL');

  // Auth Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');

  // Password visibility states
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [showSignupPass, setShowSignupPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // OTP States
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
  }, [token]);

  const openRoleLogin = (role) => {
    setSelectedRoleType(role);
    setIsSignup(false);
    setOtpSent(false);
    setAuthModalOpen(true);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setToken(res.data.token);
      setUser(res.data.user);
      setAuthModalOpen(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Invalid password or credentials');
    }
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return alert('Passwords do not match! Please check and confirm your password.');
    }

    try {
      const res = await axios.post(`${API_BASE}/auth/request-signup-otp`, { name, email, password, address });
      alert(res.data.message || 'OTP generated! Please check your terminal console and email inbox.');
      setOtpSent(true);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to request OTP');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE}/auth/verify-signup-otp`, { email, otp });
      alert(res.data.message || 'Registration verified! You can now log in.');
      setOtpSent(false);
      setIsSignup(false);
      setOtp('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      alert(err.response?.data?.error || 'Invalid OTP');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setToken('');
  };

  return (
    <>
      <style>{globalCSS}</style>
      <ParticleBackground />

      {!user ? (
        <>
          <nav style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 48px', background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(226, 232, 240, 0.8)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '34px', height: '34px', background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)' }}>★</div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Stores Forum</h2>
            </div>
            <button className="btn-primary" style={{ width: 'auto', marginTop: 0 }} onClick={() => openRoleLogin('ALL')}>
              Enter Portal
            </button>
          </nav>

          <section className="landing-hero">
            <div className="hero-tag">Centralized Evaluation & Insights</div>
            <h1 className="hero-title">
              Empowering Store Discoveries & <span>Community Ratings</span>
            </h1>
            <p className="hero-subtitle">
              A unified rating portal tailored for administrators, normal consumers, and store owners with verified insights and real-time metrics.
            </p>

            <div className="role-cards-container">
              <div className="role-card" onClick={() => openRoleLogin('SYSTEM_ADMIN')}>
                <span className="role-card-badge role-admin">Role 1</span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>System Administrator</h3>
                <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5, marginBottom: '16px' }}>
                  Manage platform stores, user accounts, and view global metric analytics.
                </p>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#dc2626' }}>Sign in as Admin →</span>
              </div>

              <div className="role-card" onClick={() => openRoleLogin('NORMAL_USER')}>
                <span className="role-card-badge role-user">Role 2</span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>Normal User</h3>
                <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5, marginBottom: '16px' }}>
                  Explore verified stores, filter locations, and submit or modify ratings.
                </p>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#4f46e5' }}>Login / Register →</span>
              </div>

              <div className="role-card" onClick={() => openRoleLogin('STORE_OWNER')}>
                <span className="role-card-badge role-owner">Role 3</span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>Store Owner</h3>
                <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5, marginBottom: '16px' }}>
                  Track customer feedback, monitor store averages, and view reviewer logs.
                </p>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#d97706' }}>Sign in as Owner →</span>
              </div>
            </div>
          </section>

          {authModalOpen && (
            <div className="auth-overlay">
              <div className="card" style={{ maxWidth: '440px', width: '100%', position: 'relative' }}>
                <button
                  onClick={() => setAuthModalOpen(false)}
                  style={{ position: 'absolute', top: '16px', right: '18px', background: 'transparent', border: 'none', fontSize: '1.25rem', color: '#94a3b8' }}
                >
                  ✕
                </button>

                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '6px' }}>
                    {isSignup ? (otpSent ? 'Enter OTP' : 'Create Account') : 'Stores Forum Login'}
                  </h2>
                  <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '4px' }}>
                    {selectedRoleType !== 'ALL' && <span className="user-badge" style={{ margin: '0 0 6px 0' }}>{selectedRoleType}</span>}
                    <p style={{ marginTop: '4px' }}>
                      {isSignup
                        ? (otpSent ? `Enter the 6-digit OTP sent to ${email}` : 'Sign up to browse and rate registered stores')
                        : 'Sign in to access your dashboard'}
                    </p>
                  </div>
                </div>

                {isSignup ? (
                  !otpSent ? (
                    <form onSubmit={handleRequestOtp}>
                      <div className="input-group">
                        <label>Full Name (20-60 characters)</label>
                        <input value={name} onChange={e => setName(e.target.value)} required />
                      </div>
                      <div className="input-group">
                        <label>Address (Max 400 characters)</label>
                        <input value={address} onChange={e => setAddress(e.target.value)} required />
                      </div>
                      <div className="input-group">
                        <label>Email Address</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                      </div>
                      <div className="input-group">
                        <label>Password (8-16 chars, 1 Uppercase, 1 Special)</label>
                        <div className="password-input-wrapper">
                          <input
                            type={showSignupPass ? 'text' : 'password'}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                          />
                          <button
                            type="button"
                            className="password-toggle-btn"
                            onClick={() => setShowSignupPass(!showSignupPass)}
                            title={showSignupPass ? "Hide password" : "Show password"}
                          >
                            {showSignupPass ? '👁️' : '👁️‍🗨️'}
                          </button>
                        </div>
                      </div>
                      <div className="input-group">
                        <label>Confirm Password</label>
                        <div className="password-input-wrapper">
                          <input
                            type={showConfirmPass ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            required
                          />
                          <button
                            type="button"
                            className="password-toggle-btn"
                            onClick={() => setShowConfirmPass(!showConfirmPass)}
                            title={showConfirmPass ? "Hide password" : "Show password"}
                          >
                            {showConfirmPass ? '👁️' : '👁️‍🗨️'}
                          </button>
                        </div>
                      </div>
                      <button className="btn-primary" type="submit">Send Verification OTP</button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOtp}>
                      <div className="input-group">
                        <label>6-Digit Verification Code</label>
                        <input
                          type="text"
                          maxLength="6"
                          placeholder="e.g. 123456"
                          value={otp}
                          onChange={e => setOtp(e.target.value)}
                          style={{ letterSpacing: '4px', textAlign: 'center', fontSize: '1.25rem', fontWeight: 700 }}
                          required
                        />
                      </div>
                      <button className="btn-primary" type="submit">Verify & Register</button>
                      <button
                        className="btn-secondary"
                        type="button"
                        style={{ width: '100%', marginTop: '8px' }}
                        onClick={() => setOtpSent(false)}
                      >
                        Back to Edit Info
                      </button>
                    </form>
                  )
                ) : (
                  <form onSubmit={handleLogin}>
                    <div className="input-group">
                      <label>Email Address</label>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div className="input-group">
                      <label>Password</label>
                      <div className="password-input-wrapper">
                        <input
                          type={showLoginPass ? 'text' : 'password'}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          className="password-toggle-btn"
                          onClick={() => setShowLoginPass(!showLoginPass)}
                          title={showLoginPass ? "Hide password" : "Show password"}
                        >
                          {showLoginPass ? '👁️' : '👁️‍🗨️'}
                        </button>
                      </div>
                    </div>
                    <button className="btn-primary" type="submit">Sign In</button>
                  </form>
                )}

                <button
                  style={{ marginTop: '16px', background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', width: '100%', fontSize: '0.875rem' }}
                  onClick={() => {
                    setIsSignup(!isSignup);
                    setOtpSent(false);
                    setPassword('');
                    setConfirmPassword('');
                  }}
                >
                  {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="app-container">
          <div className="navbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                {user.name}
              </h2>
              <span className="user-badge">{user.role}</span>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-secondary" onClick={() => setShowPasswordModal(!showPasswordModal)}>
                Change Password
              </button>
              <button className="btn-danger" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>

          {showPasswordModal && <PasswordModal token={token} onClose={() => setShowPasswordModal(false)} />}

          {user.role === 'SYSTEM_ADMIN' && <AdminDashboard token={token} />}
          {user.role === 'NORMAL_USER' && <UserDashboard token={token} />}
          {user.role === 'STORE_OWNER' && <OwnerDashboard token={token} />}
        </div>
      )}
    </>
  );
}