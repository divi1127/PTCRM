import React from 'react';
import { MessageCircle } from 'lucide-react';

export default function WhatsAppButton({ phone, name }) {
  const handleWhatsApp = () => {
    const message = `Hello ${name}, this is from PT CRM. Regarding our recent conversation...`;
    const url = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <button 
      onClick={handleWhatsApp}
      title={`WhatsApp ${name}`}
      style={{
        background: '#25D366', color: 'white', border: 'none', 
        borderRadius: 6, padding: '5px 8px', fontSize: 12, fontWeight: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
      }}
    >
      <MessageCircle size={14} />
    </button>
  );
}
