const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database for POS Ruko...');

  // 1. Store Settings
  await prisma.storeSetting.upsert({
    where: { id: 'default-store' },
    update: {},
    create: {
      id: 'default-store',
      storeName: 'Toko Ruko Berkah',
      address: 'Ruko Niaga Sentra Blok B No. 05, Jakarta',
      phone: '0812-9876-5432',
      receiptFooter: 'Terima kasih atas kunjungan Anda! Barang yang sudah dibeli tidak dapat ditukar.',
      qrisText: '00020101021126590014ID.LINKAJA.WWW01189360091100000000005204541153033605802ID5917TOKO RUKO BERKAH6007JAKARTA61051234062070703A0163046D5E',
    },
  });

  // 2. Users (Owner & Cashier)
  const salt = await bcrypt.genSalt(10);
  const ownerPassword = await bcrypt.hash('owner123', salt);
  const cashierPassword = await bcrypt.hash('kasir123', salt);

  const owner = await prisma.user.upsert({
    where: { email: 'owner@tokoruko.com' },
    update: { passwordHash: ownerPassword, role: 'OWNER' },
    create: {
      name: 'Pak Haji Budi (Owner)',
      email: 'owner@tokoruko.com',
      passwordHash: ownerPassword,
      role: 'OWNER',
    },
  });

  const cashier = await prisma.user.upsert({
    where: { email: 'kasir@tokoruko.com' },
    update: { passwordHash: cashierPassword, role: 'CASHIER' },
    create: {
      name: 'Siti Rahma (Kasir)',
      email: 'kasir@tokoruko.com',
      passwordHash: cashierPassword,
      role: 'CASHIER',
    },
  });

  console.log('Users created:', { owner: owner.email, cashier: cashier.email });

  // 3. Categories
  const categoriesData = [
    { name: 'Sembako' },
    { name: 'Minuman Dingin' },
    { name: 'Snack & Biskuit' },
    { name: 'Kebutuhan Mandi & Cuci' },
    { name: 'Bumbu & Dapur' },
  ];

  const categories = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: { name: cat.name },
    });
    categories[cat.name] = created.id;
  }

  // 4. Products
  const productsData = [
    {
      name: 'Minyak Goreng Sania 2L',
      sku: '8991001001',
      costPrice: 31000,
      sellPrice: 35000,
      stock: 24,
      minStockAlert: 5,
      categoryId: categories['Sembako'],
    },
    {
      name: 'Beras Pandan Wangi 5kg',
      sku: '8991001002',
      costPrice: 68000,
      sellPrice: 76000,
      stock: 15,
      minStockAlert: 3,
      categoryId: categories['Sembako'],
    },
    {
      name: 'Gula Pasir Gulaku 1kg',
      sku: '8991001003',
      costPrice: 15500,
      sellPrice: 17500,
      stock: 30,
      minStockAlert: 5,
      categoryId: categories['Sembako'],
    },
    {
      name: 'Indomie Goreng Original',
      sku: '8991001004',
      costPrice: 2800,
      sellPrice: 3500,
      stock: 120,
      minStockAlert: 20,
      categoryId: categories['Sembako'],
    },
    {
      name: 'Aqua Botol 600ml Dingin',
      sku: '8991001005',
      costPrice: 2800,
      sellPrice: 4000,
      stock: 48,
      minStockAlert: 10,
      categoryId: categories['Minuman Dingin'],
    },
    {
      name: 'Teh Pucuk Harum 350ml',
      sku: '8991001006',
      costPrice: 3100,
      sellPrice: 4500,
      stock: 36,
      minStockAlert: 8,
      categoryId: categories['Minuman Dingin'],
    },
    {
      name: 'Ultra Milk Cokelat 250ml',
      sku: '8991001007',
      costPrice: 5800,
      sellPrice: 7500,
      stock: 20,
      minStockAlert: 5,
      categoryId: categories['Minuman Dingin'],
    },
    {
      name: 'Chitato Sapi Panggang 68g',
      sku: '8991001008',
      costPrice: 9500,
      sellPrice: 12000,
      stock: 18,
      minStockAlert: 4,
      categoryId: categories['Snack & Biskuit'],
    },
    {
      name: 'Roma Kelapa Biskuit 300g',
      sku: '8991001009',
      costPrice: 10200,
      sellPrice: 13000,
      stock: 14,
      minStockAlert: 3,
      categoryId: categories['Snack & Biskuit'],
    },
    {
      name: 'Sabun Mandi Lifebuoy Total 10',
      sku: '8991001010',
      costPrice: 4000,
      sellPrice: 5500,
      stock: 25,
      minStockAlert: 5,
      categoryId: categories['Kebutuhan Mandi & Cuci'],
    },
    {
      name: 'Deterjen Rinso Molto 770g',
      sku: '8991001011',
      costPrice: 18500,
      sellPrice: 22000,
      stock: 12,
      minStockAlert: 3,
      categoryId: categories['Kebutuhan Mandi & Cuci'],
    },
    {
      name: 'Kecap Bango Manis Refill 520ml',
      sku: '8991001012',
      costPrice: 20500,
      sellPrice: 24500,
      stock: 16,
      minStockAlert: 4,
      categoryId: categories['Bumbu & Dapur'],
    },
  ];

  for (const prod of productsData) {
    await prisma.product.upsert({
      where: { sku: prod.sku },
      update: { categoryId: prod.categoryId },
      create: prod,
    });
  }

  console.log(`Seeded ${productsData.length} products successfully!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

