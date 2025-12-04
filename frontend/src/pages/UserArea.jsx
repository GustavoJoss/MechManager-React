import { useState, useEffect } from 'react';
import axios from 'axios';

const UserArea = () => {
  const [vehicles, setVehicles] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedOS, setSelectedOS] = useState(null);

  const token = localStorage.getItem('token');
  const api = axios.create({ baseURL: 'http://localhost:8000', headers: { Authorization: `Bearer ${token}` } });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    api.get('/users/me').then(r => setIsAdmin(r.data.is_superuser));
    api.get('/vehicles').then(r => setVehicles(r.data));
    api.get('/orders').then(r => setOrders(r.data));
  };

  // CLIENTE: Aprova o orçamento
  const confirmOrder = async (id) => {
    if(!confirm("Deseja aprovar o orçamento e iniciar o serviço?")) return;
    try {
        await api.post(`/orders/${id}/confirm`);
        loadData();
        if (selectedOS) closeModal();
    } catch(e) { alert("Erro ao aprovar."); }
  };

  // ADMIN: Finaliza o serviço
  const finishOrder = async (id) => {
    if(!confirm("O veículo está pronto para retirada?")) return;
    try {
        await api.post(`/orders/${id}/finish`);
        loadData();
    } catch(e) { alert("Erro: Apenas admins podem finalizar."); }
  };

  const handleShowDetails = async (id) => {
      try {
          const res = await api.get(`/orders/${id}`);
          setSelectedOS(res.data);
          setShowModal(true);
      } catch (error) { alert("Erro ao carregar detalhes."); }
  };

  const closeModal = () => { setShowModal(false); setSelectedOS(null); }

  const getStatusBadge = (status, confirmed) => {
      if (!confirmed) return <span className="badge bg-warning text-dark"><i className="bi bi-clock me-1"></i>Aguardando Aprovação</span>;
      
      switch (status) {
          case 'in_progress':
              return <span className="badge bg-primary"><i className="bi bi-tools me-1"></i>Em Andamento</span>;
          case 'completed':
              return <span className="badge bg-success"><i className="bi bi-car-front-fill me-1"></i>Pronto para Retirada</span>;
          default:
              return <span className="badge bg-secondary">{status}</span>;
      }
  };

  return (
    <div className="container">
      <h2 className="h5 mt-4 fw-bold mb-4">
        {isAdmin ? "Painel Administrativo" : "Minha Área"}
      </h2>

      {!isAdmin && (
        <>
          <h3 className="h6 text-muted mb-3">Meus Veículos</h3>
          <div className="row g-3 mb-5">
            {vehicles.map(v => (
                <div key={v.id} className="col-md-4">
                    <div className="card shadow-sm border-start border-4 border-primary h-100">
                        <div className="card-body">
                            <h5 className="card-title fw-bold">{v.make} {v.model}</h5>
                            <p className="card-text text-muted mb-0">{v.plate} • {v.year}</p>
                        </div>
                    </div>
                </div>
            ))}
            {vehicles.length === 0 && <p className="text-muted">Nenhum veículo cadastrado.</p>}
          </div>
        </>
      )}

      <h3 className="h6 text-muted mb-3">Ordens de Serviço {isAdmin ? "(Visão Geral)" : ""}</h3>
      <div className="card shadow-sm border-0">
        <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                    <tr>
                        <th>#</th>
                        {isAdmin && <th>Cliente</th>}
                        <th>Placa</th>
                        <th>Serviço</th>
                        <th>Status</th>
                        <th>Total</th>
                        <th className="text-end" style={{minWidth: '150px'}}>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map(os => (
                        <tr key={os.id}>
                            <td className="fw-bold text-muted">#{os.id}</td>
                            {isAdmin && <td>{os.owner_name}</td>}
                            <td><span className="badge bg-light text-dark border">{os.vehicle_plate}</span></td>
                            <td>{os.title || "Manutenção"}</td>
                            <td>{getStatusBadge(os.status, os.customer_confirmed)}</td>
                            <td className="fw-bold">R$ {os.total.toFixed(2)}</td>
                            <td className="text-end">
                                <button className="btn btn-light btn-sm me-1 text-primary" onClick={() => handleShowDetails(os.id)} title="Ver Detalhes">
                                    <i className="bi bi-eye-fill"></i>
                                </button>
                                
                                {/* BOTÃO CLIENTE: Aprovar Orçamento */}
                                {!os.customer_confirmed && !isAdmin && (
                                    <button className="btn btn-warning btn-sm text-dark" onClick={()=>confirmOrder(os.id)} title="Aprovar Orçamento">
                                        <i className="bi bi-check-lg"></i>
                                    </button>
                                )}

                                {/* BOTÃO ADMIN: Finalizar Serviço (Só aparece se já foi aprovado e não está pronto) */}
                                {isAdmin && os.customer_confirmed && os.status !== 'completed' && (
                                    <button className="btn btn-success btn-sm" onClick={()=>finishOrder(os.id)} title="Marcar como Pronto">
                                        <i className="bi bi-check2-all"></i> Concluir
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                    {orders.length === 0 && <tr><td colSpan="8" className="text-center p-4 text-muted">Nenhuma ordem de serviço.</td></tr>}
                </tbody>
            </table>
        </div>
      </div>

      {/* MODAL DE DETALHES */}
      {showModal && selectedOS && (
        <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}} tabIndex="-1">
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content shadow-lg border-0">
              <div className="modal-header bg-light">
                <h5 className="modal-title fw-bold"><i className="bi bi-receipt me-2"></i>OS #{selectedOS.id}</h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <div className="modal-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h6 className="text-muted small mb-1">Veículo</h6>
                        <h5 className="fw-bold mb-0">{selectedOS.vehicle}</h5>
                    </div>
                    <div className="text-end">
                        <h6 className="text-muted small mb-1">Status Atual</h6>
                        {getStatusBadge(selectedOS.status, selectedOS.customer_confirmed)}
                    </div>
                </div>

                <div className="table-responsive border rounded mb-3">
                    <table className="table table-sm mb-0">
                        <thead className="table-light">
                            <tr><th>Item</th><th className="text-center">Qtd</th><th className="text-end">Unit.</th><th className="text-end">Total</th></tr>
                        </thead>
                        <tbody>
                            {selectedOS.items.map((item, idx) => (
                                <tr key={idx}>
                                    <td>{item.service_name}</td>
                                    <td className="text-center">{item.quantity}</td>
                                    <td className="text-end">R$ {item.unit_price.toFixed(2)}</td>
                                    <td className="text-end">R$ {item.subtotal.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-light">
                            <tr>
                                <td colSpan="3" className="text-end fw-bold pt-3">TOTAL:</td>
                                <td className="text-end fw-bold text-success fs-5 pt-3">R$ {selectedOS.total.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                
                <div className="p-3 bg-light rounded text-muted small">
                    <strong>Observações:</strong> {selectedOS.notes || "Nenhuma observação."}
                </div>
              </div>
              <div className="modal-footer bg-white border-top-0">
                <button type="button" className="btn btn-light" onClick={closeModal}>Fechar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default UserArea;