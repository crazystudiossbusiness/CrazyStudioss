require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, Partials, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionsBitField, ChannelType } = require('discord.js');

const config = require('./config.json');
const ticketsFile = path.join(__dirname, 'tickets.json');

if (!fs.existsSync(ticketsFile)) fs.writeFileSync(ticketsFile, JSON.stringify({ support: [], commission: [] }, null, 2));

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel]
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath)) {
  if (!file.endsWith('.js')) continue;
  const cmd = require(path.join(commandsPath, file));
  client.commands.set(cmd.name || cmd.data.name, cmd);
}

client.once('ready', () => {
  console.log(`${client.user.tag} ready`);
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction, client, config, ticketsFile);
    } catch (err) {
      console.error(err);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'There was an error while executing this command.', ephemeral: true });
      } else {
        await interaction.reply({ content: 'There was an error while executing this command.', ephemeral: true });
      }
    }
  } else if (interaction.type === 5 || interaction.isModalSubmit && interaction.customId) {
    // We'll handle modal submits below
  }
});

client.on('interactionCreate', async (interaction) => {
  // Handle modal submits
  if (!interaction.isModalSubmit()) return;

  const data = JSON.parse(fs.readFileSync(ticketsFile, 'utf8'));
  if (interaction.customId === 'supportModal') {
    const issue = interaction.fields.getTextInputValue('supportIssue');
    const desc = interaction.fields.getTextInputValue('supportDesc');

    // Create channel
    const guild = interaction.guild;
    let category = guild.channels.cache.find(c => c.name === config.ticketCategoryName && c.type === ChannelType.GuildCategory);
    if (!category) {
      category = await guild.channels.create({
        name: config.ticketCategoryName,
        type: ChannelType.GuildCategory
      });
    }
    const channelName = `${config.ticketChannelPrefix}${interaction.user.username.toLowerCase().replace(/[^a-z0-9-]/g, '')}-${Date.now().toString().slice(-4)}`;

    const supportRole = guild.roles.cache.find(r => r.name === config.supportRoleName);
    const staffRole = guild.roles.cache.find(r => r.name === config.staffRoleName);

    const everyone = guild.roles.everyone;

    const perms = [
      { id: everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
      { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
    ];
    if (supportRole) perms.push({ id: supportRole.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] });
    if (staffRole) perms.push({ id: staffRole.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] });

    const ticketChannel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites: perms
    });

    const ticket = {
      id: ticketChannel.id,
      userId: interaction.user.id,
      type: 'support',
      issue,
      description: desc,
      createdAt: new Date().toISOString()
    };
    data.support.push(ticket);
    fs.writeFileSync(ticketsFile, JSON.stringify(data, null, 2));

    await ticketChannel.send({
      content: `${interaction.user}, your support ticket has been created. ${supportRole ? `<@&${supportRole.id}>` : ''}`,
      embeds: [{
        title: 'Support Ticket',
        fields: [
          { name: 'Issue', value: issue || 'None' },
          { name: 'Description', value: desc || 'None' },
          { name: 'User', value: `<@${interaction.user.id}>` }
        ],
        timestamp: new Date()
      }]
    });

    await interaction.reply({ content: `Support ticket created: ${ticketChannel}`, ephemeral: true });
  } else if (interaction.customId === 'commissionModal') {
    const what = interaction.fields.getTextInputValue('commissionWhat');
    const when = interaction.fields.getTextInputValue('commissionWhen');
    const refs = interaction.fields.getTextInputValue('commissionRefs');

    const guild = interaction.guild;
    let category = guild.channels.cache.find(c => c.name === config.commissionCategoryName && c.type === ChannelType.GuildCategory);
    if (!category) {
      category = await guild.channels.create({
        name: config.commissionCategoryName,
        type: ChannelType.GuildCategory
      });
    }

    const channelName = `${config.commissionChannelPrefix}${interaction.user.username.toLowerCase().replace(/[^a-z0-9-]/g, '')}-${Date.now().toString().slice(-4)}`;

    const commissionRole = guild.roles.cache.find(r => r.name === config.commissionRoleName);
    const staffRole = guild.roles.cache.find(r => r.name === config.staffRoleName);
    const everyone = guild.roles.everyone;
    const perms = [
      { id: everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
      { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] }
    ];
    if (commissionRole) perms.push({ id: commissionRole.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] });
    if (staffRole) perms.push({ id: staffRole.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] });

    const ticketChannel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites: perms
    });

    const dataAll = JSON.parse(fs.readFileSync(ticketsFile, 'utf8'));
    const ticket = {
      id: ticketChannel.id,
      userId: interaction.user.id,
      type: 'commission',
      what,
      deadline: when,
      refs,
      createdAt: new Date().toISOString(),
      status: 'open'
    };
    dataAll.commission.push(ticket);
    fs.writeFileSync(ticketsFile, JSON.stringify(dataAll, null, 2));

    await ticketChannel.send({
      content: `${interaction.user}, your commission ticket has been created. ${commissionRole ? `<@&${commissionRole.id}>` : ''}`,
      embeds: [{
        title: 'Commission Ticket',
        fields: [
          { name: 'What', value: what || 'None' },
          { name: 'Deadline', value: when || 'None' },
          { name: 'References', value: refs || 'None' },
          { name: 'User', value: `<@${interaction.user.id}>` }
        ],
        timestamp: new Date()
      }]
    });

    await interaction.reply({ content: `Commission ticket created: ${ticketChannel}`, ephemeral: true });
  }
});

client.login(process.env.DISCORD_TOKEN);
