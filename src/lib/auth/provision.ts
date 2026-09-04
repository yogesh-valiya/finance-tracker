import { prisma } from "@/lib/prisma";
import {
  DEFAULT_ACCOUNTS,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_EXPENSE_CATEGORIES,
} from "@/lib/constants/seed-data";
import { SessionUser } from "./session";

export async function provisionUser(sessionUser: SessionUser) {
  const existingUser = await prisma.user.findUnique({
    where: { firebaseUid: sessionUser.uid },
  });

  if (existingUser) {
    return existingUser;
  }

  // Atomically create user and seed all default data
  return prisma.$transaction(async (tx) => {
    // Double check inside transaction for race conditions
    const existing = await tx.user.findUnique({
      where: { firebaseUid: sessionUser.uid },
    });
    if (existing) return existing;

    // Check if user already exists with this email (e.g. seeded or created under a different/reset Firebase project)
    if (sessionUser.email) {
      const existingByEmail = await tx.user.findUnique({
        where: { email: sessionUser.email },
      });
      if (existingByEmail) {
        const existingSettings = await tx.userSettings.findUnique({
          where: { userId: existingByEmail.id },
        });
        if (!existingSettings) {
          await tx.userSettings.create({
            data: {
              userId: existingByEmail.id,
              baseCurrency: "INR",
              startScreen: "DAILY",
              monthlyStartDate: 1,
              weeklyStartDay: "MONDAY",
              carryOver: false,
              swipeGesture: "CHANGE_DATE",
              colorScheme: "SET_A",
              timeInput: "AUTO_STAMP",
              showDescription: false,
              autocomplete: true,
              inputOrder: "FROM_AMOUNT",
              noteButton: false,
              subcategoryEnabled: true,
              passcodeEnabled: false,
              reminderEnabled: false,
            },
          });
        }

        // Relink to the current Firebase UID
        return tx.user.update({
          where: { id: existingByEmail.id },
          data: {
            firebaseUid: sessionUser.uid,
            displayName: sessionUser.name || existingByEmail.displayName,
            avatarUrl: sessionUser.picture || existingByEmail.avatarUrl,
          },
        });
      }
    }

    const user = await tx.user.create({
      data: {
        firebaseUid: sessionUser.uid,
        email: sessionUser.email || `${sessionUser.uid}@example.com`,
        displayName: sessionUser.name || null,
        avatarUrl: sessionUser.picture || null,
        baseCurrency: "INR",
        settings: {
          create: {
            baseCurrency: "INR",
            startScreen: "DAILY",
            monthlyStartDate: 1,
            weeklyStartDay: "MONDAY",
            carryOver: false,
            swipeGesture: "CHANGE_DATE",
            colorScheme: "SET_A",
            timeInput: "AUTO_STAMP",
            showDescription: false,
            autocomplete: true,
            inputOrder: "FROM_AMOUNT",
            noteButton: false,
            subcategoryEnabled: true,
            passcodeEnabled: false,
            reminderEnabled: false,
          },
        },
      },
    });

    // 1. Seed Default Accounts
    for (let i = 0; i < DEFAULT_ACCOUNTS.length; i++) {
      const acc = DEFAULT_ACCOUNTS[i];
      await tx.account.create({
        data: {
          userId: user.id,
          name: acc.name,
          group: acc.group,
          initialBalance: acc.initialBalance,
          sortOrder: i,
          includeInTotals: true,
          isHidden: false,
        },
      });
    }

    // 2. Seed Default Income Categories & Subcategories
    for (let i = 0; i < DEFAULT_INCOME_CATEGORIES.length; i++) {
      const cat = DEFAULT_INCOME_CATEGORIES[i];
      const createdCategory = await tx.category.create({
        data: {
          userId: user.id,
          name: cat.name,
          emoji: cat.emoji,
          type: "INCOME",
          sortOrder: i,
          isDefault: true,
        },
      });

      for (let j = 0; j < cat.subcategories.length; j++) {
        await tx.subcategory.create({
          data: {
            categoryId: createdCategory.id,
            userId: user.id,
            name: cat.subcategories[j],
            sortOrder: j,
            isDefault: true,
          },
        });
      }
    }

    // 3. Seed Default Expense Categories & Subcategories
    for (let i = 0; i < DEFAULT_EXPENSE_CATEGORIES.length; i++) {
      const cat = DEFAULT_EXPENSE_CATEGORIES[i];
      const createdCategory = await tx.category.create({
        data: {
          userId: user.id,
          name: cat.name,
          emoji: cat.emoji,
          type: "EXPENSE",
          sortOrder: i,
          isDefault: true,
        },
      });

      for (let j = 0; j < cat.subcategories.length; j++) {
        await tx.subcategory.create({
          data: {
            categoryId: createdCategory.id,
            userId: user.id,
            name: cat.subcategories[j],
            sortOrder: j,
            isDefault: true,
          },
        });
      }
    }

    return user;
  });
}
