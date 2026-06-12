import React, { useState, useEffect, useRef } from 'react';
import {
  X, ArrowLeft, ArrowRight, CreditCard, Smartphone, Globe,
  Wallet, Clock, CheckCircle,
} from 'lucide-react';
import { PaymentMethod, PaymentStep } from '../types';
import { TranslationKey } from '../constants';
import { formatCardNumber, formatExpiry, delay } from '../utils';

interface Props {
  isOpen: boolean;
  isDarkMode: boolean;
  t: (key: TranslationKey) => string;
  /** Called with the transaction ID once the payment succeeds (before the user closes). */
  onPaymentComplete: (transactionId: string) => void;
  /** Called when the modal should be removed from the DOM (user clicked Continue on success or X). */
  onClose: () => void;
}

const PAYMENT_METHODS: { id: Exclude<PaymentMethod, null>; icon: React.ReactNode; label: string }[] = [
  { id: 'card',     icon: <CreditCard size={26} />, label: 'Card'       },
  { id: 'blik',     icon: <Smartphone size={26} />, label: 'BLIK'       },
  { id: 'gpay',     icon: <Globe      size={26} />, label: 'Google Pay' },
  { id: 'applepay', icon: <Wallet     size={26} />, label: 'Apple Pay'  },
];

const PaymentModal: React.FC<Props> = ({
  isOpen,
  isDarkMode,
  t,
  onPaymentComplete,
  onClose,
}) => {
  const [step, setStep]           = useState<PaymentStep>('method');
  const [method, setMethod]       = useState<PaymentMethod>(null);
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName]   = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv]     = useState('');
  const [blikCode, setBlikCode]   = useState('');
  const [blikTimer, setBlikTimer] = useState(120);
  const [progress, setProgress]   = useState(0);
  const [statusMsg, setStatusMsg] = useState('');
  const [txId, setTxId]           = useState('');
  const blikInputRef              = useRef<HTMLInputElement>(null);

  // Reset all local state whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('method'); setMethod(null);
      setCardNumber(''); setCardName(''); setCardExpiry(''); setCardCvv('');
      setBlikCode(''); setBlikTimer(120);
      setProgress(0); setStatusMsg(''); setTxId('');
    }
  }, [isOpen]);

  // BLIK countdown — runs only while the BLIK details screen is visible
  useEffect(() => {
    if (!isOpen || method !== 'blik' || step !== 'details') return;
    setBlikTimer(120);
    const iv = setInterval(() => setBlikTimer((n) => (n <= 1 ? 0 : n - 1)), 1000);
    return () => clearInterval(iv);
  }, [isOpen, method, step]);

  // Auto-focus hidden BLIK input
  useEffect(() => {
    if (step === 'details' && method === 'blik') {
      setTimeout(() => blikInputRef.current?.focus(), 50);
    }
  }, [step, method]);

  const handleSimulate = async () => {
    if (!method) return;
    setStep('processing');
    setProgress(0);

    const steps: { msg: TranslationKey; pct: number }[] = [
      { msg: 'paymentConnecting',  pct: 30  },
      { msg: 'paymentAuthorizing', pct: 65  },
      { msg: 'paymentFinalizing',  pct: 100 },
    ];

    for (const s of steps) {
      setStatusMsg(t(s.msg));
      await delay(950);
      setProgress(s.pct);
    }
    await delay(400);

    const generated =
      'TXN-' +
      Math.random().toString(36).slice(2, 8).toUpperCase() +
      '-' +
      Date.now().toString(36).slice(-4).toUpperCase();

    setTxId(generated);
    onPaymentComplete(generated);
    setStep('success');
  };

  const canClose = step !== 'processing';

  const handleClose = () => {
    if (canClose) onClose();
  };

  const cardValid =
    cardNumber.replace(/\s/g, '').length >= 16 &&
    cardName.trim().length > 0 &&
    cardExpiry.length >= 5 &&
    cardCvv.length >= 3;

  if (!isOpen) return null;

  const dark = isDarkMode;
  const inputCls = `w-full px-5 py-3.5 rounded-2xl border outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all ${
    dark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
  }`;
  const panelCls = `w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border ${
    dark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
  }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className={panelCls}>

        {/* ── Step: method ──────────────────────────────────────────────── */}
        {step === 'method' && (
          <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black">{t('paymentMethod')}</h2>
              <button onClick={handleClose} className="p-2 hover:bg-slate-500/10 rounded-xl opacity-40 hover:opacity-100 transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="text-center py-3">
              <p className="text-4xl font-black text-indigo-500">17 PLN</p>
              <p className="text-[10px] opacity-40 font-black uppercase tracking-widest mt-1">{t('feeNotice')}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 font-bold text-sm transition-all ${
                    method === m.id
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-500 scale-[1.03]'
                      : dark
                        ? 'border-slate-700 hover:border-indigo-500/50 hover:scale-[1.02]'
                        : 'border-slate-200 hover:border-indigo-300 hover:scale-[1.02]'
                  }`}
                >
                  {m.icon}
                  {m.label}
                </button>
              ))}
            </div>

            <p className="text-center text-xs opacity-30">{t('selectMethod')}</p>

            <button
              onClick={() => setStep('details')}
              disabled={!method}
              className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2"
            >
              Continue <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* ── Step: details — Card ───────────────────────────────────────── */}
        {step === 'details' && method === 'card' && (
          <div className="p-8 space-y-5">
            <div className="flex items-center gap-3">
              <button onClick={() => setStep('method')} className="p-2 hover:bg-slate-500/10 rounded-xl opacity-40 hover:opacity-100 transition-all">
                <ArrowLeft size={18} />
              </button>
              <h2 className="text-xl font-black">Card Details</h2>
            </div>

            {/* Visual card preview */}
            <div className="bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl p-5 text-white select-none">
              <div className="flex justify-between items-center mb-5">
                <div className="flex">
                  <div className="w-6 h-6 rounded-full bg-red-500 opacity-80" />
                  <div className="w-6 h-6 rounded-full bg-yellow-400 opacity-80 -ml-2" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">DEBIT</span>
              </div>
              <p className="font-mono text-xl tracking-[0.15em] mb-4 opacity-90">
                {cardNumber || '•••• •••• •••• ••••'}
              </p>
              <div className="flex justify-between text-xs">
                <span className="font-bold opacity-70">{cardName || 'CARDHOLDER NAME'}</span>
                <span className="font-mono opacity-70">{cardExpiry || 'MM/YY'}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase opacity-40 block mb-1.5 tracking-widest">{t('payCardNumber')}</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  maxLength={19}
                  className={`${inputCls} font-mono tracking-widest`}
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase opacity-40 block mb-1.5 tracking-widest">{t('payCardName')}</label>
                <input
                  type="text"
                  placeholder="JAN KOWALSKI"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value.toUpperCase())}
                  className={`${inputCls} uppercase`}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase opacity-40 block mb-1.5 tracking-widest">{t('payCardExpiry')}</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                    maxLength={5}
                    className={`${inputCls} font-mono`}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase opacity-40 block mb-1.5 tracking-widest">{t('payCardCvv')}</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    placeholder="•••"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    maxLength={4}
                    className={`${inputCls} font-mono`}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleSimulate}
              disabled={!cardValid}
              className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20"
            >
              {t('payNow')}
            </button>
          </div>
        )}

        {/* ── Step: details — BLIK ──────────────────────────────────────── */}
        {step === 'details' && method === 'blik' && (
          <div className="p-8 space-y-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setStep('method')} className="p-2 hover:bg-slate-500/10 rounded-xl opacity-40 hover:opacity-100 transition-all">
                <ArrowLeft size={18} />
              </button>
              <h2 className="text-xl font-black">BLIK</h2>
            </div>

            <div className={`text-center p-5 rounded-2xl ${dark ? 'bg-slate-800' : 'bg-slate-50'}`}>
              <Smartphone size={36} className="mx-auto mb-2 text-indigo-500" />
              <p className="text-sm opacity-60">{t('blikEnter')}</p>
              <p className="text-2xl font-black text-indigo-500 mt-1">17.00 PLN</p>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase opacity-40 block mb-3 tracking-widest text-center">
                {t('blikCode')}
              </label>
              {/* 6-box code display with an invisible overlay input */}
              <div
                className="relative flex justify-center gap-2 cursor-text"
                onClick={() => blikInputRef.current?.focus()}
              >
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`w-12 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-black select-none transition-all ${
                      blikCode[i]
                        ? dark
                          ? 'border-indigo-500 bg-indigo-900/30 text-indigo-300'
                          : 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : blikCode.length === i
                          ? 'border-indigo-400 border-dashed animate-pulse'
                          : dark
                            ? 'border-slate-700'
                            : 'border-slate-200'
                    }`}
                  >
                    {blikCode[i] ? '•' : ''}
                  </div>
                ))}
                <input
                  ref={blikInputRef}
                  type="tel"
                  value={blikCode}
                  onChange={(e) => setBlikCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full"
                  maxLength={6}
                  autoComplete="one-time-code"
                />
              </div>

              <div className={`flex items-center justify-center gap-1.5 mt-3 text-xs font-black ${blikTimer < 30 ? 'text-red-500' : 'opacity-30'}`}>
                <Clock size={11} />
                {String(Math.floor(blikTimer / 60)).padStart(2, '0')}:
                {String(blikTimer % 60).padStart(2, '0')}
                {blikTimer === 0 && <span className="ml-2">Code expired</span>}
              </div>
            </div>

            <button
              onClick={handleSimulate}
              disabled={blikCode.length < 6 || blikTimer === 0}
              className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20"
            >
              {t('payNow')}
            </button>
          </div>
        )}

        {/* ── Step: details — GPay / Apple Pay ──────────────────────────── */}
        {step === 'details' && (method === 'gpay' || method === 'applepay') && (
          <div className="p-8 space-y-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setStep('method')} className="p-2 hover:bg-slate-500/10 rounded-xl opacity-40 hover:opacity-100 transition-all">
                <ArrowLeft size={18} />
              </button>
              <h2 className="text-xl font-black">
                {method === 'gpay' ? 'Google Pay' : 'Apple Pay'}
              </h2>
            </div>

            <div className={`p-10 rounded-2xl text-center space-y-4 ${dark ? 'bg-slate-800' : 'bg-slate-50'}`}>
              <div className="text-6xl">{method === 'gpay' ? '🔐' : '📱'}</div>
              <p className="font-black text-lg">{t('authWith')} {method === 'gpay' ? 'Google' : 'Apple'}</p>
              <p className="text-sm opacity-50">
                {method === 'gpay'
                  ? 'Use your Google account PIN or biometrics to pay 17 PLN.'
                  : 'Use Face ID or Touch ID to authorise 17 PLN.'}
              </p>
              <p className="text-3xl font-black text-indigo-500">17 PLN</p>
            </div>

            <button
              onClick={handleSimulate}
              className={`w-full py-4 font-black rounded-2xl transition-all shadow-xl text-white flex items-center justify-center gap-3 ${
                method === 'gpay' ? 'bg-[#4285F4] hover:bg-[#3367D6]' : 'bg-black hover:bg-slate-800'
              }`}
            >
              {t('authenticateBtn')}
            </button>
          </div>
        )}

        {/* ── Step: processing ──────────────────────────────────────────── */}
        {step === 'processing' && (
          <div className="p-10 space-y-8 text-center">
            <div className="flex justify-center">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-4 border-indigo-500/15 rounded-full" />
                <div className="absolute inset-0 border-4 border-t-indigo-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
                <div
                  className="absolute inset-0 border-4 border-t-transparent border-r-purple-500/40 border-b-transparent border-l-transparent rounded-full animate-spin"
                  style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
                />
                <div className="absolute inset-4 flex items-center justify-center">
                  <Wallet size={22} className="text-indigo-500" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-black text-xl">{t('processingPayment')}</p>
              <p className="text-sm opacity-50 font-bold h-5">{statusMsg}</p>
            </div>

            <div className={`h-2 rounded-full overflow-hidden ${dark ? 'bg-slate-800' : 'bg-slate-100'}`}>
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className="text-[10px] opacity-20 font-black uppercase tracking-widest">
              {t('dontClose')}
            </p>
          </div>
        )}

        {/* ── Step: success ─────────────────────────────────────────────── */}
        {step === 'success' && (
          <div className="p-10 space-y-6 text-center">
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center ring-4 ring-green-500/20">
                <CheckCircle size={48} className="text-green-500" />
              </div>
            </div>

            <div className="space-y-1">
              <p className="font-black text-2xl text-green-500">{t('paymentSuccess')}</p>
              <p className="opacity-50 text-sm">{t('paymentConfirmed')}</p>
            </div>

            <div className={`rounded-2xl p-5 text-left space-y-3 ${dark ? 'bg-slate-800' : 'bg-slate-50'}`}>
              {(
                [
                  { label: t('amount'),        value: '17.00 PLN',                      cls: 'text-green-500 font-black' },
                  { label: t('transactionId'), value: txId,                             mono: true },
                  { label: t('method'),        value: (method ?? '').toUpperCase(),     mono: true },
                  { label: t('time'),          value: new Date().toLocaleTimeString() },
                ] as { label: string; value: string; cls?: string; mono?: boolean }[]
              ).map((row) => (
                <div key={row.label} className="flex justify-between items-center text-sm">
                  <span className="opacity-40 font-black uppercase tracking-wider text-[10px]">{row.label}</span>
                  <span className={`font-bold ${row.mono ? 'font-mono text-xs' : ''} ${row.cls ?? ''}`}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={onClose}
              className="w-full py-4 bg-green-500 text-white font-black rounded-2xl hover:bg-green-600 transition-all shadow-xl shadow-green-500/20 text-sm"
            >
              {t('continueBtn')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
