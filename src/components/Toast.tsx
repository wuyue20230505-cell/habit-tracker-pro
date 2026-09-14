import { useState, useEffect } from 'react';
import { onToast } from '../utils/toast';

export default function ToastHost() {
  const [msg, setMsg] = useState('');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    return onToast((m) => {
      setMsg(m);
      setVisible(true);
      setTimeout(() => setVisible(false), 2200);
    });
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-24 inset-x-0 z-[60] flex justify-center pointer-events-none">
      <div className="bg-black/70 text-white rounded-full px-5 py-2.5 text-sm shadow-lg transition-opacity duration-300">
        {msg}
      </div>
    </div>
  );
}
