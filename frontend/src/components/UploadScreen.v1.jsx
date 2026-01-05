import { useState } from 'react';
import { Upload, ArrowRight, LoaderCircle, Camera } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-3">
            Compartilha <span className="text-teal-400">AI</span>
          </h1>
          <p className="text-gray-300 text-lg">
            Divida contas de forma inteligente. Tire uma foto da comanda ou comece manualmente.
          </p>
        </header>

        <main>
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl mb-6">
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center border-2 border-dashed border-teal-400/50 rounded-2xl p-12 text-center hover:border-teal-400 hover:bg-white/5 transition-all cursor-pointer group"
            >
              {preview ? (
                <img src={preview} alt="Pré-visualização" className="object-contain h-40 w-full rounded-lg" />
              ) : (
                <>
                  <div className="bg-gradient-to-br from-teal-500 to-cyan-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Camera className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-white font-semibold text-lg mb-2">Clique para enviar a comanda</p>
                  <p className="text-gray-400 text-sm">PNG, JPG, WEBP (MAX. 10MB)</p>
                </>
              )}
               <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" />
            </label>

            {error && <p className="mt-4 text-center text-sm text-red-400">{error}</p>}

            <button
              onClick={handleScan}
              disabled={!selectedFile || isLoading}
              className="w-full mt-6 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold py-4 rounded-xl hover:from-teal-600 hover:to-cyan-600 transition-all shadow-lg hover:shadow-teal-500/50 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <LoaderCircle className="animate-spin w-5 h-5" />
                  Analisando...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Processar com IA
                </>
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-gray-400 mb-4">OU</p>
            <button
              onClick={onManualStart}
              className="text-white font-semibold hover:text-teal-400 transition-colors flex items-center gap-2 mx-auto border border-white/30 px-6 py-3 rounded-xl hover:border-teal-400"
            >
              <ArrowRight className="w-5 h-5" />
              Iniciar Divisão Manualmente
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}