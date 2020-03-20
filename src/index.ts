import Discord, { TextChannel, Message } from "discord.js";
import UtilityService from "./services/utility";
import config from "./config.json";
import git from "git-last-commit";
import dotenv from "dotenv";
import KretaScraper from "./services/KretaScraper";
import Config from "./services/Config";
import CoronaService from "./services/CoronaService";

const client = new Discord.Client();
const moment = require('moment');
const fs = require("fs");
dotenv.config();

client.on("ready", () => {
	console.log(`Logged in as ${client.user.tag}!`);
	UtilityService.client = client;
	KretaScraper.discord = client;
	CoronaService.client = client;

	client.user.setActivity("A te betyár táv tanulási robotod !");
	//db.save();

	console.log("Got args:")
	process.argv.forEach((val, index, array)=> {
		console.log(index + ': ' + val);

		if (val == "runOnBuild")
		{
			onBuild();
		}
	});
});

async function onBuild()
{
	/*
	git.getLastCommit(async (err:string, commit:any) => {
		// read commit object properties
		let notifyChanels = ["418093216215203856"];
		let version = commit.shortHash;
		for (let ii = 0; ii < notifyChanels.length;ii++){
			let chn = client.channels.get(notifyChanels[ii]) as TextChannel;
			if (chn !== undefined)
				await chn.send(`**TtsBuddy new build has been deployed: ${version}**`);
		}

		//Kill
		process.exit(0);
	});*/

}

client.on("message", async message => {
	// and not get into a spam loop (we call that "botception").

	if(message.author.bot) return;
	// which is set in the configuration file.
	if(message.content.indexOf(config.prefix) !== 0) return;

	const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
	const command = args.shift()!.toLowerCase();

	if(command === "ping") {
		// Calculates ping between sending a message and editing it, giving a nice round-trip latency.
		// The second ping is an average latency between the bot and the websocket server (one-way, not round-trip)
		const m = await message.channel.send("Ping?") as Message;
		m.edit(`Pong! Késés au ${m.createdTimestamp - message.createdTimestamp}ms. API késés az ${Math.round(client.ping)}ms --köszönöm git csomópont`);
	}

	if (command === "d")
	{
		if (args.length ===1)
		{
			if ((/^([0-9]{1,3}(d)[1-9]{1}[0-9]{0,3})$/g).test(args[0]))
			{
				//Dice roll
				await UtilityService.rollDice(message,args[0]);
				return;
			}
		}
		else
		{
			await replyError(message,"Rossz argumentumok megadva a `=d` parancsnak. `!help` parancsal nézd meg az elérhető parancsokat.");
			return;
		}
	}

	if (command ==="help")
	{
		sendHelpGuide(message);
		message.delete();
	}

	if (command === "stats")
	{
		CoronaService.postCoronaStats(message);
	}


});

client.on('messageReactionAdd', async (reaction, user) => {
	console.log(`${user.username} reacted with "${reaction.emoji.name}".`);
	if (user.bot)
	{
		return;
	}
});

client.on('messageReactionRemove', async (reaction, user) => {
	console.log(`${user.username} removed their "${reaction.emoji.name}" reaction.`);
	if (user.bot)
	{
		return;
	}
	/*
	if (reaction.emoji.name === "🚩") {
		await lobbyManager.processJoinReaction(reaction,user,false);
	}*/
});

//channelPinsUpdate
/*
client.on('channelPinsUpdate', async (channel:TextChannel, time) => {
	try{
		let isActive = await lobbyManager.isThisUsedChannel(channel.id);
		if (isActive)
		{
			if (channel.lastMessage !== undefined)
			{
				if (channel.lastMessage.type === "PINS_ADD")
				{
					channel.lastMessage.delete();
				}
			}
		}
	}catch(ex)
	{
	}
});*/

async function replyError(msg:Message,text:string)
{
	let m1 = await msg.channel.send("**```diff\n- Buddy Error:\n! "+text +"```**");
}

async function sendHelpGuide(msg:Message)
{
	let chn = await msg.author.createDM();
	let helpBdy = fs.readFileSync(`${__dirname }/../help.md`,"utf8");
	let msgnew = await chn.send("@here " +helpBdy);
}

//Login

client.login(Config.getDiscordToken());
KretaScraper.run();
