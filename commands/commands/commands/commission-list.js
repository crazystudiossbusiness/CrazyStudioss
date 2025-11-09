const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('commission-list')
    .setDescription('List open commission tickets'),
  name: 'commission-list',
  async execute(interaction) {
    const ticketsFile = path.join(__dirname, '..', 'tickets.json');
    if (!fs.existsSync(ticketsFile)) return interaction.reply({ content: 'No tickets tracking file found.', ephemeral: true });
    const data = JSON.parse(fs.readFileSync(ticketsFile, 'utf8'));
    const commissions = data.commission || [];

    if (commissions.length === 0) {
      return interaction.reply({ content: 'There are no open commission tickets.', ephemeral: true });
    }

    // Build a summary message (limit length)
    let message = `**Open Commission Tickets (${commissions.length})**\n\n`;
    for (const t of commissions.slice(-20).reverse()) {
      message += `• <#${t.id}> — <@${t.userId}> — ${t.what?.slice(0, 60) || 'No description'} — Due: ${t.deadline || 'N/A'}\n`;
    }

    await interaction.reply({ content: message, ephemeral: true });
  }
};
