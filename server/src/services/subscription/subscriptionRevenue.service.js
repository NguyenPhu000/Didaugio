async function ensurePlatformWallet(tx) {
  let wallet = await tx.platformWallet.findFirst();
  if (!wallet) {
    wallet = await tx.platformWallet.create({
      data: { balance: 0, totalEarned: 0, totalRefunded: 0 },
    });
  }
  return wallet;
}

export async function recordSubscriptionRevenue(tx, invoice, source = "sepay") {
  const amount = Number(invoice?.amount || 0);
  if (!amount) return null;

  const wallet = await ensurePlatformWallet(tx);
  await tx.platformWallet.update({
    where: { id: wallet.id },
    data: {
      balance: { increment: amount },
      totalEarned: { increment: amount },
    },
  });

  return tx.financialLedger.create({
    data: {
      type: "SUBSCRIPTION_REVENUE",
      amount,
      description: `Subscription invoice ${invoice.invoiceNumber} (${source})`,
    },
  });
}
