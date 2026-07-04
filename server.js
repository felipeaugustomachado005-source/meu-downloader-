const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/download', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ success: false, error: 'A URL é obrigatória.' });
    }

    try {
        // Nova URL de API pública mais estável (ou use uma chave do RapidAPI em produção)
        const apiUrl = `https://api.rest7.com/v1/instagram_downloader?url=${encodeURIComponent(url)}`;
        
        const response = await fetch(apiUrl, { signal: AbortSignal.timeout(8000) }); // Timeout de 8 segundos
        
        if (!response.ok) {
            throw new Error(`API respondeu com status ${response.status}`);
        }

        const data = await response.json();

        // Tratamento seguro para evitar o erro 500 se o objeto vier vazio ou diferente
        if (data && typeof data === 'object') {
            const finalUrl = data.url || data.download_url || (data.links && data.links[0]?.url);
            
            if (finalUrl) {
                return res.json({ success: true, downloadUrl: finalUrl });
            }
        }
        
        return res.status(400).json({ success: false, error: 'Não foi possível extrair a mídia deste link. Verifique se o post é público.' });

    } catch (error) {
        console.error('Erro detalhado no servidor:', error.message);
        // Retorna um JSON amigável em vez de quebrar a requisição com erro 500
        return res.status(200).json({ 
            success: false, 
            error: 'O servidor de extração está instável no momento. Tente novamente em alguns segundos.' 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor ativo na porta ${PORT}`);
});
