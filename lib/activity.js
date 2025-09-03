// Usuarios hardcodeados
const users = [
  {
    id: "clu0t4g0d0000l308lzctjatm",
    name: "Administracion",
    email: "administracion@autoentrada.com",
    password: "admin123",
    role: "ADMIN"
  },
  {
    id: "clu0t5c0d0001l308k4hqayvn",
    name: "Oriana",
    email: "oriana.gazzera@autoentrada.com",
    password: "user123",
    role: "ADMIN"
  },
  {
    id: "clu0t5c0d0001l308k4hqakln",
    name: "Federico",
    email: "federico.gonzalez@autoentrada.com",
    password: "user123",
    role: "ADMIN"
  },
  {
    id: "clu0t5c0d0001l308k4hvvxdln",
    name: "Jose",
    email: "jose.jones@autoentrada.com",
    password: "user123",
    role: "ADMIN"
  },  
  {
    id: "clu0t5c0d0001l308k4hvvxdl2n",
    name: "Paula",
    email: "paula.marina@autoentrada.com",
    password: "user123",
    role: "ADMIN"
  },
];

function findUserByEmail(email) {
  return users.find(user => user.email.toLowerCase() === email.toLowerCase());
}

function findUserById(id) {
  return users.find(user => user.id === id);
}

function validatePassword(inputPassword, storedPassword) {
  // Comparación directa (sin hashing)
  return inputPassword === storedPassword;
}

module.exports = {
  users,
  findUserByEmail,
  findUserById,
  validatePassword
}; 