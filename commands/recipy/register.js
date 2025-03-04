const { SlashCommandBuilder } = require('@discordjs/builders');
const { InteractionResponseFlags } = require('discord-interactions');
const { write, exists } = require('../../database/rest')

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
		.setName('register')
		.setDescription('Registers that you can do the following enchant')
        .addStringOption(option =>
            option.setName('blacksmithing')
                .setDescription('Recipy to search for')
                .setAutocomplete(true))
        .addStringOption(option =>
            option.setName('enchanting')
                .setDescription('Recipy to search for')
                .setAutocomplete(true))
        .addStringOption(option =>
            option.setName('engineering')
                .setDescription('Recipy to search for')
                .setAutocomplete(true))
        .addStringOption(option =>
            option.setName('leatherworking')
                .setDescription('Recipy to search for')
                .setAutocomplete(true))       
        .addStringOption(option =>
            option.setName('tailoring')
                .setDescription('Recipy to search for')
                .setAutocomplete(true)),
    
    async autocomplete(interaction) {
		const focusedOption = interaction.data.options.find(option => option.focused);

        let recipies = jsonRecipies[focusedOption.name.toLowerCase()]; 
        const options = generateRecipyOptions(recipies);

        const filtered = options.filter(choice => choice.name.toLowerCase().includes(focusedOption.value.toLowerCase())).slice(0, 25);
		return interaction.respond(
			filtered,
		);
	},

    async execute(interaction, database) {
        const data = interaction.data.options;
        for(let i = 0; i < data.length; i++){
            const name = data[i].name;
            const value = data[i].value;

            let recipies = jsonRecipies[name.toLowerCase()]; 
            if(!!recipies.find(recipy => recipy.id == value)){
                if(!await exists(database, value, interaction.member.user.id)){
                    await write(database, value, interaction.member.user.id, name.toUpperCase());
                } else {
                    console.log("User already has that item registered");
                }             
            } else {
                console.log("Does not exits!");
            }
        }

		return interaction.reply({
            content: `Successfully registered recipies!`,
            flags: InteractionResponseFlags.EPHEMERAL
        });
	},
};

function generateRecipyOptions(recipies) {
    let options = [];
    for(let i = 0; i < recipies.length; i++){
        let recipy = recipies[i];
        options.push({name: recipy.name, value: String(recipy.id)});
    }

    return options;
}