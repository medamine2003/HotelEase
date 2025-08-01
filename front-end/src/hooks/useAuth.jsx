// ce hook facilite l'utilisation de auth context
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export function useAuth() {
  return useContext(AuthContext);
}
