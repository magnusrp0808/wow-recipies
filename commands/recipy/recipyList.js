
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder } = require('@discordjs/builders');
const { ButtonStyle } = require("discord-api-types/v10")
const { getAllRecipies } = require('../../database/rest')
const { bold, underscore, mention } = require('../utility/formatting');
const blacksmithing  = require("../../data/blacksmithing.json");
const enchanting = require("../../data/enchanting.json");
const engineering = require("../../data/engineering.json");
const leatherworking = require("../../data/leatherworking.json");
const tailoring = require("../../data/tailoring.json");

const jsonRecipies = {
    blacksmithing,
    enchanting,
    engineering,
    leatherworking,
    tailoring
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('recipylist')
		.setDescription('Get a list with all known recipies and crafters'),

    async getContent(interaction, database) {
        const allRecipies = await getAllRecipies(database);
        const grouppedRecipies = groupBy(allRecipies, "type");
        const types = Object.keys(grouppedRecipies);
        let content = "";
        for(let i = 0; i < types.length; i++){
            const type = types[i];
            const parsedRecipies = jsonRecipies[type.toLowerCase()];
            content += `${underscore(bold(type))}\n`;
            const recipiesForType = grouppedRecipies[type];
            const recipyUsers = groupBy(recipiesForType, "itemId");
            const recipies = Object.keys(recipyUsers)
                .map(recipyId => parsedRecipies.find(recipy => recipy.id == recipyId))
                .filter(recipy => recipy != undefined)
                .sort((a, b) => a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1);
            for (let j = 0; j < recipies.length; j++){
                const recipy = recipies[j];
                const users = recipyUsers[String(recipy.id)].map(recipy => mention(recipy.user));
                content += `${bold(recipy.name)}: ${users.join(", ")}\n`;
            }
        }

        return content;
    },

    async execute(interaction, database) {
        const content = await this.getContent(interaction, database);
        const refresh = new ButtonBuilder()
            .setCustomId('refresh')
            .setLabel('Refresh')
            .setStyle(ButtonStyle.Primary);
        
        const row = new ActionRowBuilder()
            .addComponents(refresh);

		return interaction.reply({
            content: content,
            components: [row],
            allowed_mentions: { parse: [] }
        });
	},
};

function groupBy(list, key){
    return list.reduce((result, item) => {
        let itemKey = item[key];
        if (!result[itemKey]) result[itemKey] = [];
        result[itemKey].push(item);
        return result;
    }, {})
}