import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js'; // Garante JS do Bootstrap
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import UserArea from './pages/UserArea';
import WorkOrderForm from './pages/WorkOrderForm';
import VehicleForm from './pages/VehicleForm';
import Profile from './pages/Profile';
import ProfileEdit from './pages/ProfileEdit';
import Stock from './pages/Stock';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div className="container mt-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/area" element={<PrivateRoute><UserArea /></PrivateRoute>} />
          <Route path="/new-vehicle" element={<PrivateRoute><VehicleForm /></PrivateRoute>} />
          <Route path="/new-order" element={<PrivateRoute><WorkOrderForm /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/profile/edit" element={<PrivateRoute><ProfileEdit /></PrivateRoute>} />
          <Route path="/stock" element={<PrivateRoute><Stock /></PrivateRoute>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
export default App;