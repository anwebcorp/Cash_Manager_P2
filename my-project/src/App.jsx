import { Routes, Route } from 'react-router-dom';
import useAuth from './Axioss/useAuth.jsx';
import Login from './Login/Login.jsx';
import WrongLogin from './Login/WrongLogin.jsx';
import Home from './Home/Home.jsx';

export default function App() {
  const { auth } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/wronglogin" element={<WrongLogin />} />
      <Route path="/" element={auth?.user ? <Home /> : <Login />} />
      <Route path="*" element={auth?.user ? <Home /> : <Login />} />
    </Routes>
  );
}