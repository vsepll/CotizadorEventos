// Usuarios hardcodeados
const users = [
  {
    id: "clu0t4g0d0000l308lzctjatm",
    name: "Administrador",
    email: "admin@example.com",
    password: "admin123",
    role: "ADMIN"
  },
  {
    id: "clu0t5c0d0001l308k4hqayvn",
    name: "Usuario",
    email: "user@example.com",
    password: "user123",
    role: "USER"
  }
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