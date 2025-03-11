import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Intro = () => {
    const [fadeOut, setFadeOut] = useState(false);
    const navigate = useNavigate();

    const handleStart = () => {
        setFadeOut(true); // Inicia a animação de saída
        setTimeout(() => {
            navigate("/login"); // Redireciona após a animação
        }, 1000); // Tempo da animação (1s)
    };

    return (
        <div className={`flex flex-col items-center justify-center h-screen bg-blue-500 transition-opacity duration-1000 ${fadeOut ? "opacity-0" : "opacity-100"}`}>
            <h1 className="text-4xl font-bold text-white mb-4 animate-bounce">Bem-vindo(a) à Fofura de Pelo!</h1>
            <button 
                onClick={handleStart} 
                className="bg-white text-blue-500 px-6 py-2 text-xl font-semibold rounded-lg shadow-lg transition-transform transform hover:scale-105"
            >
                Entrar
            </button>
        </div>
    );
};

export default Intro;
