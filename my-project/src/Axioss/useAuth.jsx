
import { useContext } from 'react';
import { AuthContext } from './AuthContextInstance';

const useAuth = () => {
  return useContext(AuthContext);
};

export default useAuth;