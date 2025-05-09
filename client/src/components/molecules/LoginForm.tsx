import React, { useState } from "react";
import Button from "../atoms/Button";
import Checkbox from "../atoms/Checkbox";
import Input from "../atoms/Input";
//import { useLoginMutation } from "../api/endpoints/authSlice";
//import { useNavigate } from "react-router-dom";

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [keepLoggedIn, setKeepLoggedIn] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [login, { isLoading }] = useLoginMutation();
  const navigate = useNavigate(); 

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    } else {
      try {
        const response = await login({ email, password }).unwrap();
        console.log(response);

        
        navigate('/modules');
      } catch (err: any) {
        setError('Une erreur est survenue');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 border border-gray-200 rounded-lg shadow-md">
      <h1 className='text-2xl text-center font-semibold mb-2'>Login</h1>

      <Input
        label="Email"
        placeholder="Entrez votre email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <Input
        label="Mot de passe"
        placeholder="Entrez votre mot de passe"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <div className="my-4">
        <Checkbox
          checked={keepLoggedIn}
          label="Keep me logged in"
          onChange={(e) => setKeepLoggedIn(e.target.checked)}
        />
      </div>

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

      <Button
        label={isLoading ? "Chargement..." : "Se connecter"}
        onClick={handleSubmit}
        disabled={isLoading}
      />

      <p className="mt-4 text-center">Mot de passe oublié? <a href="#" className="text-blue-500 hover:underline">Réinitialiser</a></p>
    </form>
  );
};

export default LoginForm;
