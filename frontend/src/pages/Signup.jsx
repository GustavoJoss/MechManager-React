import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Signup = () => {
  const [formData, setFormData] = useState({ 
    username: '', 
    email: '', 
    phone: '', 
    password: '' 
  });
  
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await axios.post('http://localhost:8000/signup', formData);
      alert('Conta criada com sucesso! Faça login.');
      navigate('/login');
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 400) {
        setError("Este usuário já existe.");
      } else {
        setError("Erro ao cadastrar. Tente novamente.");
      }
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center" style={{minHeight: '100vh'}}>
      <div className="card shadow-lg border-0" style={{maxWidth: '500px', width: '100%'}}>
        <div className="card-body p-4">
          <div className="text-center mb-3">
            <h1 className="h4 fw-bold mb-1">Criar conta</h1>
            <p className="text-muted mb-0">Leva menos de um minuto</p>
          </div>
          
          {error && <div className="alert alert-danger">{error}</div>}
          
          <form onSubmit={handleSignup}>
            <div className="mb-3">
              <label className="form-label">Usuário</label>
              <input 
                className="form-control" 
                required 
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value})} 
              />
            </div>

            <div className="mb-3">
              <label className="form-label">E-mail (opcional)</label>
              <input 
                type="email" 
                className="form-control" 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})} 
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Telefone</label>
              <input 
                type="text" 
                className="form-control" 
                required 
                placeholder="(XX) XXXXX-XXXX"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})} 
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Senha</label>
              <input 
                type="password" 
                className="form-control" 
                required 
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})} 
              />
            </div>

            <div className="d-grid mt-4">
              <button className="btn btn-custom btn-lg">Cadastrar</button>
            </div>
            
            <div className="text-center mt-3">
               <button type="button" className="btn btn-link text-decoration-none" onClick={() => navigate('/login')}>
                 Já tem uma conta? Entrar
               </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;