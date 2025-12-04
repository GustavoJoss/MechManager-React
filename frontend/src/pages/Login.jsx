import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);
    try {
      // 1. Pega o Token
      const res = await axios.post('http://localhost:8000/token', params);
      const token = res.data.access_token;
      localStorage.setItem('token', token);

      // 2. Verifica se é Admin imediatamente
      const userRes = await axios.get('http://localhost:8000/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (userRes.data.is_superuser) {
        localStorage.setItem('isAdmin', 'true');
      } else {
        localStorage.removeItem('isAdmin');
      }

      navigate('/area');
    } catch (err) { alert('Erro no login.'); }
  };

  return (
    <div className="d-flex justify-content-center align-items-center" style={{minHeight: '80vh'}}>
      <div className="card shadow-lg border-0" style={{maxWidth: '420px', width: '100%'}}>
        <div className="card-body p-4">
          <h1 className="h4 fw-bold text-center mb-3">Entrar</h1>
          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label className="form-label">Usuário</label>
              <input className="form-control" onChange={e => setUsername(e.target.value)} />
            </div>
            <div className="mb-3">
              <label className="form-label">Senha</label>
              <input type="password" class="form-control" onChange={e => setPassword(e.target.value)} />
            </div>
            <button className="btn btn-custom w-100 btn-lg">Entrar</button>
          </form>
        </div>
      </div>
    </div>
  );
};
export default Login;