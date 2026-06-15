import React from 'react';
import { useParams } from 'react-router-dom';

const InventarisDetailPage = () => {
  const { id } = useParams();
  return (
    <div>
      <h1 style={{ color: '#1a365d', marginBottom: '20px' }}>Detail Inventaris</h1>
      <p style={{ color: '#4a5568' }}>Menampilkan informasi rinci untuk aset dengan ID: {id}</p>
    </div>
  );
};

export default InventarisDetailPage;
