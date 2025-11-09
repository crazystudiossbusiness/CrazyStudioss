const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bot-info')
    .setDescription('Shows bot info'),
  name: 'bot-info',
  async execute(interaction, client) {
    const embed = new EmbedBuilder()
      .setTitle(`${client.user.username} — Info`)
      .addFields(
        { name: 'Uptime', value: `${Math.floor(client.uptime / 1000)}s`, inline: true },
        { name: 'Ping', value: `${Date.now() - interaction.createdTimestamp}ms`, inline: true }
      ).setTimestamp();
    await interaction.reply({ embeds: [embed] });
  }
};
