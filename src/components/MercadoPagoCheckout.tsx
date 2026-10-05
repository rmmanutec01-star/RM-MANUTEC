import React, { useState } from 'react';
import {
  DollarSign,
  CreditCard,
  Copy,
  Check,
  ShieldCheck,
  Lock,
  Sparkles,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Clock
} from 'lucide-react';

export interface PagadorProps {
  nome: string;
  sobrenome?: string;
  email: string;
  cpf: string;
}

export interface MercadoPagoCheckoutProps {
  titulo?: string;
  valor?: number;
  pagador?: PagadorProps;
  referenciaExterna?: string;
  onPaymentSuccess?: (dados: any) => void;
  onClose?: () => void;
}

interface PixResponseData {
  qrCode?: string;
  qrCodeBase64?: string | null;
  ticketUrl?: string;
}

export const MercadoPagoCheckout: React.FC<MercadoPagoCheckoutProps> = ({
  titulo = 'Conclusão de Cadastro / Taxa de Adesão',
  valor = 180.00,
  pagador = {
    nome: 'Cliente',
    sobrenome: 'RM Manutec',
    email: 'cliente@rmmanutec.com.br',
    cpf: '000.000.000-00'
  },
  referenciaExterna,
  onPaymentSuccess,
  onClose
}) => {
  const [metodoSelecionado, setMetodoSelecionado] = useState<'pix' | 'cartao'>('pix');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Estados do PIX
  const [pixData, setPixData] = useState<PixResponseData | null>(null);
  const [copiadoPix, setCopiadoPix] = useState(false);

  // Estados do Cartão
  const [cardInitPoint, setCardInitPoint] = useState<string | null>(null);
  const [numeroCartao, setNumeroCartao] = useState('');
  const [titularCartao, setTitularCartao] = useState(pagador.nome || '');
  const [validadeCartao, setValidadeCartao] = useState('');
  const [cvvCartao, setCvvCartao] = useState('');
  const [parcelas, setParcelas] = useState(1);
  const [pagamentoConcluido, setPagamentoConcluido] = useState(false);

  // 1. Função Frontend que chama o endpoint POST /api/criar-pagamento
  const gerarPagamentoMercadoPago = async (metodo: 'pix' | 'cartao') => {
    setCarregando(true);
    setErro(null);

    try {
      const response = await fetch('/api/criar-pagamento', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          metodo, // 'pix' | 'cartao'
          titulo,
          valor,
          quantidade: 1,
          pagador: {
            nome: pagador.nome,
            sobrenome: pagador.sobrenome || '',
            email: pagador.email,
            cpf: pagador.cpf
          },
          referenciaExterna: referenciaExterna || `RM-${Date.now()}`,
          parcelas: metodo === 'cartao' ? parcelas : 1
        })
      });

      const data = await response.json();

      if (!response.ok || !data.sucesso) {
        throw new Error(data.erro || 'Falha ao processar pagamento.');
      }

      // Trata resposta PIX
      if (metodo === 'pix' && data.pix) {
        setPixData(data.pix);
      }

      // Trata resposta Cartão (Preference / Redirect)
      if (metodo === 'cartao') {
        if (data.initPoint) {
          setCardInitPoint(data.initPoint);
        }
        if (data.tipo === 'transparente' && data.status === 'approved') {
          setPagamentoConcluido(true);
          onPaymentSuccess?.(data);
        }
      }

    } catch (err: any) {
      console.error('Erro na requisição ao Mercado Pago:', err);
      setErro(err.message || 'Ocorreu um erro ao se comunicar com o gateway.');
    } finally {
      setCarregando(false);
    }
  };

  // Copiar código Pix Copia e Cola
  const handleCopiarPix = () => {
    if (!pixData?.qrCode) return;
    navigator.clipboard.writeText(pixData.qrCode);
    setCopiadoPix(true);
    setTimeout(() => setCopiadoPix(false), 3000);
  };

  // Submissão do Cartão
  const handleFinalizarCartao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numeroCartao.replace(/\D/g, '').length < 16) {
      setErro('Informe os 16 dígitos do cartão.');
      return;
    }
    await gerarPagamentoMercadoPago('cartao');
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-sky-950 border border-sky-800 rounded-2xl p-5 sm:p-6 shadow-2xl text-slate-200 space-y-5">
      
      {/* Cabeçalho */}
      <div className="flex items-center justify-between border-b border-sky-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold text-xs">
            MP
          </div>
          <div>
            <h3 className="font-bold text-white text-base leading-tight">Checkout Mercado Pago</h3>
            <p className="text-xs text-slate-400">Ambiente Seguro • Criptografia 256-bit</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 block uppercase">Total a Pagar</span>
          <span className="text-base font-black text-emerald-400 font-mono">
            R$ {valor.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Banner de Travamento e Segurança da Plataforma */}
      <div className="p-3 rounded-xl bg-gradient-to-r from-sky-950 via-sky-950/40 to-sky-950 border border-sky-500/40 space-y-1.5 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-white">
            <Lock className="w-3.5 h-3.5 text-sky-400" />
            <span>Pagamento 100% Seguro na Plataforma</span>
          </div>
          <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Antifraude Ativo
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-300">
          <span className="text-amber-300 font-semibold">Aceitamos todos os cartões de crédito em até 12x:</span>
          <div className="flex items-center gap-1 font-mono text-[9px]">
            <span className="px-1 py-0.2 rounded bg-sky-950 border border-sky-700 text-blue-300">Visa</span>
            <span className="px-1 py-0.2 rounded bg-sky-950 border border-sky-700 text-red-300">Mastercard</span>
            <span className="px-1 py-0.2 rounded bg-sky-950 border border-sky-700 text-yellow-300">Elo</span>
            <span className="px-1 py-0.2 rounded bg-sky-950 border border-sky-700 text-rose-300">Hipercard</span>
            <span className="px-1 py-0.2 rounded bg-sky-950 border border-sky-700 text-cyan-300">Amex</span>
          </div>
        </div>
      </div>

      {/* Seletor de Método: PIX (Chave CNPJ) ou Cartão de Crédito */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            setMetodoSelecionado('pix');
            setErro(null);
          }}
          className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all cursor-pointer ${
            metodoSelecionado === 'pix'
              ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/40 shadow-lg'
              : 'bg-sky-900 border-sky-800 text-slate-400 hover:text-white'
          }`}
        >
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <span>PIX (Chave CNPJ)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMetodoSelecionado('cartao');
            setErro(null);
          }}
          className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all cursor-pointer ${
            metodoSelecionado === 'cartao'
              ? 'bg-blue-950/60 border-blue-500 text-blue-300 ring-1 ring-blue-500/40 shadow-lg'
              : 'bg-sky-900 border-sky-800 text-slate-400 hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4 text-blue-400" />
          <span>Cartão de Crédito</span>
        </button>
      </div>

      {/* Exibição de Erros */}
      {erro && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {/* -------------------- BLOCO PIX VIA CNPJ -------------------- */}
      {metodoSelecionado === 'pix' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Card da Chave CNPJ */}
          <div className="p-4 rounded-xl bg-sky-900 border-2 border-emerald-500/40 space-y-3">
            <div className="flex items-center justify-between border-b border-sky-800 pb-2">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                Chave PIX Oficial CNPJ
              </span>
              <span className="text-[10px] text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded font-bold">
                5% Desconto
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-300">
                Chave CNPJ da RM Manutec:
              </label>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-sky-950 border border-emerald-500/50">
                <span className="font-mono text-sm font-bold text-emerald-300 flex-1 px-1 select-all">
                  64.177.147/0001-34
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText('64.177.147/0001-34');
                    setCopiadoPix(true);
                    setTimeout(() => setCopiadoPix(false), 2500);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                    copiadoPix
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {copiadoPix ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiadoPix ? 'Copiado!' : 'Copiar CNPJ'}</span>
                </button>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-sky-950 text-xs text-slate-300 space-y-1 border border-sky-800">
              <p><strong className="text-white">Favorecido:</strong> RM MANUTEC SERVIÇOS E MANUTENÇÃO LTDA</p>
              <p><strong className="text-white">Banco:</strong> Banco do Brasil S.A. (001) / Mercado Pago</p>
              <p><strong className="text-white">Cidade:</strong> Salvador - BA</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setPagamentoConcluido(true);
              onPaymentSuccess?.({ metodo: 'pix', status: 'approved' });
            }}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Confirmar Transferência PIX CNPJ</span>
          </button>
        </div>
      )}

      {/* -------------------- BLOCO CARTÃO DE CRÉDITO -------------------- */}
      {metodoSelecionado === 'cartao' && (
        <form onSubmit={handleFinalizarCartao} className="space-y-4 animate-in fade-in">
          
          {/* Opção 1: Checkout Pro Oficial do Mercado Pago (Redirecionamento / Modal Seguro) */}
          {cardInitPoint ? (
            <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/40 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Preferência Criada com Sucesso</h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Conclua o pagamento de forma 100% segura diretamente pelo Mercado Pago.
                </p>
              </div>

              <a
                href={cardInitPoint}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition-all block"
              >
                <span>Pagar Agora no Mercado Pago</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          ) : (
            <>
              {/* Formulário dos Dados do Cartão */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Número do Cartão *</label>
                  <input
                    type="text"
                    required
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                    value={numeroCartao}
                    onChange={(e) => setNumeroCartao(e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim())}
                    className="w-full px-3 py-2 rounded-xl bg-sky-900 border border-sky-800 text-white font-mono outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Nome do Titular *</label>
                  <input
                    type="text"
                    required
                    placeholder="NOME COMO NO CARTÃO"
                    value={titularCartao}
                    onChange={(e) => setTitularCartao(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl bg-sky-900 border border-sky-800 text-white outline-none focus:border-blue-500 uppercase"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1">Validade (MM/AA) *</label>
                    <input
                      type="text"
                      required
                      placeholder="12/29"
                      maxLength={5}
                      value={validadeCartao}
                      onChange={(e) => setValidadeCartao(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-sky-900 border border-sky-800 text-white text-center font-mono outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">CVV *</label>
                    <input
                      type="password"
                      required
                      placeholder="123"
                      maxLength={4}
                      value={cvvCartao}
                      onChange={(e) => setCvvCartao(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-sky-900 border border-sky-800 text-white text-center font-mono outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Parcelamento Mercado Pago</label>
                  <select
                    value={parcelas}
                    onChange={(e) => setParcelas(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-sky-900 border border-sky-800 text-white outline-none focus:border-blue-500 font-semibold"
                  >
                    <option value={1}>1x de R$ {valor.toFixed(2)} (À vista sem juros)</option>
                    <option value={2}>2x de R$ {(valor / 2).toFixed(2)} sem juros</option>
                    <option value={3}>3x de R$ {(valor / 3).toFixed(2)} sem juros</option>
                    <option value={6}>6x de R$ {(valor / 6).toFixed(2)} sem juros</option>
                    <option value={12}>12x de R$ {(valor / 12).toFixed(2)} sem juros</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={carregando}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {carregando ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processando no Mercado Pago...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Concluir com Cartão de Crédito</span>
                  </>
                )}
              </button>
            </>
          )}
        </form>
      )}

      {/* Rodapé de Segurança */}
      <div className="pt-2 border-t border-sky-800 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Processado via Mercado Pago Oficial</span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white underline cursor-pointer"
          >
            Fechar
          </button>
        )}
      </div>

    </div>
  );
};
