export type UserRole = "admin" | "kasir";

export interface StudentProfile {
  nisn: number;
  nama: string;
  rfid_id?: number;
  saldo?: number;
}

export interface MenuItem {
  id: number;
  nama_menu: string;
  harga: number;
}

export interface CartItem {
  menu: MenuItem;
  quantity: number;
  subtotal: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface RfidTapPayload {
  rfid_id: number;
}

export interface CheckoutPayload {
  rfid_id: number;
  items: {
    menu_id: number;
    jumlah: number;
  }[];
}

export interface TopupPayload {
  rfid_id: number;
  nisn: number;
  nominal: number;
  keterangan?: string;
}
