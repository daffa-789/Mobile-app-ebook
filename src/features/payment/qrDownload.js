import { toast } from 'sonner';
import { DEFAULT_PLAN } from '@lib/plans';

/**
 * Mengunduh kode QRIS sebagai berkas gambar PNG ke galeri perangkat
 * @param {Object} options
 * @param {HTMLElement|null} options.container - Elemen kontainer yang memuat SVG kode QR
 * @param {string} [options.planId] - ID paket langganan
 * @param {string} [options.qrImageUrl] - URL gambar QR fallback dari gateway
 */
export const downloadQrisImage = async ({
  container,
  planId = DEFAULT_PLAN.id,
  qrImageUrl = null,
}) => {
  try {
    const svg = container?.querySelector('svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      const size = 320;
      canvas.width = size;
      canvas.height = size + 60;

      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);

      img.onload = () => {
        try {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          ctx.fillStyle = '#14523A';
          ctx.font = 'bold 16px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('QRIS — WAHIDIYAH BOOK', canvas.width / 2, 28);

          ctx.drawImage(img, (canvas.width - 240) / 2, 42, 240, 240);

          ctx.fillStyle = '#64748B';
          ctx.font = '11px sans-serif';
          ctx.fillText(
            'Scan via DANA, BCA, GoPay, OVO, ShopeePay',
            canvas.width / 2,
            canvas.height - 12,
          );

          const pngUrl = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.href = pngUrl;
          downloadLink.download = `QRIS-Wahidiyah-Book-${planId}.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          toast.success('Gambar QRIS berhasil disimpan ke galeri! Buka DANA/BCA untuk scan.');
        } finally {
          URL.revokeObjectURL(svgUrl);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(svgUrl);
        toast.error('Gagal memproses gambar QRIS');
      };
      img.src = svgUrl;
    } else if (qrImageUrl) {
      const downloadLink = document.createElement('a');
      downloadLink.href = qrImageUrl;
      downloadLink.download = 'QRIS-Wahidiyah-Book.png';
      downloadLink.target = '_blank';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      toast.success('Kode QRIS berhasil diunduh!');
    }
  } catch (err) {
    console.error('Gagal download QR:', err);
    toast.error('Gagal menyimpan gambar QRIS');
  }
};
