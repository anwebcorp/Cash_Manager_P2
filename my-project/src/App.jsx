import useAuth from './Axioss/useAuth.jsx';
import Login from './Login/Login.jsx';
import Home from './Home/Home.jsx';

export default function App() {
  const { auth } = useAuth();

  if (!auth?.user) {
    return <Login />;
  }

  return <Home />;
}