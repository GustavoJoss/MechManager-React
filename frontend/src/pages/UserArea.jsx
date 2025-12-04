import { useState, useEffect } from 'react';
import axios from 'axios';

const UserArea = () => {
  const [vehicles, setVehicles] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState(null);
  
  // Modais e Seleções
  const [showModal, setShowModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  
  const [selectedOS, setSelectedOS] = useState(null);
  const [selectedVehicleHistory, setSelectedVehicleHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Rating State
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState("");

  // Upload States
  const [photoDesc, setPhotoDesc] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const token = localStorage.getItem('token');
  const api = axios.create({ baseURL: 'http://localhost:8000', headers: { Authorization: `Bearer ${token}` } });

  useEffect(() => { loadData(); }, []);

  const loadData = () => {
    api.get('/users/me').then(r => {
        setIsAdmin(r.data.is_superuser);
        if(r.data.is_superuser) api.get('/admin/stats').then(s => setStats(s.data));
    });
    api.get('/vehicles').then(r => setVehicles(r.data));
    api.get('/orders').then(r => setOrders(r.data));
  };

  const confirmOrder = async (id) => {
    if(!confirm("Aprovar orçamento?")) return;
    try { await api.post(`/orders/${id}/confirm`); loadData(); if(selectedOS) closeModal(); } catch(e) {}
  };

  const finishOrder = async (id) => {
    if(!confirm("Finalizar serviço?")) return;
    try { await api.post(`/orders/${id}/finish`); loadData(); } catch(e) {}
  };

  const submitRating = async () => {
      try {
          await api.post(`/orders/${selectedOS.id}/rate`, { rating, feedback });
          alert("Obrigado pela avaliação!");
          closeModal();
          loadData();
      } catch(e) { alert("Erro ao avaliar."); }
  };

  const handleShowDetails = async (id) => {
      try {
          const res = await api.get(`/orders/${id}`);
          setSelectedOS(res.data);
          setShowModal(true);
      } catch (error) { alert("Erro ao carregar detalhes."); }
  };

  const handleShowHistory = async (vid) => {
      try {
          const res = await api.get(`/vehicles/${vid}/history`);
          setSelectedVehicleHistory(res.data);
          setShowHistoryModal(true);
      } catch (e) { alert("Erro ao buscar histórico."); }
  };

  const handleUploadPhoto = async (e) => {
      e.preventDefault();
      if(!photoFile) return;
      setUploading(true);
      const fd = new FormData();
      fd.append('photo', photoFile); fd.append('description', photoDesc);
      try {
          await api.post(`/orders/${selectedOS.id}/photos`, fd, { headers: { 'Content-Type': 'multipart/form-data' }});
          handleShowDetails(selectedOS.id);
          setPhotoFile(null); setPhotoDesc("");
      } catch (error) { alert("Erro ao enviar foto."); } finally { setUploading(false); }
  };

  const closeModal = () => { 
      setShowModal(false); setShowHistoryModal(false); setShowRatingModal(false);
      setSelectedOS(null); setPhotoFile(null); setPhotoDesc(""); 
  };

  const getStatusBadge = (status, confirmed) => {
      if (!confirmed) return <span className="badge bg-warning text-dark"><i className="bi bi-clock me-1"></i>Aguardando</span>;
      if (status === 'in_progress') return <span className="badge bg-primary"><i className="bi bi-tools me-1"></i>Em Andamento</span>;
      if (status === 'completed') return <span className="badge bg-success"><i className="bi bi-check-all me-1"></i>Concluído</span>;
      return <span className="badge bg-secondary">{status}</span>;
  };

  const getWhatsappLink = (os) => {
      const text = `Olá ${os.owner_name}! Sua OS #${os.id} (${os.vehicle_plate}) está: ${os.status}. Total: R$ ${os.total.toFixed(2)}`;
      return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  const filteredOrders = orders.filter(os => 
    os.vehicle_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    os.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    os.id.toString().includes(searchTerm)
  );

  return (
    <div className="container">
      <h2 className="h5 mt-4 fw-bold mb-4">{isAdmin ? "Painel Administrativo" : "Minha Área"}</h2>

      {isAdmin && stats && (
        <div className="row g-3 mb-4">
            <div className="col-md-3"><div className="card bg-primary text-white p-3 shadow-sm"><h3>R$ {stats.revenue.toFixed(2)}</h3><small>Receita</small></div></div>
            <div className="col-md-3"><div className="card bg-warning text-dark p-3 shadow-sm"><h3>{stats.pending}</h3><small>Em Andamento</small></div></div>
            <div className="col-md-3"><div className="card bg-white text-dark p-3 shadow-sm border"><h3>{stats.vehicles}</h3><small>Veículos</small></div></div>
            <div className="col-md-3"><div className="card bg-success text-white p-3 shadow-sm"><h3>{stats.rating.toFixed(1)} ⭐</h3><small>Nota Média</small></div></div>
        </div>
      )}

      {!isAdmin && (
        <div className="row g-3 mb-5">
            {vehicles.map(v => (
                <div key={v.id} className="col-md-4">
                    <div className="card shadow-sm border-start border-4 border-primary h-100">
                        <div className="card-body">
                            <div className="d-flex justify-content-between">
                                <h5 className="card-title fw-bold">{v.make} {v.model}</h5>
                                <button className="btn btn-sm btn-outline-secondary" onClick={()=>handleShowHistory(v.id)} title="Histórico"><i className="bi bi-clock-history"></i></button>
                            </div>
                            <p className="card-text text-muted mb-0">{v.plate}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="h6 text-muted mb-0">Ordens de Serviço</h3>
        <div className="input-group" style={{maxWidth: '300px'}}>
            <span className="input-group-text bg-white border-end-0"><i className="bi bi-search text-muted"></i></span>
            <input type="text" className="form-control border-start-0 ps-0" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                    <tr><th>#</th>{isAdmin && <th>Cliente</th>}<th>Placa</th><th>Serviço</th><th>Status</th><th>Total</th><th className="text-end">Ações</th></tr>
                </thead>
                <tbody>
                    {filteredOrders.map(os => (
                        <tr key={os.id}>
                            <td className="fw-bold">#{os.id}</td>
                            {isAdmin && <td>{os.owner_name}</td>}
                            <td><span className="badge bg-light text-dark border">{os.vehicle_plate}</span></td>
                            <td>{os.title}</td>
                            <td>{getStatusBadge(os.status, os.customer_confirmed)}</td>
                            <td className="fw-bold">R$ {os.total.toFixed(2)}</td>
                            <td className="text-end">
                                {isAdmin && <a href={getWhatsappLink(os)} target="_blank" rel="noreferrer" className="btn btn-success btn-sm me-1"><i className="bi bi-whatsapp"></i></a>}
                                <button className="btn btn-light btn-sm me-1 text-primary" onClick={() => handleShowDetails(os.id)} title="Ver Detalhes"><i className="bi bi-eye-fill"></i></button>
                                
                                {/* Botão de Avaliar para Cliente */}
                                {!isAdmin && os.status === 'completed' && !os.rating && (
                                    <button className="btn btn-outline-warning btn-sm me-1" onClick={() => { setSelectedOS(os); setShowRatingModal(true); }}>
                                        <i className="bi bi-star"></i>
                                    </button>
                                )}
                                
                                {!os.customer_confirmed && !isAdmin && <button className="btn btn-warning btn-sm text-dark" onClick={()=>confirmOrder(os.id)}><i className="bi bi-check-lg"></i></button>}
                                {isAdmin && os.customer_confirmed && os.status !== 'completed' && <button className="btn btn-primary btn-sm" onClick={()=>finishOrder(os.id)} title="Finalizar"><i className="bi bi-check2-all"></i></button>}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      {/* --- MODAL DETALHES --- */}
      {showModal && selectedOS && (
        <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}} tabIndex="-1">
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content shadow-lg border-0">
              <div className="modal-header bg-light"><h5 className="modal-title fw-bold">OS #{selectedOS.id}</h5><button className="btn-close" onClick={closeModal}></button></div>
              <div className="modal-body p-4">
                <div className="d-flex justify-content-between mb-3">
                    <div><small className="text-muted">Veículo</small><h5 className="fw-bold">{selectedOS.vehicle}</h5></div>
                    <div className="text-end"><small className="text-muted">Mecânico</small><h5 className="fw-bold">{selectedOS.mechanic}</h5></div>
                </div>
                
                {selectedOS.rating && (
                    <div className="alert alert-warning d-flex align-items-center">
                        <i className="bi bi-star-fill me-2 fs-4"></i>
                        <div><strong>Avaliação do Cliente ({selectedOS.rating}/5):</strong><br/>{selectedOS.feedback}</div>
                    </div>
                )}

                <div className="table-responsive border rounded mb-4">
                    <table className="table table-sm mb-0">
                        <thead className="table-light"><tr><th>Item</th><th className="text-center">Qtd</th><th className="text-end">Unit.</th><th className="text-end">Total</th></tr></thead>
                        <tbody>{selectedOS.items.map((item, idx) => (<tr key={idx}><td>{item.service_name}</td><td className="text-center">{item.quantity}</td><td className="text-end">R$ {item.unit_price.toFixed(2)}</td><td className="text-end">R$ {item.subtotal.toFixed(2)}</td></tr>))}</tbody>
                        <tfoot className="bg-light"><tr><td colSpan="3" className="text-end fw-bold pt-2">TOTAL:</td><td className="text-end fw-bold text-success fs-5 pt-2">R$ {selectedOS.total.toFixed(2)}</td></tr></tfoot>
                    </table>
                </div>
                <h6 className="fw-bold mb-3 border-bottom pb-2">Acompanhamento</h6>
                <div className="row g-3 mb-4">
                    {selectedOS.photos && selectedOS.photos.map(p => (<div key={p.id} className="col-4"><div className="card h-100 shadow-sm"><a href={p.photo_url} target="_blank" rel="noreferrer"><img src={p.photo_url} className="card-img-top" style={{height:'150px', objectFit:'cover'}}/></a><div className="card-body p-2"><p className="small text-muted mb-0">{p.description}</p></div></div></div>))}
                </div>
                {isAdmin && (
                    <div className="bg-light p-3 rounded border no-print">
                        <h6 className="fw-bold small mb-2 text-primary">Adicionar Foto</h6>
                        <form onSubmit={handleUploadPhoto} className="row g-2 align-items-center">
                            <div className="col-5"><input type="file" className="form-control form-control-sm" required accept="image/*" onChange={e => setPhotoFile(e.target.files[0])} /></div>
                            <div className="col-5"><input type="text" className="form-control form-control-sm" placeholder="Descrição" value={photoDesc} onChange={e => setPhotoDesc(e.target.value)} /></div>
                            <div className="col-2"><button className="btn btn-primary btn-sm w-100" disabled={uploading}>Enviar</button></div>
                        </form>
                    </div>
                )}
              </div>
              <div className="modal-footer bg-white">
                <button className="btn btn-outline-dark me-auto" onClick={() => window.print()}><i className="bi bi-printer me-2"></i>Imprimir</button>
                <button className="btn btn-light" onClick={closeModal}>Fechar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL HISTÓRICO VEÍCULO --- */}
      {showHistoryModal && (
        <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0">
                <div className="modal-header"><h5 className="modal-title">Histórico de Manutenção</h5><button className="btn-close" onClick={closeModal}></button></div>
                <div className="modal-body p-0">
                    <ul className="list-group list-group-flush">
                        {selectedVehicleHistory.length > 0 ? selectedVehicleHistory.map((h, i) => (
                            <li key={i} className="list-group-item p-3">
                                <div className="d-flex justify-content-between mb-1">
                                    <strong className="text-primary">{new Date(h.date).toLocaleDateString()}</strong>
                                    {h.rating && <span className="text-warning"><i className="bi bi-star-fill"></i> {h.rating}</span>}
                                </div>
                                <div className="text-dark fw-bold">{h.items}</div>
                                <small className="text-muted">Mecânico: {h.mechanic}</small>
                            </li>
                        )) : <div className="p-4 text-center text-muted">Nenhum histórico encontrado.</div>}
                    </ul>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL AVALIAÇÃO --- */}
      {showRatingModal && (
        <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0">
                <div className="modal-header"><h5 className="modal-title">Avaliar Serviço</h5><button className="btn-close" onClick={closeModal}></button></div>
                <div className="modal-body p-4 text-center">
                    <div className="mb-3">
                        {[1,2,3,4,5].map(star => (
                            <i key={star} className={`bi bi-star-fill fs-1 mx-1 cursor-pointer ${star <= rating ? 'text-warning' : 'text-secondary'}`} 
                               style={{cursor: 'pointer'}} onClick={() => setRating(star)}></i>
                        ))}
                    </div>
                    <textarea className="form-control" rows="3" placeholder="Deixe um comentário..." value={feedback} onChange={e => setFeedback(e.target.value)}></textarea>
                </div>
                <div className="modal-footer"><button className="btn btn-success w-100" onClick={submitRating}>Enviar Avaliação</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default UserArea;