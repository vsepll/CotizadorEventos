import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT || 6379),
});

// Función para cachear commissions y fixed expenses
export async function cacheGlobalSettings() {
  const commissions = await prisma.globalCommission.findMany({
    where: { isDefault: true }
  });
  
  const fixedExpenses = await prisma.globalFixedExpense.findMany({
    where: { isDefault: true }
  });

  // Cachear por 24 horas
  await redis.set('default_commissions', JSON.stringify(commissions), 'EX', 86400);
  await redis.set('default_fixed_expenses', JSON.stringify(fixedExpenses), 'EX', 86400);
}

// Función para obtener settings cacheados
export async function getCachedGlobalSettings() {
  const cachedCommissions = await redis.get('default_commissions');
  const cachedFixedExpenses = await redis.get('default_fixed_expenses');

  if (cachedCommissions && cachedFixedExpenses) {
    return {
      commissions: JSON.parse(cachedCommissions),
      fixedExpenses: JSON.parse(cachedFixedExpenses)
    };
  }

  // Si no hay caché, buscar y cachear
  await cacheGlobalSettings();
  return getCachedGlobalSettings();
}

export default redis;

