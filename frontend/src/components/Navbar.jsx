import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const [userPhoto, setUserPhoto] = useState(null);
  const [userInitials, setUserInitials] = useState('');

  useEffect(() => {
    if (token) {
        axios.get('http://localhost:8000/users/me', { headers: { Authorization: `Bearer ${token}` } })
             .then(r => {
                 setUserPhoto(r.data.photo);
                 setUserInitials(r.data.username ? r.data.username.charAt(0).toUpperCase() : 'U');
             }).catch(() => {});
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin');
    navigate('/login');
  }

  if (['/', '/login', '/signup'].includes(location.pathname)) return null;

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm px-3 py-2 mb-4 sticky-top">
      <div className="container-fluid">
        <Link className="navbar-brand fw-bold text-dark d-flex align-items-center" to="/area">
            <i className="bi bi-gear-wide-connected text-primary fs-4 me-2"></i>Oficina
        </Link>
        <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContent"><span className="navbar-toggler-icon"></span></button>
        <div className="collapse navbar-collapse" id="navbarContent">
          <div className="ms-auto d-flex align-items-center gap-3">
            {token ? (
              <>
                {isAdmin && (
                 <div className="d-flex gap-2">
                   <Link className="btn btn-light btn-sm rounded-circle shadow-sm" to="/new-vehicle" title="Novo Veículo" style={{width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><i className="bi bi-car-front-fill text-success fs-5"></i></Link>
                   <Link className="btn btn-light btn-sm rounded-circle shadow-sm" to="/new-order" title="Nova OS" style={{width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><i className="bi bi-file-earmark-plus-fill text-primary fs-5"></i></Link>
                   <Link className="btn btn-light btn-sm rounded-circle shadow-sm" to="/stock" title="Estoque" style={{width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><i className="bi bi-boxes text-warning fs-5"></i></Link>
                 </div>
                )}
                <div className="dropdown">
                  <a href="#" className="d-flex align-items-center text-decoration-none dropdown-toggle hide-arrow" id="profileDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                    {userPhoto ? <img src={userPhoto} className="rounded-circle border border-2 border-light shadow-sm" style={{width: '42px', height: '42px', objectFit: 'cover'}} /> : <div className="rounded-circle bg-dark text-white d-flex align-items-center justify-content-center shadow-sm" style={{width: '42px', height: '42px', fontWeight: 'bold'}}>{userInitials}</div>}
                  </a>
                  <ul className="dropdown-menu dropdown-menu-end shadow border-0" aria-labelledby="profileDropdown">
                    <li><Link className="dropdown-item" to="/area"><i className="bi bi-grid-fill me-2"></i>Minha Área</Link></li>
                    <li><Link className="dropdown-item" to="/profile"><i className="bi bi-person-circle me-2"></i>Meu Perfil</Link></li>
                    {isAdmin && <li><Link className="dropdown-item" to="/stock"><i className="bi bi-boxes me-2"></i>Estoque</Link></li>}
                    <li><hr className="dropdown-divider" /></li>
                    <li><button className="dropdown-item text-danger" onClick={handleLogout}><i className="bi bi-box-arrow-right me-2"></i>Sair</button></li>
                  </ul>
                </div>
              </>
            ) : (<div className="d-flex gap-2"><Link className="btn btn-outline-custom" to="/login">Entrar</Link><Link className="btn btn-custom" to="/signup">Cadastrar</Link></div>)}
          </div>
        </div>
      </div>
    </nav>
  );
};
export default Navbar;