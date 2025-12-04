import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Profile = () => {
  const [user, setUser] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    axios.get('http://localhost:8000/users/me', { headers: { Authorization: `Bearer ${token}` }})
         .then(r => setUser(r.data));
  }, []);

  if (!user) return <div>Carregando...</div>;

  return (
    <div className="d-flex justify-content-center mt-4">
      <div className="card shadow-sm border-0" style={{maxWidth: '600px', width: '100%'}}>
        <div className="card-body p-5 text-center">
            <div className="avatar-stack mb-3">
                {user.photo ? <img src={user.photo} className="profile-avatar"/> : <div className="profile-avatar bg-primary text-white d-flex align-items-center justify-content-center fs-1">{user.username[0].toUpperCase()}</div>}
            </div>
            <h2 className="fw-bold">{user.username}</h2>
            <p className="text-muted">{user.email} | {user.phone}</p>
            <p>{user.bio || "Sem biografia"}</p>
            <Link to="/profile/edit" className="btn btn-outline-custom mt-3">Editar Perfil</Link>
        </div>
      </div>
    </div>
  );
};
export default Profile;