import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT || 6379),
});

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

// Función que reemplaza la anterior cacheGlobalSettings
export async function cacheGlobalSettings() {
  // Esta función ya no guarda nada en Redis
  // Solo actualiza la versión para invalidar caches antiguos
  const timestamp = Date.now();
  await redis.set('global_parameters_version', timestamp);
  return { success: true };
}

// Función que reemplaza la anterior getCachedGlobalSettings
export async function getCachedGlobalSettings() {
  // Ahora siempre obtiene datos frescos de la base de datos
  const commissions = await prisma.globalCommission.findMany({
    where: { isDefault: true }
  });
  
  const fixedExpenses = await prisma.globalFixedExpense.findMany({
    where: { isDefault: true }
  });
  
  return {
    commissions,
    fixedExpenses
  };
}

export default redis;

