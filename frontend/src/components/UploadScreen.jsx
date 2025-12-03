import { useState } from 'react';
import { Upload, ArrowRight, LoaderCircle, Camera, Sparkles } from 'lucide-react';
import api from '../services/api';

export default function UploadScreen({ onScanComplete, onManualStart }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('Arquivo muito grande (máx 10MB).');
        return;
      }
      setSelectedFile(file);
      setError('');
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleScan = async () => {
    if (!selectedFile) {
      setError("Selecione um arquivo para escanear.");
      return;
    }
    setIsLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await api.post('/api/scan-comanda', formData);
      const data = response.data;

      if (data.success && data.itens.length > 0) {
        onScanComplete(data.itens);
      } else {
        setError('Não foi possível extrair itens. Tente uma imagem mais nítida.');
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Erro ao escanear:", err);
      setError('Ocorreu um erro ao processar. Tente novamente ou inicie a divisão manualmente.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-teal-900 to-cyan-900 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-72 h-72 bg-teal-500 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-500 rounded-full filter blur-3xl"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-teal-400" />
            <h1 className="text-4xl sm:text-5xl font-bold text-white">
              Compartilha <span className="text-teal-400">AI</span>
            </h1>
            <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400" />
          </div>
          <p className="text-gray-300 text-base sm:text-lg px-4">
            Divida contas de forma inteligente. Tire uma foto da comanda ou comece manualmente.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-teal-400/30 shadow-2xl shadow-teal-500/20 mb-6 hover:border-teal-400/50 transition-all">
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center border-2 border-dashed border-teal-400/60 rounded-2xl p-8 sm:p-12 text-center hover:border-teal-400 hover:bg-teal-500/10 transition-all cursor-pointer group relative overflow-hidden active:scale-95"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/0 to-cyan-500/0 group-hover:from-teal-500/10 group-hover:to-cyan-500/10 transition-all"></div>
            <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" />
            
            <div className="relative z-10">
              {preview ? (
                <img src={preview} alt="Pré-visualização" className="object-contain h-40 w-full rounded-lg mx-auto" />
              ) : (
                <>
                  <div className="bg-gradient-to-br from-teal-500 to-cyan-500 w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all shadow-lg shadow-teal-500/50">
                    <Camera className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                  </div>
                  <p className="text-white font-bold text-lg sm:text-xl mb-2">Clique para enviar a comanda</p>
                  <p className="text-gray-400 text-sm">PNG, JPG, WEBP (MAX. 10MB)</p>
                  <div className="mt-3 sm:mt-4 flex items-center justify-center gap-2 text-teal-400 text-xs sm:text-sm">
                    <Sparkles className="w-4 h-4" />
                    <span>IA vai extrair os itens automaticamente</span>
                  </div>
                </>
              )}
            </div>
          </label>

          {error && <p className="mt-4 text-center text-sm text-red-400">{error}</p>}

          <button
            onClick={handleScan}
            disabled={!selectedFile || isLoading}
            className="w-full mt-6 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold py-4 rounded-xl hover:from-teal-600 hover:to-cyan-600 transition-all shadow-lg hover:shadow-teal-500/50 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group active:scale-95"
          >
            {isLoading ? (
              <>
                <LoaderCircle className="animate-spin w-5 h-5" />
                Analisando...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 group-hover:translate-y-[-2px] transition-transform" />
                Processar com IA
              </>
            )}
          </button>
        </div>

        <div className="text-center">
          <p className="text-gray-400 mb-4 font-semibold text-sm sm:text-base">OU</p>
          <button
            onClick={onManualStart}
            className="text-white font-semibold hover:text-teal-400 transition-colors flex items-center gap-2 mx-auto border-2 border-white/30 px-5 py-3 sm:px-6 sm:py-3 rounded-xl hover:border-teal-400 hover:bg-teal-400/10 group text-sm sm:text-base active:scale-95"
          >
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            Iniciar Divisão Manualmente
          </button>
        </div>
      </div>
    </div>
  );
}
