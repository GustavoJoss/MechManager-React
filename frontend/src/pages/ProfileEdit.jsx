import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ProfileEdit = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [user, setUser] = useState({ bio: '', phone: '', email: '', username: '' });
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:8000/users/me', { headers: { Authorization: `Bearer ${token}` }})
      .then(res => { setUser(res.data); if(res.data.photo) setPreview(res.data.photo); });
  }, []);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if(f) { setPhoto(f); setPreview(URL.createObjectURL(f)); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('bio', user.bio); fd.append('phone', user.phone); fd.append('email', user.email);
    if (photo) fd.append('photo', photo);
    try {
      await axios.put('http://localhost:8000/users/me/profile', fd, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }});
      navigate('/profile');
    } catch(e) { alert("Erro"); }
  };

  return (
    <div className="card shadow-sm mx-auto mt-4" style={{maxWidth: '600px'}}>
      <div className="card-body p-4">
        <h3 className="mb-4">Editar Perfil</h3>
        <form onSubmit={handleSubmit}>
          <div className="text-center mb-4">
            <div className="avatar-stack">
                <img src={preview || "https://via.placeholder.com/150"} className="profile-avatar" />
                <label className="profile-edit-btn" htmlFor="up"><i className="bi bi-camera-fill"></i></label>
                <input id="up" type="file" className="d-none" onChange={handleFile} />
            </div>
          </div>
          <div className="mb-3"><label>Bio</label><textarea className="form-control" value={user.bio} onChange={e=>setUser({...user, bio:e.target.value})}/></div>
          <div className="mb-3"><label>Telefone</label><input className="form-control" value={user.phone} onChange={e=>setUser({...user, phone:e.target.value})}/></div>
          <div className="mb-3"><label>Email</label><input className="form-control" value={user.email} onChange={e=>setUser({...user, email:e.target.value})}/></div>
          <button className="btn btn-success">Salvar</button>
        </form>
      </div>
    </div>
  );
};
export default ProfileEdit;