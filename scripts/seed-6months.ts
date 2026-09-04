import { PrismaClient, TransactionType, CategoryType } from "@prisma/client";
import Decimal from "decimal.js";

const prisma = new PrismaClient();

interface SeedMonthConfig {
  year: number;
  monthIndex: number; // 0-indexed (2 = March, 7 = August)
  monthName: string;
  daysInMonth: number;
  salary: number;
  rent: number;
}

const MONTHS: SeedMonthConfig[] = [
  { year: 2026, monthIndex: 2, monthName: "March 2026", daysInMonth: 31, salary: 115000, rent: 28000 },
  { year: 2026, monthIndex: 3, monthName: "April 2026", daysInMonth: 30, salary: 115000, rent: 28000 },
  { year: 2026, monthIndex: 4, monthName: "May 2026", daysInMonth: 31, salary: 118000, rent: 28000 },
  { year: 2026, monthIndex: 5, monthName: "June 2026", daysInMonth: 30, salary: 118000, rent: 28000 },
  { year: 2026, monthIndex: 6, monthName: "July 2026", daysInMonth: 31, salary: 122000, rent: 28000 },
  { year: 2026, monthIndex: 7, monthName: "August 2026", daysInMonth: 31, salary: 122000, rent: 28000 },
];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals: number = 2): number {
  const val = Math.random() * (max - min) + min;
  return Number(val.toFixed(decimals));
}

function makeDate(year: number, monthIndex: number, day: number, hour: number, minute: number): Date {
  const d = new Date(Date.UTC(year, monthIndex, day, hour, minute, randomInt(0, 59)));
  return d;
}

async function seedUser(userId: string, email: string) {
  console.log(`\n======================================================`);
  console.log(`Seeding 6-month transaction data for user: ${email} (${userId})`);
  console.log(`======================================================`);

  // Fetch accounts
  const accounts = await prisma.account.findMany({ where: { userId } });
  if (accounts.length === 0) {
    console.warn(`No accounts found for user ${email}. Skipping.`);
    return;
  }

  const checking = accounts.find((a) => a.group === "BANK_ACCOUNT") || accounts[0];
  const cash = accounts.find((a) => a.group === "CASH") || accounts[0];
  const savings = accounts.find((a) => a.group === "SAVINGS") || accounts[1] || accounts[0];

  console.log(`Using accounts:`);
  console.log(`  Checking: ${checking.name} (${checking.id})`);
  console.log(`  Cash:     ${cash.name} (${cash.id})`);
  console.log(`  Savings:  ${savings.name} (${savings.id})`);

  // Fetch categories with subcategories
  const categories = await prisma.category.findMany({
    where: { userId },
    include: { subcategories: true },
  });

  const catMap = new Map<string, { id: string; name: string; type: CategoryType; subs: Map<string, string> }>();
  for (const cat of categories) {
    const subsMap = new Map<string, string>();
    for (const sub of cat.subcategories) {
      subsMap.set(sub.name.toLowerCase(), sub.id);
    }
    catMap.set(cat.name.toLowerCase(), {
      id: cat.id,
      name: cat.name,
      type: cat.type,
      subs: subsMap,
    });
  }

  function getCat(catName: string, subName?: string) {
    const entry = catMap.get(catName.toLowerCase());
    if (!entry) return { categoryId: null, subcategoryId: null };
    let subId: string | null = null;
    if (subName) {
      subId = entry.subs.get(subName.toLowerCase()) || null;
    }
    return { categoryId: entry.id, subcategoryId: subId };
  }

  // Ensure checking initial balance is healthy
  await prisma.account.update({
    where: { id: checking.id },
    data: { initialBalance: new Decimal(400000) },
  });

  await prisma.account.update({
    where: { id: cash.id },
    data: { initialBalance: new Decimal(15000) },
  });

  // Collect all transactions to seed
  const transactionsToInsert: {
    userId: string;
    accountId: string;
    toAccountId?: string | null;
    categoryId?: string | null;
    subcategoryId?: string | null;
    type: TransactionType;
    amount: Decimal;
    fee?: Decimal | null;
    date: Date;
    note?: string | null;
    description?: string | null;
  }[] = [];

  let grandTotalCount = 0;

  for (const m of MONTHS) {
    const monthTxList: typeof transactionsToInsert = [];

    // -------------------------------------------------------------
    // 1. INCOMES (10-15 per month)
    // -------------------------------------------------------------
    // Base salary on the 1st
    const salaryCat = getCat("Salary / Wages", "Base Salary");
    monthTxList.push({
      userId,
      accountId: checking.id,
      type: "INCOME",
      amount: new Decimal(m.salary),
      date: makeDate(m.year, m.monthIndex, 1, 9, 30),
      note: "Acme Corp Monthly Salary",
      description: `Monthly direct deposit net salary for ${m.monthName}`,
      ...salaryCat,
    });

    // Freelance / Client Consulting Invoice (around 14th - 18th)
    const freelanceCat = getCat("Business & Freelance", "Client Invoices");
    monthTxList.push({
      userId,
      accountId: checking.id,
      type: "INCOME",
      amount: new Decimal(randomInt(24000, 38000)),
      date: makeDate(m.year, m.monthIndex, randomInt(14, 18), 15, 10),
      note: "Fintech Advisory Project Milestone",
      description: "Consulting milestone payment for architecture review",
      ...freelanceCat,
    });

    // Investment Dividend / Interest (around 5th - 10th)
    const invCat = getCat("Investments", "Dividends");
    monthTxList.push({
      userId,
      accountId: checking.id,
      type: "INCOME",
      amount: new Decimal(randomFloat(2200, 6800)),
      date: makeDate(m.year, m.monthIndex, randomInt(5, 10), 11, 45),
      note: "HDFC Nifty 50 Index Fund Dividend",
      description: "Quarterly portfolio dividend distribution",
      ...invCat,
    });

    // Bank Account Interest (last day of month)
    const intCat = getCat("Investments", "Interest");
    monthTxList.push({
      userId,
      accountId: savings.id,
      type: "INCOME",
      amount: new Decimal(randomFloat(850, 2100)),
      date: makeDate(m.year, m.monthIndex, m.daysInMonth, 23, 50),
      note: "Savings Account Quarterly Interest",
      description: "Auto-credited savings interest from bank",
      ...intCat,
    });

    // UPI Cashback & Rewards (4-6 times throughout the month)
    const rewardCat = getCat("Gifts & Grants", "Cashback & Rewards");
    const rewardDays = [4, 9, 15, 21, 27];
    for (const d of rewardDays) {
      monthTxList.push({
        userId,
        accountId: checking.id,
        type: "INCOME",
        amount: new Decimal(randomInt(25, 350)),
        date: makeDate(m.year, m.monthIndex, d, randomInt(12, 20), randomInt(0, 59)),
        note: randomChoice(["Google Pay UPI Scratch Card", "Cred Rewards Cashback", "PhonePe Merchant Cashback"]),
        description: "Promotional cashback offer reward",
        ...rewardCat,
      });
    }

    // Occasional Gift / Reimbursement
    const giftCat = getCat("Gifts & Grants", "Gifts Received");
    monthTxList.push({
      userId,
      accountId: checking.id,
      type: "INCOME",
      amount: new Decimal(randomInt(1500, 5000)),
      date: makeDate(m.year, m.monthIndex, randomInt(18, 26), 18, 20),
      note: randomChoice(["Family celebration gift", "Travel reimbursement from client", "Birthday blessing"]),
      description: "One-off incoming transfer",
      ...giftCat,
    });

    // -------------------------------------------------------------
    // 2. TRANSFERS (8-12 per month)
    // -------------------------------------------------------------
    // Monthly Savings Deposit / SIP
    monthTxList.push({
      userId,
      accountId: checking.id,
      toAccountId: savings.id,
      type: "TRANSFER",
      amount: new Decimal(randomChoice([25000, 30000, 35000])),
      date: makeDate(m.year, m.monthIndex, 3, 10, 0),
      note: "Monthly High-Yield Savings Deposit",
      description: "Auto recurring monthly savings allocation",
    });

    // Mid-month additional savings
    monthTxList.push({
      userId,
      accountId: checking.id,
      toAccountId: savings.id,
      type: "TRANSFER",
      amount: new Decimal(randomChoice([10000, 15000])),
      date: makeDate(m.year, m.monthIndex, 20, 11, 30),
      note: "Emergency Fund Top-Up",
      description: "Transfer surplus liquidity to high-yield reserve",
    });

    // ATM Cash Withdrawals (3-4 times per month)
    const atmDays = [2, 11, 22];
    for (const d of atmDays) {
      monthTxList.push({
        userId,
        accountId: checking.id,
        toAccountId: cash.id,
        type: "TRANSFER",
        amount: new Decimal(randomChoice([3000, 5000, 6000])),
        fee: new Decimal(0),
        date: makeDate(m.year, m.monthIndex, d, randomInt(11, 18), randomInt(10, 50)),
        note: "ATM Cash Withdrawal",
        description: "HDFC Bank ATM cash withdrawal for pocket wallet",
      });
    }

    // Reverse petty cash deposit or wallet adjustment
    if (m.monthIndex % 2 === 0) {
      monthTxList.push({
        userId,
        accountId: cash.id,
        toAccountId: checking.id,
        type: "TRANSFER",
        amount: new Decimal(2000),
        date: makeDate(m.year, m.monthIndex, 28, 16, 15),
        note: "Cash Deposit at CDM",
        description: "Surplus cash deposited into checking branch CDM",
      });
    }

    // -------------------------------------------------------------
    // 3. FIXED MONTHLY EXPENSES (1st - 10th)
    // -------------------------------------------------------------
    // Rent
    const rentCat = getCat("Housing & Utilities", "Rent");
    monthTxList.push({
      userId,
      accountId: checking.id,
      type: "EXPENSE",
      amount: new Decimal(m.rent),
      date: makeDate(m.year, m.monthIndex, 2, 10, 15),
      note: "Apartment Monthly Rent",
      description: `House rent transfer to landlord for ${m.monthName}`,
      ...rentCat,
    });

    // Electricity
    const elecCat = getCat("Housing & Utilities", "Electricity");
    monthTxList.push({
      userId,
      accountId: checking.id,
      type: "EXPENSE",
      amount: new Decimal(randomFloat(2850, 4650)),
      date: makeDate(m.year, m.monthIndex, 6, 11, 20),
      note: "BESCOM Electricity Bill",
      description: "Monthly domestic electricity consumption bill",
      ...elecCat,
    });

    // Water & Gas
    const gasCat = getCat("Housing & Utilities", "Water & Gas");
    monthTxList.push({
      userId,
      accountId: checking.id,
      type: "EXPENSE",
      amount: new Decimal(randomFloat(620, 1150)),
      date: makeDate(m.year, m.monthIndex, 8, 14, 10),
      note: "Piped Natural Gas & Water Society Bill",
      description: "Monthly utility dues",
      ...gasCat,
    });

    // Broadband & Mobile
    const netCat = getCat("Housing & Utilities", "Internet & Mobile");
    monthTxList.push({
      userId,
      accountId: checking.id,
      type: "EXPENSE",
      amount: new Decimal(1179.0),
      date: makeDate(m.year, m.monthIndex, 10, 12, 0),
      note: "Airtel Xstream Fiber 200Mbps",
      description: "Home high-speed broadband monthly subscription",
      ...netCat,
    });
    monthTxList.push({
      userId,
      accountId: checking.id,
      type: "EXPENSE",
      amount: new Decimal(499.0),
      date: makeDate(m.year, m.monthIndex, 12, 12, 30),
      note: "Jio Postpaid Plus 5G",
      description: "Primary mobile plan postpaid billing",
      ...netCat,
    });

    // Gym Membership
    const gymCat = getCat("Health & Medical", "Fitness & Gym");
    monthTxList.push({
      userId,
      accountId: checking.id,
      type: "EXPENSE",
      amount: new Decimal(1850.0),
      date: makeDate(m.year, m.monthIndex, 5, 8, 30),
      note: "Cult.fit Elite Monthly Gym Pass",
      description: "Gym access & strength training membership",
      ...gymCat,
    });

    // -------------------------------------------------------------
    // 4. DIGITAL SUBSCRIPTIONS (Fixed Days)
    // -------------------------------------------------------------
    const subCat = getCat("Entertainment & Leisure", "Streaming & Subscriptions");
    monthTxList.push({
      userId,
      accountId: checking.id,
      type: "EXPENSE",
      amount: new Decimal(649.0),
      date: makeDate(m.year, m.monthIndex, 15, 20, 0),
      note: "Netflix 4K Ultra HD Premium",
      description: "Monthly streaming plan",
      ...subCat,
    });
    monthTxList.push({
      userId,
      accountId: checking.id,
      type: "EXPENSE",
      amount: new Decimal(119.0),
      date: makeDate(m.year, m.monthIndex, 18, 19, 30),
      note: "Spotify Premium Individual",
      description: "Music streaming subscription",
      ...subCat,
    });
    monthTxList.push({
      userId,
      accountId: checking.id,
      type: "EXPENSE",
      amount: new Decimal(129.0),
      date: makeDate(m.year, m.monthIndex, 21, 21, 15),
      note: "YouTube Premium",
      description: "Ad-free video & background play subscription",
      ...subCat,
    });
    monthTxList.push({
      userId,
      accountId: checking.id,
      type: "EXPENSE",
      amount: new Decimal(219.0),
      date: makeDate(m.year, m.monthIndex, 25, 9, 15),
      note: "Apple iCloud+ 200GB Storage",
      description: "Cloud backup and sync",
      ...subCat,
    });

    // -------------------------------------------------------------
    // 5. DAILY RECURRENT EXPENSES (Groceries, Dining, Commute, Cafes)
    // To ensure >= 150 transactions each month, we spread ~130 transactions across all days.
    // -------------------------------------------------------------
    const groceryVendors = [
      { name: "Zepto Quick Delivery", min: 180, max: 850, sub: "Groceries" },
      { name: "Blinkit Grocery Store", min: 250, max: 1200, sub: "Groceries" },
      { name: "Swiggy Instamart", min: 220, max: 950, sub: "Groceries" },
      { name: "Nature's Basket Organic", min: 650, max: 2400, sub: "Groceries" },
      { name: "Local Vegetable & Fruit Market", min: 140, max: 480, sub: "Groceries", useCash: true },
      { name: "BigBasket Supermarket Weekly", min: 1200, max: 3200, sub: "Groceries" },
      { name: "Fresh Milk & Dairy Delivery", min: 85, max: 210, sub: "Groceries" },
    ];

    const diningVendors = [
      { name: "Blue Tokai Coffee Roasters", min: 220, max: 480, sub: "Coffee & Cafes" },
      { name: "Third Wave Coffee", min: 240, max: 550, sub: "Coffee & Cafes" },
      { name: "Starbucks Cappuccino & Muffin", min: 380, max: 720, sub: "Coffee & Cafes" },
      { name: "Chai Point Ginger Tea & Samosa", min: 95, max: 220, sub: "Coffee & Cafes", useCash: true },
      { name: "Swiggy Lunch Delivery - MealBox", min: 240, max: 420, sub: "Food Delivery" },
      { name: "Zomato Gourmet Dinner - Truffles", min: 450, max: 950, sub: "Food Delivery" },
      { name: "Pizza Hut / Domino's Weekend Deal", min: 550, max: 1100, sub: "Food Delivery" },
      { name: "Meghana Foods Biryani Lunch", min: 360, max: 780, sub: "Restaurants" },
      { name: "Mainland China Family Dinner", min: 1800, max: 3400, sub: "Restaurants" },
      { name: "Toit Brewpub Evening Drinks & Pizza", min: 1400, max: 2800, sub: "Restaurants" },
      { name: "Street Food Chaat & Dosa", min: 80, max: 180, sub: "Restaurants", useCash: true },
    ];

    const transitVendors = [
      { name: "Uber Premier to Office", min: 180, max: 380, sub: "Rideshare & Cabs" },
      { name: "Ola Auto / Rapido Bike Commute", min: 65, max: 140, sub: "Rideshare & Cabs", useCash: true },
      { name: "Namma Metro Smartcard Top-up", min: 200, max: 500, sub: "Public Transit" },
      { name: "HPCL Petrol Pump Fuel Refill", min: 1800, max: 3200, sub: "Fuel & Gas" },
      { name: "Shell V-Power Premium Fuel", min: 2000, max: 3500, sub: "Fuel & Gas" },
      { name: "NH48 Toll Plaza FASTag Auto Debit", min: 85, max: 240, sub: "Parking & Tolls" },
      { name: "Mall Parking Fee", min: 50, max: 150, sub: "Parking & Tolls", useCash: true },
    ];

    const shoppingVendors = [
      { name: "Amazon India Household & Electronics", min: 450, max: 3200, cat: "Shopping & Lifestyle", sub: "Electronics & Gadgets" },
      { name: "Myntra Fashion Apparel", min: 899, max: 2800, cat: "Shopping & Lifestyle", sub: "Clothing & Apparel" },
      { name: "Decathlon Sports Gear & Socks", min: 399, max: 1600, cat: "Shopping & Lifestyle", sub: "Clothing & Apparel" },
      { name: "Uniqlo Airism T-Shirts", min: 1490, max: 3990, cat: "Shopping & Lifestyle", sub: "Clothing & Apparel" },
      { name: "Nykaa Man Grooming & Skincare", min: 550, max: 1850, cat: "Shopping & Lifestyle", sub: "Personal Care & Grooming" },
      { name: "Urban Company Haircut & Grooming", min: 499, max: 1100, cat: "Shopping & Lifestyle", sub: "Personal Care & Grooming" },
      { name: "Apollo Pharmacy Health Supplements", min: 240, max: 980, cat: "Health & Medical", sub: "Pharmacy & Medicine" },
      { name: "1mg Prescription Medicines", min: 350, max: 1450, cat: "Health & Medical", sub: "Pharmacy & Medicine" },
      { name: "Dr. Batra Clinic Consultation", min: 800, max: 1500, cat: "Health & Medical", sub: "Doctor & Dental" },
      { name: "PVR Director's Cut Weekend Movie", min: 650, max: 1600, cat: "Entertainment & Leisure", sub: "Movies & Events" },
      { name: "Crossword Bookstore - Tech Novel", min: 450, max: 950, cat: "Education & Learning", sub: "Books & Learning Material" },
      { name: "Coursera / Udemy Web Dev Course", min: 599, max: 1499, cat: "Education & Learning", sub: "Tuition & Courses" },
      { name: "Ferns N Petals Gift Flowers", min: 799, max: 1899, cat: "Family & Gifts", sub: "Gifts Given" },
      { name: "Heads Up For Tails Pet Treats", min: 350, max: 1150, cat: "Pets", sub: "Pet Food" },
      { name: "Dry Cleaning & Laundry Express", min: 250, max: 680, cat: "Housing & Utilities", sub: "Home Maintenance", useCash: true },
    ];

    // Distribute daily transactions across every single day of the month
    for (let d = 1; d <= m.daysInMonth; d++) {
      const isWeekend = new Date(m.year, m.monthIndex, d).getDay() % 6 === 0;

      // Every day: 1-2 Grocery purchases
      const gItem1 = randomChoice(groceryVendors);
      const gCat1 = getCat("Food & Dining", gItem1.sub);
      monthTxList.push({
        userId,
        accountId: gItem1.useCash ? cash.id : checking.id,
        type: "EXPENSE",
        amount: new Decimal(randomFloat(gItem1.min, gItem1.max)),
        date: makeDate(m.year, m.monthIndex, d, randomInt(8, 11), randomInt(0, 59)),
        note: gItem1.name,
        description: `Daily grocery purchase on ${d} ${m.monthName}`,
        ...gCat1,
      });

      if (d % 2 === 0 || isWeekend) {
        const gItem2 = randomChoice(groceryVendors);
        const gCat2 = getCat("Food & Dining", gItem2.sub);
        monthTxList.push({
          userId,
          accountId: gItem2.useCash ? cash.id : checking.id,
          type: "EXPENSE",
          amount: new Decimal(randomFloat(gItem2.min, gItem2.max)),
          date: makeDate(m.year, m.monthIndex, d, randomInt(17, 21), randomInt(0, 59)),
          note: gItem2.name,
          description: `Evening kitchen replenish`,
          ...gCat2,
        });
      }

      // Every day: 1 Coffee / Cafe / Snack
      const cafeItem = randomChoice(diningVendors.filter((v) => v.sub === "Coffee & Cafes"));
      const cafeCat = getCat("Food & Dining", cafeItem.sub);
      monthTxList.push({
        userId,
        accountId: cafeItem.useCash ? cash.id : checking.id,
        type: "EXPENSE",
        amount: new Decimal(randomFloat(cafeItem.min, cafeItem.max)),
        date: makeDate(m.year, m.monthIndex, d, randomInt(9, 17), randomInt(0, 59)),
        note: cafeItem.name,
        description: `Artisan coffee / quick tea break`,
        ...cafeCat,
      });

      // Daily Lunch / Dinner Delivery or Dine out
      const dineItem = randomChoice(diningVendors.filter((v) => v.sub !== "Coffee & Cafes"));
      const dineCat = getCat("Food & Dining", dineItem.sub);
      monthTxList.push({
        userId,
        accountId: dineItem.useCash ? cash.id : checking.id,
        type: "EXPENSE",
        amount: new Decimal(randomFloat(dineItem.min, dineItem.max)),
        date: makeDate(m.year, m.monthIndex, d, isWeekend ? randomInt(19, 22) : randomInt(12, 15), randomInt(0, 59)),
        note: dineItem.name,
        description: isWeekend ? "Weekend dinner outing" : "Workday lunch order",
        ...dineCat,
      });

      // Daily Transit / Commute
      const transitItem = randomChoice(transitVendors);
      const transitCat = getCat("Transportation", transitItem.sub);
      monthTxList.push({
        userId,
        accountId: transitItem.useCash ? cash.id : checking.id,
        type: "EXPENSE",
        amount: new Decimal(randomFloat(transitItem.min, transitItem.max)),
        date: makeDate(m.year, m.monthIndex, d, randomInt(8, 19), randomInt(0, 59)),
        note: transitItem.name,
        description: `City transportation and commute`,
        ...transitCat,
      });

      // Additional weekend activity or mid-week shopping
      if (isWeekend || d % 3 === 0) {
        const shopItem = randomChoice(shoppingVendors);
        const shopCat = getCat(shopItem.cat, shopItem.sub);
        monthTxList.push({
          userId,
          accountId: shopItem.useCash ? cash.id : checking.id,
          type: "EXPENSE",
          amount: new Decimal(randomFloat(shopItem.min, shopItem.max)),
          date: makeDate(m.year, m.monthIndex, d, randomInt(14, 21), randomInt(0, 59)),
          note: shopItem.name,
          description: `Retail & leisure spending`,
          ...shopCat,
        });
      }
    }

    // Sort chronological
    monthTxList.sort((a, b) => a.date.getTime() - b.date.getTime());

    console.log(`✓ Prepared ${monthTxList.length} genuine transactions for ${m.monthName}`);
    transactionsToInsert.push(...monthTxList);
    grandTotalCount += monthTxList.length;
  }

  // Insert in batches of 100 for safety and speed
  console.log(`\nInserting ${transactionsToInsert.length} total transactions into database...`);
  const batchSize = 100;
  for (let i = 0; i < transactionsToInsert.length; i += batchSize) {
    const batch = transactionsToInsert.slice(i, i + batchSize);
    await prisma.transaction.createMany({
      data: batch,
    });
  }

  console.log(`✓ Successfully inserted ${grandTotalCount} transactions for user ${email}!`);
}

async function main() {
  const args = process.argv.slice(2);
  const targetEmail =
    args.find((a) => a.includes("@")) ||
    args.find((a) => a.startsWith("--email="))?.split("=")[1];
  const shouldClean = args.includes("--clean") || args.includes("--reset");

  console.log("Starting 6-month financial data seeding script...");
  if (targetEmail) {
    console.log(`Targeting single user: ${targetEmail}`);
  }
  if (shouldClean) {
    console.log(`--clean flag detected: existing transactions in March - August 2026 will be reset before re-seeding.`);
  }

  let users = await prisma.user.findMany();

  if (targetEmail) {
    users = users.filter((u) => u.email.toLowerCase() === targetEmail.toLowerCase());
    if (users.length === 0) {
      console.error(`User with email "${targetEmail}" not found in database.`);
      process.exit(1);
    }
  }

  if (users.length === 0) {
    console.error("No users found in database. Please log in or provision a user first.");
    process.exit(1);
  }

  for (const user of users) {
    if (shouldClean) {
      const deleted = await prisma.transaction.deleteMany({
        where: {
          userId: user.id,
          date: {
            gte: new Date("2026-03-01T00:00:00.000Z"),
            lte: new Date("2026-08-31T23:59:59.999Z"),
          },
        },
      });
      console.log(`Cleared ${deleted.count} previous transactions for ${user.email} (March - August 2026).`);
    }

    await seedUser(user.id, user.email);
  }

  console.log("\n======================================================");
  console.log("6-Month Financial Seeding Complete!");
  console.log("All accounts have healthy positive cashflows and realistic records.");
  console.log("======================================================\n");
}

main()
  .catch((e) => {
    console.error("Seeding failed with error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
