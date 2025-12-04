import { useState, useEffect } from 'react';
import axios from 'axios';

const UserArea = () => {
  const [vehicles, setVehicles] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const token = localStorage.getItem('token');
  const api = axios.create({ baseURL: 'http://localhost:8000', headers: { Authorization: `Bearer ${token}` } });

  useEffect(() => {
    // Verifica se é admin
    api.get('/users/me').then(r => setIsAdmin(r.data.is_superuser));

    api.get('/vehicles').then(r => setVehicles(r.data));
    api.get('/orders').then(r => setOrders(r.data));
  }, []);

  const confirmOrder = async (id) => {
    if(!confirm("Confirmar serviço?")) return;
    await api.post(`/orders/${id}/confirm`);
    setOrders(orders.map(o => o.id === id ? {...o, customer_confirmed: true} : o));
  };

  return (
    <div>
      <h2 className="h5 mt-4">
        {isAdmin ? "Painel Administrativo" : "Minha Área"}
      </h2>

      {/* Se for admin, não precisa ver lista de veículos simples no topo, foca nas OS */}
      {!isAdmin && (
        <>
          <h3 className="h6 mt-3">Meus Veículos</h3>
          <ul className="list-group mb-4 shadow-sm">
            {vehicles.map(v => <li key={v.id} className="list-group-item"><strong>{v.plate}</strong> - {v.model}</li>)}
          </ul>
        </>
      )}

      <h3 className="h6">Ordens de Serviço {isAdmin ? "(Geral)" : ""}</h3>
      <table className="table table-striped shadow-sm bg-white">
        <thead>
            <tr>
                <th>#</th>
                {isAdmin && <th>Cliente</th>} {/* Coluna Extra para Admin */}
                <th>Placa</th>
                <th>Serviço</th>
                <th>Total</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            {orders.map(os => (
                <tr key={os.id}>
                    <td>{os.id}</td>
                    {isAdmin && <td>{os.owner_name}</td>}
                    <td>{os.vehicle_plate}</td>
                    <td>{os.title || "Vários serviços"}</td>
                    <td>R$ {os.total.toFixed(2)}</td>
                    <td>
                        {os.customer_confirmed ? 
                            <span className="badge bg-secondary">Confirmado</span> : 
                            <button className="btn btn-success btn-sm" onClick={()=>confirmOrder(os.id)}>Confirmar</button>
                        }
                    </td>
                </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};
export default UserArea;