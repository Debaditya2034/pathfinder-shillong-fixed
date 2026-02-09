import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOutUser } from '../lib/auth';
import { useAuth } from '../contexts/AuthContext';

function Logout() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const handleLogout = async () => {
      if (user) {
        try {
          await signOutUser();
        } catch (error) {
          console.error('Error signing out:', error);
        }
      }
      navigate('/login');
    };

    handleLogout();
  }, [user, navigate]);

  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <p>Logging out...</p>
    </div>
  );
}

export default Logout;
