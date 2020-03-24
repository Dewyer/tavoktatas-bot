import { Client, Message, VoiceChannel } from "discord.js";
import Config from "./Config";

export default abstract class TeachingService
{
	public static client:Client;

	public static async displayAbsence(msg:Message)
	{
		let SERVER_ID = Config.getDiscordInfo().server;

		await this.client.syncGuilds();
		let guild = this.client.guilds.find(xx=>xx.id === SERVER_ID);
		let members = (await guild.fetchMembers()).members.map(xx=>xx);
		let students = members.filter(x=>x.roles.some(xx=>xx.name === "Diák"));

		let voiceChannels = guild.channels.filter(xx=>xx.type === "voice").map(xx=>xx as VoiceChannel);

		let here = students.filter(xx=>voiceChannels.some(ll=>ll.members.some(aa=>aa.id === xx.id)))
		let absent = students.filter(xx=>!here.some(aa=>aa.id === xx.id));
		let herePart = here.map(xx => `*-${xx.nickname ? xx.nickname : xx.user.username}*`).join("\n");
		let absentPart = absent.map(xx =>`*-${xx.nickname ? xx.nickname : xx.user.username}*`).join("\n")
		let body = `**Noss kedves barátaim, ezek a felebarátok vannak itt (${here.length}/${students.length}) :**\n${herePart}\n **Ők hiányoznak :( (${absent.length}/${students.length}) :**\n${absentPart}`;
		msg.reply(body);
	}

}
