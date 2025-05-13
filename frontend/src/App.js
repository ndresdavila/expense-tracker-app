import LoginGoogle from "./components/LoginGoogle";
import TransactionList from "./components/TransactionList";

function App() {
  return (
    <div className="container mt-4">
      <h2>Gestor de Gastos</h2>
      <LoginGoogle />
      <TransactionList />
    </div>
  );
}

export default App;
