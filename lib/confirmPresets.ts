import { ShowConfirmOptions } from '@/context/ConfirmContext';
import { LogOut, CreditCard, Lock, Wallet, RefreshCw, Trash2, Send, XCircle } from 'lucide-react';

type ConfirmRunner = (options: ShowConfirmOptions) => Promise<boolean>;

/**
 * Pre-defined Segment Alert Templates for Confirmation Dialogs
 */
export const segmentConfirmTemplates = {
  /**
   * Segment: Autentikasi & Akun
   */
  logout: async (confirm: ConfirmRunner, userName?: string): Promise<boolean> => {
    return confirm({
      segmentTag: 'AUTENTIKASI & AKUN',
      title: 'Konfirmasi Keluar dari Sesi (Logout)',
      message: `Apakah Anda yakin ingin keluar dari akun ${userName ? `"${userName}"` : 'Anda'}? Anda perlu login kembali untuk mengakses fitur platform.`,
      confirmText: 'Ya, Logout Sekarang',
      cancelText: 'Batal',
      variant: 'warning',
      customIcon: LogOut,
    });
  },

  /**
   * Segment: Pembayaran & Checkout
   */
  checkout: async (
    confirm: ConfirmRunner,
    data: { amount: number; paymentMethod: string; itemCount: number }
  ): Promise<boolean> => {
    return confirm({
      segmentTag: 'PEMBAYARAN & CHECKOUT',
      title: 'Konfirmasi Pembayaran Tiket',
      message: 'Pastikan metode pembayaran dan rincian pesanan Anda telah sesuai sebelum melanjutkan ke pemrosesan transaksi.',
      details: [
        { label: 'Metode Pembayaran', value: data.paymentMethod.toUpperCase() },
        { label: 'Jumlah Kursi/Tiket', value: `${data.itemCount} Kursi` },
        { label: 'Total Nominal', value: `Rp ${data.amount.toLocaleString('id-ID')}` },
      ],
      confirmText: 'Proses Pembayaran',
      cancelText: 'Kembali & Cek Lagi',
      variant: 'info',
      customIcon: CreditCard,
    });
  },

  /**
   * Segment: Reservasi Kursi Interaktif
   */
  lockSeat: async (
    confirm: ConfirmRunner,
    data: { seatCount: number; totalPrice: number }
  ): Promise<boolean> => {
    return confirm({
      segmentTag: 'RESERVASI KURSI',
      title: 'Konfirmasi Kunci Kursi (Seat Lock)',
      message: 'Kursi yang Anda pilih akan dikunci sementara selama 5 menit untuk mencegah pemesanan ganda oleh pembeli lain.',
      details: [
        { label: 'Jumlah Kursi Dipilih', value: `${data.seatCount} Kursi` },
        { label: 'Total Harga Kursi', value: `Rp ${data.totalPrice.toLocaleString('id-ID')}` },
        { label: 'Durasi Hold Lock', value: '5 Menit (300 Detik)' },
      ],
      confirmText: 'Lanjut ke Checkout',
      cancelText: 'Batal Pilih Kursi',
      variant: 'info',
      customIcon: Lock,
    });
  },

  /**
   * Segment: Dompet Cashless
   */
  topup: async (confirm: ConfirmRunner, amount: number): Promise<boolean> => {
    return confirm({
      segmentTag: 'DOMPET CASHLESS',
      title: 'Konfirmasi Top-Up Saldo Event',
      message: 'Saldo akan langsung dikreditkan ke dompet cashless akun Anda dan siap digunakan di seluruh booth vendor venue.',
      details: [
        { label: 'Nominal Top-Up', value: `Rp ${amount.toLocaleString('id-ID')}` },
        { label: 'Biaya Layanan', value: 'Rp 0 (Bebas Biaya)' },
        { label: 'Status Kredit', value: 'Instant Balance Credit' },
      ],
      confirmText: 'Konfirmasi Top-Up',
      cancelText: 'Batal',
      variant: 'success',
      customIcon: Wallet,
    });
  },

  /**
   * Segment: Gate Access Scanner
   */
  syncLogs: async (confirm: ConfirmRunner, pendingCount: number): Promise<boolean> => {
    return confirm({
      segmentTag: 'GATE SCANNER & ABSENSI',
      title: 'Konfirmasi Sinkronisasi Log Offline Gate',
      message: `Unggah ${pendingCount} riwayat scan gate offline yang tersimpan di memori lokal ke basis data server pusat.`,
      details: [
        { label: 'Jumlah Log Pending', value: `${pendingCount} Scan Logs` },
        { label: 'Mode Transport', value: 'REST API Background Sync' },
      ],
      confirmText: 'Sinkronkan Sekarang',
      cancelText: 'Tunda',
      variant: 'info',
      customIcon: RefreshCw,
    });
  },

  /**
   * Segment: Organizer Dashboard (Delete Event)
   */
  deleteEvent: async (confirm: ConfirmRunner, eventName: string): Promise<boolean> => {
    return confirm({
      segmentTag: 'ORGANIZER DASHBOARD',
      title: 'Konfirmasi Hapus Event',
      message: `Tindakan ini tidak dapat dibatalkan. Seluruh data event "${eventName}", tiket, dan seat mapping akan dihapus permanen.`,
      details: [
        { label: 'Target Event', value: eventName },
        { label: 'Dampak Data', value: 'Penghapusan Permanen (No Rollback)' },
      ],
      confirmText: 'Hapus Event Permanen',
      cancelText: 'Batal',
      variant: 'danger',
      customIcon: Trash2,
    });
  },

  /**
   * Segment: Manajemen Tiket (Transfer Tiket)
   */
  transferTicket: async (
    confirm: ConfirmRunner,
    data: { ticketId: string; recipientEmail: string }
  ): Promise<boolean> => {
    return confirm({
      segmentTag: 'MANAJEMEN TIKET',
      title: 'Konfirmasi Transfer Tiket',
      message: 'Kepemilikan tiket akan dipindahkan secara permanen ke akun penerima. QR Code lama Anda akan langsung hangus.',
      details: [
        { label: 'Ticket ID', value: data.ticketId },
        { label: 'Email Penerima', value: data.recipientEmail },
      ],
      confirmText: 'Transfer Tiket Sekarang',
      cancelText: 'Batal',
      variant: 'warning',
      customIcon: Send,
    });
  },

  /**
   * Segment: Pesanan (Batal Order)
   */
  cancelOrder: async (confirm: ConfirmRunner, orderId: string): Promise<boolean> => {
    return confirm({
      segmentTag: 'PESANAN & ORDER',
      title: 'Konfirmasi Pembatalan Pesanan',
      message: 'Kunci kursi Anda akan langsung dilepas dan tersedia kembali untuk publik.',
      details: [{ label: 'Order ID', value: orderId }],
      confirmText: 'Ya, Batalkan Pesanan',
      cancelText: 'Pertahankan Pesanan',
      variant: 'danger',
      customIcon: XCircle,
    });
  },
};
