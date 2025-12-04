import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const VehicleForm = () => {
  const [form, setForm] = useState({ plate: '', make: '', model: '', year: 2025, notes: '', owner_id: '' });
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const api = axios.create({ baseURL: 'http://localhost:8000', headers: { Authorization: `Bearer ${token}` }});

  useEffect(() => {
    // Carrega usuários para o admin selecionar o dono
    api.get('/users').then(r => setUsers(r.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        await api.post('/vehicles', form);
        navigate('/area');
    } catch(e) { alert('Erro ao salvar. Verifique se é admin.'); }
  };

  return (
    <div className="card shadow-sm mx-auto" style={{maxWidth: '700px'}}>
      <div className="card-body p-4">
        
        <div className="d-flex align-items-center mb-4">
            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '50px', height: '50px'}}>
                <i className="bi bi-car-front-fill fs-4"></i>
            </div>
            <div>
                <h3 className="mb-0 fw-bold">Novo Veículo</h3>
                <small className="text-muted">Preencha os dados do automóvel</small>
            </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="row g-3">
             {/* Select de Dono */}
             <div className="col-12">
                <label className="form-label fw-bold">Cliente (Dono)</label>
                <div className="input-group">
                    <span className="input-group-text bg-light"><i className="bi bi-person-fill"></i></span>
                    <select className="form-select" onChange={e=>setForm({...form, owner_id:e.target.value})} required>
                        <option value="">Selecione o Cliente...</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.username} ({u.email})</option>)}
                    </select>
                </div>
             </div>

             {/* Placa e Ano */}
             <div className="col-md-6">
                <label className="form-label">Placa</label>
                <div className="input-group">
                    <span className="input-group-text bg-light"><i className="bi bi-card-heading"></i></span>
                    <input type="text" className="form-control" placeholder="ABC-1234" onChange={e=>setForm({...form, plate:e.target.value})} required/>
                </div>
             </div>
             <div className="col-md-6">
                <label className="form-label">Ano</label>
                <div className="input-group">
                    <span className="input-group-text bg-light"><i className="bi bi-calendar-event"></i></span>
                    <input type="number" className="form-control" placeholder="2025" onChange={e=>setForm({...form, year:e.target.value})} required/>
                </div>
             </div>

             {/* Marca e Modelo */}
             <div className="col-md-6">
                <label className="form-label">Marca</label>
                <div className="input-group">
                    <span className="input-group-text bg-light"><i className="bi bi-tags-fill"></i></span>
                    <input type="text" className="form-control" placeholder="Ex: Fiat" onChange={e=>setForm({...form, make:e.target.value})} required/>
                </div>
             </div>
             <div className="col-md-6">
                <label className="form-label">Modelo</label>
                <div className="input-group">
                    <span className="input-group-text bg-light"><i className="bi bi-car-front"></i></span>
                    <input type="text" className="form-control" placeholder="Ex: Uno Mille" onChange={e=>setForm({...form, model:e.target.value})} required/>
                </div>
             </div>

             {/* Notas */}
             <div className="col-12">
                <label className="form-label">Observações</label>
                <div className="input-group">
                    <span className="input-group-text bg-light"><i className="bi bi-pencil"></i></span>
                    <textarea className="form-control" rows="3" placeholder="Detalhes adicionais..." onChange={e=>setForm({...form, notes:e.target.value})}/>
                </div>
             </div>
          </div>

          <div className="d-grid mt-4">
            <button className="btn btn-custom btn-lg shadow-sm">
                <i className="bi bi-save me-2"></i> Salvar Veículo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default VehicleForm;