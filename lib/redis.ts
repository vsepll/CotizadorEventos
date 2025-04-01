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

// Función para invalidar el caché de cotizaciones
export async function invalidateQuotationCache() {
  try {
    // Obtener todas las claves que comienzan con 'quotation:'
    const keys = await redis.keys('quotation:*');
    
    if (keys.length > 0) {
      // Eliminar todas las claves encontradas
      await redis.del(...keys);
      console.log(`Caché de cotizaciones invalidado: ${keys.length} entradas eliminadas`);
    } else {
      console.log('No se encontraron cotizaciones en caché para invalidar');
    }
    
    // Actualizar la versión de los parámetros globales
    const timestamp = Date.now();
    await redis.set('global_parameters_version', timestamp);
    
    return { success: true, keysDeleted: keys.length, newVersion: timestamp };
  } catch (error) {
    console.error('Error al invalidar el caché de cotizaciones:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

// Función para obtener la versión actual de los parámetros globales
export async function getGlobalParametersVersion() {
  const version = await redis.get('global_parameters_version');
  return version ? parseInt(version) : null;
}

export default redis;

