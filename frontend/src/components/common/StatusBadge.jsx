import React from 'react';

/**
 * StatusBadge Component
 * Menampilkan label status dengan warna latar belakang dan teks yang sesuai secara dinamis.
 * 
 * Props:
 * - type: 'kondisi' | 'status_aset' | 'peminjaman' | 'maintenance' | 'instance'
 * - value: string (nilai status)
 */
const StatusBadge = ({ type, value }) => {
  if (!value) return null;

  let bg = '#e2e8f0';
  let text = '#4a5568';

  if (type === 'kondisi') {
    switch (value) {
      case 'Baik':
        bg = '#c6f6d5'; // Hijau muda
        text = '#22543d';
        break;
      case 'Rusak':
        bg = '#fed7d7'; // Merah muda
        text = '#742a2a';
        break;
      case 'Perbaikan':
        bg = '#feebc8'; // Oranye/kuning muda
        text = '#7b341e';
        break;
      case 'Hilang':
        bg = '#edf2f7'; // Abu-abu
        text = '#4a5568';
        break;
      default:
        break;
    }
  } else if (type === 'status_aset') {
    switch (value) {
      case 'Aktif':
        bg = '#ebf8ff'; // Biru muda
        text = '#2b6cb0';
        break;
      case 'Dipinjam':
        bg = '#fffaf0'; // Oranye muda kekuningan
        text = '#dd6b20';
        break;
      case 'Dalam Perbaikan':
        bg = '#feebc8'; // Oranye
        text = '#9c4221';
        break;
      case 'Dihapus':
        bg = '#edf2f7'; // Abu-abu
        text = '#718096';
        break;
      default:
        break;
    }
  } else if (type === 'peminjaman') {
    switch (value) {
      case 'Pending':
        bg = '#fef3c7'; // Kuning
        text = '#92400e';
        break;
      case 'Approved':
        bg = '#d1fae5'; // Hijau
        text = '#065f46';
        break;
      case 'Rejected':
        bg = '#fee2e2'; // Merah
        text = '#991b1b';
        break;
      case 'Dikembalikan':
        bg = '#e0f2fe'; // Biru/Abu
        text = '#075985';
        break;
      default:
        break;
    }
  } else if (type === 'maintenance') {
    switch (value) {
      case 'Diajukan':
        bg = '#fef3c7'; // Kuning
        text = '#92400e';
        break;
      case 'Dalam Perbaikan':
        bg = '#ffedd5'; // Oranye
        text = '#9a3412';
        break;
      case 'Selesai':
        bg = '#d1fae5'; // Hijau
        text = '#065f46';
        break;
      case 'Batal':
        bg = '#f3f4f6'; // Abu-abu
        text = '#374151';
        break;
      default:
        break;
    }
  } else if (type === 'instance') {
    // Penanda load balancer: instance-1 = biru pekat, instance-2 = hijau pekat
    if (value === 'instance-1' || value.toLowerCase().includes('instance-1')) {
      bg = '#2b6cb0';
      text = '#ffffff';
    } else if (value === 'instance-2' || value.toLowerCase().includes('instance-2')) {
      bg = '#2f855a';
      text = '#ffffff';
    } else {
      bg = '#4a5568';
      text = '#ffffff';
    }
  }

  const badgeStyle = {
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    display: 'inline-block',
    backgroundColor: bg,
    color: text,
    textTransform: type === 'instance' ? 'none' : 'capitalize',
  };

  return <span style={badgeStyle}>{value}</span>;
};

export default StatusBadge;
