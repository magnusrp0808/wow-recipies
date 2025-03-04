const { SlashCommandBuilder } = require('@discordjs/builders');
import { InteractionResponseFlags } from 'discord-interactions';
const { write, getCrafters } = require('../../database/rest')
const { bold, mention } = require('../utility/formatting');
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
		.setName('crafters')
		.setDescription('Choose the item you want a crafter for')
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
        let contents = [];
        console.log(interaction.data.options)
        for(let i = 0; i < data.length; i++){
            const name = data[i].name;
            const value = data[i].value;

            let recipies = jsonRecipies[name.toLowerCase()]; 
            var recipy = recipies.find(recipy => String(recipy.id) == value);
            if(!!recipy){
                let crafters = (await getCrafters(database, value)).map(id => mention(id));
                contents.push(`${bold(recipy.name)}: ${crafters.length == 0 ? "None" : crafters.join(", ")}`);
            } else {
                console.log("Does not exits!");
            }
        }

		return interaction.reply({
            content: contents.length > 0 ? contents.join("\n") : "Something went wrong",
            flags: InteractionResponseFlags.EPHEMERAL,
            allowed_mentions: { parse: [] }
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