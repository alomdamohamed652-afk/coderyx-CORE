const { Events } = require("discord.js");
const dashboard = require("../utils/dashboard");
const commandRegistry = require("../utils/commandRegistry");
const embedCommand = require("../modules/moderation/commands/embed");

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, ctx) {
    if (interaction.isChatInputCommand()) {
      const command = commandRegistry.get(interaction.commandName);
      if (command) await command.execute(interaction, ctx);
      return;
    }

    if (interaction.isButton() && interaction.customId.startsWith("dashboard:")) {
      await dashboard.handleButton(interaction, ctx);
      return;
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith("embed_modal:")) {
      await embedCommand.handleModal(interaction, ctx);
    }
  }
};
