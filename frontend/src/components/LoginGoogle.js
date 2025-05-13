const LoginGoogle = () => {
    const handleLogin = () => {
      window.location.href = "http://localhost:5000/auth/google";
    };
  
    return <button onClick={handleLogin}>Iniciar sesión con Google</button>;
  };
  
  export default LoginGoogle;
  