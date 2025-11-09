const { SlashCommandBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('commission')
    .setDescription('Open a commission ticket'),
  name: 'commission',
  async execute(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('commissionModal')
      .setTitle('Commission Ticket');

    const whatInput = new TextInputBuilder()
      .setCustomId('commissionWhat')
      .setLabel('What do you want commissioned?')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMaxLength(1000);

    const whenInput = new TextInputBuilder()
      .setCustomId('commissionWhen')
      .setLabel('When do you need it done? (date/time)')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100);

    const refsInput = new TextInputBuilder()
      .setCustomId('commissionRefs')
      .setLabel('Reference links or details (optional)')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false)
      .setMaxLength(1000);

    const r1 = new ActionRowBuilder().addComponents(whatInput);
    const r2 = new ActionRowBuilder().addComponents(whenInput);
    const r3 = new ActionRowBuilder().addComponents(refsInput);
    modal.addComponents(r1, r2, r3);

    await interaction.showModal(modal);
  }
};
