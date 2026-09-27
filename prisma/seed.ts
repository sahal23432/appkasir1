import { PrismaClient, RoleUser } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Mulai proses seeding data kasir cashless...");

  const hashedPassword = await bcrypt.hash("password123", 10);

  // 1. Data Siswa
  const siswaData = [
    { nisn: 10001, nama: "Budi Santoso" },
    { nisn: 10002, nama: "Siti Rahma" },
    { nisn: 10003, nama: "Petugas Admin" },
    { nisn: 10004, nama: "Petugas Kasir" },
  ];

  for (const s of siswaData) {
    await prisma.siswa.upsert({
      where: { nisn: s.nisn },
      update: { nama: s.nama },
      create: s,
    });
  }
  console.log("Data tb_siswa berhasil di-seed.");

  // 2. Data User (Petugas & Siswa)
  const userData = [
    { rfid_id: 11111, username: "Petugas Admin", password: hashedPassword, role: RoleUser.admin },
    { rfid_id: 22222, username: "Petugas Kasir", password: hashedPassword, role: RoleUser.kasir },
    { rfid_id: 33333, username: "Budi Santoso", password: hashedPassword, role: RoleUser.kasir },
  ];

  for (const u of userData) {
    await prisma.user.upsert({
      where: { rfid_id: u.rfid_id },
      update: { password: u.password, role: u.role },
      create: u,
    });
  }
  console.log("Data tb_user berhasil di-seed.");

  // 3. Data Saldo Siswa
  await prisma.saldo.upsert({
    where: {
      rfid_id_nisn: {
        rfid_id: 33333,
        nisn: 10001,
      },
    },
    update: { saldo: 50000.0 },
    create: {
      rfid_id: 33333,
      nisn: 10001,
      saldo: 50000.0,
    },
  });
  console.log("Data tb_saldo berhasil di-seed.");

  // 4. Data Menu
  const menuData = [
    { id: 1, nama_menu: "Nasi Goreng Spesial", harga: 12000 },
    { id: 2, nama_menu: "Mie Ayam Bakso", harga: 10000 },
    { id: 3, nama_menu: "Es Teh Manis", harga: 3000 },
    { id: 4, nama_menu: "Jus Alpukat", harga: 8000 },
    { id: 5, nama_menu: "Air Mineral Botol", harga: 4000 },
    { id: 6, nama_menu: "Buku Tulis & Pulpen", harga: 6000 },
  ];

  for (const m of menuData) {
    await prisma.menu.upsert({
      where: { id: m.id },
      update: { nama_menu: m.nama_menu, harga: m.harga },
      create: m,
    });
  }
  console.log("Data tb_menu berhasil di-seed.");

  console.log("Seeding selesai!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
