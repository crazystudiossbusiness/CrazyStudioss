const { SlashCommandBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('support')
    .setDescription('Open a support ticket'),
  name: 'support',
  async execute(interaction, client, config, ticketsFile) {
    const modal = new ModalBuilder()
      .setCustomId('supportModal')
      .setTitle('Support Ticket');

    const issueInput = new TextInputBuilder()
      .setCustomId('supportIssue')
      .setLabel("What do you need help with?")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100);

    const descInput = new TextInputBuilder()
      .setCustomId('supportDesc')
      .setLabel("Describe the issue")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMaxLength(1000);

    const firstRow = new ActionRowBuilder().addComponents(issueInput);
    const secondRow = new ActionRowBuilder().addComponents(descInput);
    modal.addComponents(firstRow, secondRow);

    await interaction.showModal(modal);
  }
};
