/**
 * The core server that runs on a Cloudflare worker.
 */

import { AutoRouter } from 'itty-router';
import {
  InteractionResponseType,
  InteractionType,
  verifyKey,
} from 'discord-interactions';

const craftersCommand = require('./commands/recipy/crafters');
const recipyListCommand = require('./commands/recipy/recipyList');
const registerCommand = require('./commands/recipy/register');

import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';

class JsonResponse extends Response {
  constructor(body, init) {
    const jsonBody = JSON.stringify(body);
    init = init || {
      headers: {
        'content-type': 'application/json;charset=UTF-8',
      },
    };
    super(jsonBody, init);
  }
}

const router = AutoRouter();
const firebaseConfig = require('./firebase.config.json')
import { Database } from 'firebase-firestore-lite';

const database = new Database({ projectId: firebaseConfig.projectId });
/**
 * A simple :wave: hello page to verify the worker is working.
 */
router.get('/', (request, env) => {
  return new Response(`👋 ${env.DISCORD_APPLICATION_ID}`);
});

/**
 * Main route for all requests sent from Discord.  All incoming messages will
 * include a JSON payload described here:
 * https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object
 */
router.post('/', async (request, env) => {
    const { isValid, interaction } = await server.verifyDiscordRequest(
        request,
        env,
    );

    if (!isValid || !interaction) {
        return new Response('Bad request signature.', { status: 401 });
    }

    console.log(interaction.type)

    if (interaction.type === InteractionType.PING) {
        // The `PING` message is used during the initial webhook handshake, and is
        // required to configure the webhook in the developer portal.
        return new JsonResponse({
            type: InteractionResponseType.PONG,
        });
    } else if (interaction.type === InteractionType.APPLICATION_COMMAND) {
        // Most user commands will come as `APPLICATION_COMMAND`.
        switch (interaction.data.name.toLowerCase()) {   
            case craftersCommand.data.name:
                return await craftersCommand.execute(interaction, database);
            case recipyListCommand.data.name:
                return await recipyListCommand.execute(interaction, database);
            case registerCommand.data.name:
                return await registerCommand.execute(interaction, database);
            default:
                return new JsonResponse({ error: 'Unknown Type' }, { status: 400 });
        }
    } else if (interaction.type == InteractionType.APPLICATION_COMMAND_AUTOCOMPLETE) {
        switch (interaction.data.name.toLowerCase()) {   
            case craftersCommand.data.name:
                return await craftersCommand.autocomplete(interaction);
            case recipyListCommand.data.name:
                return await recipyListCommand.autocomplete(interaction);
            case registerCommand.data.name:
                return await registerCommand.autocomplete(interaction);
            default:
                return new JsonResponse({ error: 'Unknown Type' }, { status: 400 });
        }
    } else if (interaction.type === InteractionType.MESSAGE_COMPONENT) {
        switch (interaction.data.custom_id.toLowerCase()) {   
            case "refresh":
                let content = await recipyListCommand.getContent(interaction, database);
                return new JsonResponse({
                    type: InteractionResponseType.UPDATE_MESSAGE,
                    data: {
                        content: content, 
                        allowed_mentions: { parse: [] }
                    }
                });
            default:
                return new JsonResponse({ error: 'Unknown Type' }, { status: 400 });
        }
    }

    console.error('Unknown Type');
    return new JsonResponse({ error: 'Unknown Type' }, { status: 400 });
});

router.all('*', () => new Response('Not Found.', { status: 404 }));

async function verifyDiscordRequest(request, env) {
    const signature = request.headers.get('x-signature-ed25519');
    const timestamp = request.headers.get('x-signature-timestamp');
    const body = await request.text();
    const isValidRequest =
    signature &&
    timestamp &&
    (await verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY));
    if (!isValidRequest) {
        return { isValid: false };
    }

    let interaction = JSON.parse(body);
    interaction.guild.members = interaction.guild.members ?? {};
    interaction.guild.members.cache = await getGuildMembers(interaction.guild_id, env);
    interaction.reply = function(data) {
        return new JsonResponse({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: data,
        });
    }
    interaction.respond = function(choices) {
        return new JsonResponse({
            type: InteractionResponseType.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT,
            data: { choices: choices },
        });
    }

    return { interaction: interaction, isValid: true };
}

async function getGuildMembers(guildId, env) {
    const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);
    return await rest.get(Routes.guildMembers(guildId));
}

const server = {
  verifyDiscordRequest,
  fetch: router.fetch
};

export default server;