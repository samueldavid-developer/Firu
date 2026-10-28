export default function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl text-center space-y-4">
        <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center mx-auto text-2xl font-bold">
          ✓
        </div>
        <h1 className="text-2xl font-bold text-amber-400">Tailwind Funcionando</h1>
        <p className="text-slate-400 text-sm">
          Si ves este cuadro oscuro con bordes redondos y texto amarillo, ¡Tailwind v4 está configurado correctamente!
        </p>
        <button className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-xl transition-all cursor-pointer">
          Continuar
        </button>
      </div>
    </div>
  )
}