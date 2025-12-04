import { Link } from 'react-router-dom';

const Home = () => {
  return (
    // Removi 'bg-light' daqui. Agora o fundo é transparente e mostra o gradiente do body
    <div className="d-flex justify-content-center align-items-center" style={{minHeight: '100vh'}}>
      <div className="text-center">
        <h1 className="fw-bold mb-2 display-5 text-dark">MechManager</h1>
        <p className="text-muted mb-4 fs-6">
          Gerencie seus veículos e ordens de serviço de forma simples, moderna e profissional.
        </p>

        <div className="card shadow border-0 mx-auto" style={{maxWidth: '380px'}}>
          <div className="card-body p-4">
            <h5 className="card-title mb-3 fw-semibold">Bem-vindo!</h5>
            <p className="text-secondary small mb-4">
              Entre ou crie uma conta para começar.
            </p>

            <div className="d-grid gap-2">
              <Link to="/login" className="btn btn-custom btn-lg">
                 Entrar
              </Link>
              <Link to="/signup" className="btn btn-outline-custom btn-lg">
                 Cadastrar
              </Link>
            </div>
          </div>
        </div>
        
        <p className="text-muted small mt-4 mb-0">&copy; 2025 MechManager</p>
      </div>
    </div>
  );
};
export default Home;