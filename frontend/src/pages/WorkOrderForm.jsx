import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const WorkOrderForm = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const api = axios.create({ baseURL: 'http://localhost:8000', headers: { Authorization: `Bearer ${token}` }});
  
  const [vehicles, setVehicles] = useState([]);
  const [mechanics, setMechanics] = useState([]);
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({ vehicle_id: '', mechanic_id: '', notes: '' });
  const [items, setItems] = useState([{ service_id: '', quantity: 1, unit_price: 0 }]);

  useEffect(() => {
    api.get('/vehicles').then(r=>setVehicles(r.data));
    api.get('/mechanics').then(r=>setMechanics(r.data));
    api.get('/services').then(r=>setServices(r.data));
  }, []);

  const handleItemChange = (idx, field, val) => {
    const newItems = [...items];
    newItems[idx][field] = val;
    if(field==='service_id') {
        const s = services.find(x=>x.id==val);
        if(s) newItems[idx].unit_price = s.default_price;
    }
    setItems(newItems);
  };

  const addItem = () => setItems([...items, {service_id:'', quantity:1, unit_price:0}]);
  
  const removeItem = (idx) => {
      if(items.length > 1) setItems(items.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try { await api.post('/orders', {...form, items}); navigate('/area'); } catch(e){ alert('Erro ao criar OS'); }
  };

  // Calcula total na hora
  const total = items.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);

  return (
    <div className="card shadow-sm mx-auto" style={{maxWidth: '800px'}}>
        <div className="card-body p-4">
            
            <div className="d-flex align-items-center mb-4 border-bottom pb-3">
                <div className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '50px', height: '50px'}}>
                    <i className="bi bi-tools fs-4"></i>
                </div>
                <div>
                    <h3 className="mb-0 fw-bold">Nova Ordem de Serviço</h3>
                    <small className="text-muted">Abertura de ficha técnica</small>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="row g-3 mb-4">
                    <div className="col-md-6">
                        <label className="form-label fw-bold">Veículo</label>
                        <div className="input-group">
                            <span className="input-group-text bg-light"><i className="bi bi-car-front"></i></span>
                            <select className="form-select" onChange={e=>setForm({...form, vehicle_id:e.target.value})} required>
                                <option value="">Selecione...</option>
                                {vehicles.map(v=><option key={v.id} value={v.id}>{v.plate} - {v.model} ({v.owner_name})</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <label className="form-label fw-bold">Mecânico</label>
                        <div className="input-group">
                            <span className="input-group-text bg-light"><i className="bi bi-person-gear"></i></span>
                            <select className="form-select" onChange={e=>setForm({...form, mechanic_id:e.target.value})}>
                                <option value="">Selecione...</option>
                                {mechanics.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <h5 className="fw-bold mb-3"><i className="bi bi-list-check me-2"></i>Serviços e Peças</h5>
                
                <div className="bg-light p-3 rounded mb-3 border">
                    {items.map((item, i) => (
                        <div key={i} className="row g-2 mb-2 align-items-end">
                            <div className="col-md-5">
                                <label className="small text-muted">Serviço</label>
                                <select className="form-select" onChange={e=>handleItemChange(i,'service_id',e.target.value)} required>
                                    <option value="">Escolha...</option>
                                    {services.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="col-md-2">
                                <label className="small text-muted">Qtd</label>
                                <input type="number" className="form-control" value={item.quantity} min="1" onChange={e=>handleItemChange(i,'quantity',e.target.value)}/>
                            </div>
                            <div className="col-md-3">
                                <label className="small text-muted">Preço (R$)</label>
                                <input type="number" className="form-control" value={item.unit_price} onChange={e=>handleItemChange(i,'unit_price',e.target.value)}/>
                            </div>
                            <div className="col-md-2 text-end">
                                <button type="button" className="btn btn-outline-danger w-100" onClick={() => removeItem(i)} disabled={items.length === 1}>
                                    <i className="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                    ))}
                    
                    <button type="button" className="btn btn-sm btn-outline-primary mt-2" onClick={addItem}>
                        <i className="bi bi-plus-circle me-1"></i> Adicionar Item
                    </button>
                </div>

                <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
                    <h4 className="fw-bold text-dark m-0">
                        Total: <span className="text-success">R$ {total.toFixed(2)}</span>
                    </h4>
                    <button className="btn btn-success btn-lg px-4 shadow-sm">
                        <i className="bi bi-check-lg me-2"></i> Finalizar OS
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
};
export default WorkOrderForm;