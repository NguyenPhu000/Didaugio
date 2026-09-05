import { PrismaClient } from "@prisma/client";
import { assertFinancialSeedAllowed } from "./lib/financialSeedGuard.js";

assertFinancialSeedAllowed();
const prisma = new PrismaClient();

async function seedFinancialMockData() {
  console.log("Starting financial mock data seeding...");

  // 1. Get or create Business users & businesses
  let businesses = await prisma.business.findMany({ take: 5 });

  if (businesses.length === 0) {
    console.log("No existing business found. Creating demo business accounts...");
    // Find business role
    const businessRole = await prisma.role.findFirst({ where: { name: "business" } }) || 
                         await prisma.role.findFirst({ where: { id: 3 } });
    
    const ownerUser = await prisma.user.upsert({
      where: { email: "demo.business@didaugio.local" },
      update: {},
      create: {
        email: "demo.business@didaugio.local",
        username: "demo_business_owner",
        password: "$2b$10$YourHashedPasswordHereOrDummy1234567890",
        roleId: businessRole?.id || 3,
        status: "active",
      },
    });

    const newBusiness = await prisma.business.create({
      data: {
        name: "Cần Thơ Cuisine & Eco Resort",
        ownerId: ownerUser.id,
        phone: "0901234567",
        email: "contact@eco-resort-cantho.local",
        address: "123 Đường Ninh Kiều, Cần Thơ",
        status: "approved",
      },
    });
    businesses = [newBusiness];
  }

  // Ensure at least one Place exists for services
  let place = await prisma.place.findFirst();
  if (!place) {
    place = await prisma.place.create({
      data: {
        name: "Địa điểm Mẫu Cần Thơ",
        address: "123 Đường 3 Tháng 2, Cần Thơ",
        latitude: 10.03,
        longitude: 105.78,
        status: "approved",
      },
    });
  }

  // 2. Get or create Business Services for each business
  for (const biz of businesses) {
    let services = await prisma.businessService.findMany({
      where: { businessId: biz.id },
    });

    if (services.length === 0) {
      const svc1 = await prisma.businessService.create({
        data: {
          businessId: biz.id,
          placeId: place.id,
          name: "Buffet Lẩu Nướng Sông Hậu",
          description: "Thưởng thức hải sản tươi sống và lẩu mắm miền Tây",
          serviceType: "food",
          price: 299000,
          salePrice: 249000,
          durationMinutes: 120,
          maxCapacity: 50,
          isActive: true,
        },
      });
      const svc2 = await prisma.businessService.create({
        data: {
          businessId: biz.id,
          placeId: place.id,
          name: "Tour Chợ Nổi Cái Răng & Vườn Trái Cây",
          description: "Trải nghiệm văn hóa sông nước trọn gói 1 ngày",
          serviceType: "tour",
          price: 450000,
          salePrice: 390000,
          durationMinutes: 360,
          maxCapacity: 20,
          isActive: true,
        },
      });
      services = [svc1, svc2];
    }

    // Ensure a regular customer user exists for bookings
    const customerUser = await prisma.user.upsert({
      where: { email: "customer.demo@didaugio.local" },
      update: {},
      create: {
        email: "customer.demo@didaugio.local",
        username: "customer_demo",
        password: "$2b$10$DummyPasswordHashedForDemoCustomer123456",
        roleId: 5, // user
        status: "active",
      },
    });

    // 3. Seed Completed Bookings & BookingTransactions over last 90 days
    console.log(`Generating financial transaction history for business: ${biz.name || `ID ${biz.id}`}...`);
    const now = new Date();
    
    // Seed 15 completed booking transactions across past 90 days
    for (let i = 0; i < 15; i++) {
      const daysAgo = Math.floor(Math.random() * 90) + 1;
      const completedDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      const service = services[i % services.length];
      const originalPrice = service.price;
      const finalPrice = service.discountPrice || service.price;
      const commissionRate = 10;
      const commissionAmount = Math.round((finalPrice * commissionRate) / 100);
      const netAmount = finalPrice - commissionAmount;

      const bookingCode = `DDG-SEED-${biz.id}-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${i}-${Date.now()}`;

      const booking = await prisma.booking.create({
        data: {
          bookingCode,
          userId: customerUser.id,
          businessId: biz.id,
          serviceId: service.id,
          quantity: Math.floor(Math.random() * 3) + 1,
          useDate: completedDate,
          guestName: `Khách hàng Demo ${i + 1}`,
          guestPhone: `098${Math.floor(1000000 + Math.random() * 9000000)}`,
          guestEmail: `guest${i}@example.local`,
          originalPrice,
          finalPrice,
          commissionRate,
          commissionAmount,
          adminEarned: commissionAmount,
          businessEarned: netAmount,
          status: "completed",
          paymentStatus: "paid",
          completedAt: completedDate,
          createdAt: new Date(completedDate.getTime() - 2 * 60 * 60 * 1000),
        },
      });

      // Create BookingTransaction (Ledger entry for business revenue analysis)
      await prisma.bookingTransaction.upsert({
        where: { bookingId: booking.id },
        update: {},
        create: {
          bookingId: booking.id,
          businessId: biz.id,
          originalPrice,
          finalPrice,
          commissionRate,
          commissionAmount,
          netAmount,
          completedAt: completedDate,
          source: "qr_checkin",
        },
      });

      // Create Payment record
      const paymentRef = `PAY-SEED-${booking.id}-${Date.now()}`;
      await prisma.payment.upsert({
        where: { bookingId: booking.id },
        update: {},
        create: {
          bookingId: booking.id,
          userId: customerUser.id,
          amount: finalPrice,
          currency: "VND",
          paymentMethod: i % 2 === 0 ? "sepay_qr" : "vnpay",
          transactionRef: paymentRef,
          idempotencyKey: `IDEM-PAY-${booking.id}`,
          status: "paid",
          paidAt: completedDate,
        },
      });

      // FinancialLedger entry
      await prisma.financialLedger.create({
        data: {
          bookingId: booking.id,
          type: "EARNING",
          amount: netAmount,
          description: `Doanh thu đơn đặt hàng ${bookingCode}`,
          createdAt: completedDate,
        },
      });
    }

    // 4. Seed Refunded & Cancelled Payments
    for (let j = 0; j < 3; j++) {
      const daysAgo = Math.floor(Math.random() * 30) + 1;
      const refundDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      const service = services[j % services.length];
      const finalPrice = service.discountPrice || service.price;
      const refundAmount = Math.round(finalPrice * 0.8); // 80% refund

      const bookingCode = `DDG-REFUND-${biz.id}-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now()}`;
      const booking = await prisma.booking.create({
        data: {
          bookingCode,
          userId: customerUser.id,
          businessId: biz.id,
          serviceId: service.id,
          useDate: refundDate,
          guestName: `Khách hủy ${j + 1}`,
          guestPhone: `097${Math.floor(1000000 + Math.random() * 9000000)}`,
          originalPrice: service.price,
          finalPrice,
          status: "cancelled",
          paymentStatus: "refunded",
          cancelReason: "Khách báo bận đột xuất trước 24h",
          cancelledAt: refundDate,
          createdAt: new Date(refundDate.getTime() - 24 * 60 * 60 * 1000),
        },
      });

      await prisma.payment.upsert({
        where: { bookingId: booking.id },
        update: {},
        create: {
          bookingId: booking.id,
          userId: customerUser.id,
          amount: finalPrice,
          currency: "VND",
          paymentMethod: "sepay_qr",
          transactionRef: `PAY-REFUND-${booking.id}`,
          idempotencyKey: `IDEM-REFUND-${booking.id}`,
          status: "refunded",
          paidAt: new Date(refundDate.getTime() - 12 * 60 * 60 * 1000),
          refundAmount,
          refundedAt: refundDate,
          refundReason: "Chính sách hoàn tiền 80% hủy trước 24h",
        },
      });

      await prisma.financialLedger.create({
        data: {
          bookingId: booking.id,
          type: "REFUND",
          amount: refundAmount,
          description: `Hoàn tiền booking ${bookingCode}`,
          createdAt: refundDate,
        },
      });
    }

    // 5. Seed Partner Wallet
    console.log(`Seeding PartnerWallet for business ID: ${biz.id}...`);
    await prisma.partnerWallet.upsert({
      where: { businessId: biz.id },
      update: {
        balance: 12500000,
        frozenBalance: 2000000,
      },
      create: {
        businessId: biz.id,
        balance: 12500000,
        frozenBalance: 2000000,
      },
    });

    // 6. Seed Payout Requests (Transferred, Pending, Approved, Rejected)
    console.log(`Seeding Payout history for business ID: ${biz.id}...`);
    const bizName = (biz?.name || "DOANH NGHIEP DEMO").toUpperCase();
    const payoutSeedData = [
      {
        amount: 5000000,
        status: "transferred",
        bankName: "Vietcombank",
        bankAccount: "9988776655",
        bankOwner: bizName,
        note: "Rút tiền doanh thu tuần 1",
        requestedAt: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000),
        transferredAt: new Date(now.getTime() - 39 * 24 * 60 * 60 * 1000),
      },
      {
        amount: 3500000,
        status: "transferred",
        bankName: "VietinBank",
        bankAccount: "1020304050",
        bankOwner: bizName,
        note: "Rút tiền doanh thu tháng trước",
        requestedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
        transferredAt: new Date(now.getTime() - 19 * 24 * 60 * 60 * 1000),
      },
      {
        amount: 2000000,
        status: "approved",
        bankName: "MBBank",
        bankAccount: "0901234567",
        bankOwner: bizName,
        note: "Yêu cầu rút tiền định kỳ",
        requestedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        reviewedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        amount: 1500000,
        status: "pending",
        bankName: "Techcombank",
        bankAccount: "190333444555",
        bankOwner: bizName,
        note: "Rút số dư khả dụng",
        requestedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
      },
      {
        amount: 800000,
        status: "rejected",
        bankName: "Agribank",
        bankAccount: "6700205001234",
        bankOwner: bizName,
        note: "Rút thử nghiệm",
        rejectReason: "Tên chủ tài khoản không trùng khớp với đăng ký kinh doanh",
        requestedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        reviewedAt: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000),
      },
    ];

    for (const poData of payoutSeedData) {
      const payout = await prisma.payout.create({
        data: {
          businessId: biz.id,
          ...poData,
        },
      });

      if (poData.status === "transferred") {
        await prisma.financialLedger.create({
          data: {
            payoutId: payout.id,
            type: "WITHDRAW",
            amount: poData.amount,
            description: `Chuyển khoản thanh toán payout ID #${payout.id}`,
            createdAt: poData.transferredAt || poData.requestedAt,
          },
        });
      }
    }
  }

  // 7. Seed Platform Wallet (Admin)
  console.log("Seeding PlatformWallet (Admin)...");
  const platformWallet = await prisma.platformWallet.findFirst();
  if (platformWallet) {
    await prisma.platformWallet.update({
      where: { id: platformWallet.id },
      data: {
        balance: 18500000,
        totalEarned: 32000000,
        totalPaidOut: 13500000,
      },
    });
  } else {
    await prisma.platformWallet.create({
      data: {
        balance: 18500000,
        totalEarned: 32000000,
        totalPaidOut: 13500000,
      },
    });
  }

  // 8. Seed Subscription Plans & Subscription Invoices (Admin & Business)
  console.log("Seeding Subscription Plans & Invoices...");
  const proPlan = await prisma.subscriptionPlan.upsert({
    where: { name: "Pro Partner" },
    update: {},
    create: {
      name: "Pro Partner",
      slug: "pro-partner",
      description: "Gói chuyên nghiệp hỗ trợ quảng bá & quản lý đa dịch vụ",
      priceMonthly: 499000,
      priceYearly: 4990000,
      maxPlaces: 10,
      maxServices: 30,
      maxBookings: 1000,
      maxStaff: 5,
      features: ["analytics", "priority_support", "custom_promotions"],
      isActive: true,
    },
  });

  for (const biz of businesses) {
    const sub = await prisma.subscription.upsert({
      where: { businessId: biz.id },
      update: {
        planId: proPlan.id,
        status: "active",
      },
      create: {
        businessId: biz.id,
        planId: proPlan.id,
        status: "active",
        billingCycle: "monthly",
        currentPeriodStart: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      },
    });

    // Seed Paid Invoice
    await prisma.subscriptionInvoice.upsert({
      where: { invoiceNumber: `DDG-INV-${biz.id}-202607` },
      update: {},
      create: {
        subscriptionId: sub.id,
        invoiceNumber: `DDG-INV-${biz.id}-202607`,
        amount: 499000,
        currency: "VND",
        status: "paid",
        paymentMethod: "sepay_qr",
        transactionRef: `SUB-REF-${biz.id}-07`,
        paidAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        periodStart: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        periodEnd: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        notes: "Thanh toán gói Pro Partner tháng 7",
      },
    });

    // Seed Pending Invoice
    await prisma.subscriptionInvoice.upsert({
      where: { invoiceNumber: `DDG-INV-${biz.id}-202608` },
      update: {},
      create: {
        subscriptionId: sub.id,
        invoiceNumber: `DDG-INV-${biz.id}-202608`,
        amount: 499000,
        currency: "VND",
        status: "pending",
        paymentMethod: "sepay_qr",
        transactionRef: `SUB-REF-${biz.id}-08`,
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        periodStart: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        periodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        notes: "Gia hạn gói Pro Partner tháng 8",
      },
    });
  }

  console.log("Successfully seeded mock financial data for Admin & Business!");
}

seedFinancialMockData()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("Failed to seed financial mock data:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
