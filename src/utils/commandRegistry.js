const commands = new Map();

/**
 * مكان واحد تتسجل فيه كل أوامر Slash (حالية ومستقبلية)، بدلاً من تكرار كود التسجيل والتوجيه
 * في كل مكان. أي Module جديد فيه أوامر يسجّلها هنا فقط، و src/events/ready.js يسجّلها كلها
 * مع Discord دفعة واحدة، و src/events/interactionCreate.js يوجّه كل تفاعل لمكانه الصحيح
 * بدون أي "if (commandName === ...)" متكرر.
 */
function register(data, execute) {
  commands.set(data.name, { data, execute });
}

function get(name) {
  return commands.get(name);
}

function getAll() {
  return [...commands.values()];
}

module.exports = { register, get, getAll };
