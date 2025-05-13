import { useState } from "react";
import API from "../services/api";

const TransactionList = () => {
  const [transactions, setTransactions] = useState([]);
  const [tokens] = useState(null); // no uso useTokens aún

  const handleFetch = async () => {
    const res = await API.post("/read-emails", { tokens });
    setTransactions(res.data);
  };

  return (
    <div>
      <button onClick={handleFetch}>Leer correos</button>
      <ul>
        {transactions.map((t) => (
          <li key={t.id}>Movimiento: S/{t.monto}</li>
        ))}
      </ul>
    </div>
  );
};

export default TransactionList;
