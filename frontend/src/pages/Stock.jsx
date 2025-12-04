import { useState, useEffect } from 'react';
import axios from 'axios';

const Stock = () => {
  const [services, setServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const token = localStorage.getItem('token');
  const api = axios.create({ baseURL: 'http://localhost:8000', headers: { Authorization: `Bearer ${token}` }});

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = () => {
    api.get('/services').then(r => setServices(r.data));
  };

  const updateStock = async (id, newStock) => {
      if (newStock < 0) return;
      try {
          await api.put(`/services/${id}/stock`, { stock: newStock });
          // Atualiza localmente
          setServices(services.map(s => s.id === id ? { ...s, stock: newStock } : s));
      } catch (error) {
          alert("Erro ao atualizar estoque.");
      }
  };

  const filtered = services.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold"><i className="bi bi-boxes me-2"></i>Controle de Estoque</h2>
        <div className="input-group" style={{maxWidth: '300px'}}>
            <span className="input-group-text bg-white"><i className="bi bi-search"></i></span>
            <input className="form-control" placeholder="Buscar peça..." onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                    <tr>
                        <th>Serviço/Peça</th>
                        <th>Categoria</th>
                        <th>Preço</th>
                        <th className="text-center" style={{width: '200px'}}>Estoque</th>
                    </tr>
                </thead>
                <tbody>
                    {filtered.map(s => (
                        <tr key={s.id}>
                            <td className="fw-bold">{s.name}</td>
                            <td><span className="badge bg-light text-dark border">{s.category}</span></td>
                            <td>R$ {s.default_price.toFixed(2)}</td>
                            <td className="text-center">
                                <div className="input-group input-group-sm">
                                    <button className="btn btn-outline-danger" onClick={() => updateStock(s.id, s.stock - 1)}>-</button>
                                    <input type="number" className="form-control text-center fw-bold" value={s.stock} readOnly />
                                    <button className="btn btn-outline-success" onClick={() => updateStock(s.id, s.stock + 1)}>+</button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};
export default Stock;