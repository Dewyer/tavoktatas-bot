import { Message, Client, User, Game } from "discord.js";
import { Card } from "../@types";

const Discord = require("discord.js");
const xml = require("xml-parse");

export default abstract class UtilityService
{
	static client: Client;

	public static async rollDice(msg: Message, diceString: string)
	{
		let numberOf = parseInt(diceString.split('d')[0]);
		let diceType = parseInt(diceString.split('d')[1]);
		let rolls = [];
		for (let ii = 0; ii < numberOf; ii++)
		{
			rolls.push(this.getRndNumber(1, diceType));
		}
		let sum = rolls.reduce((total, curr) => { return (total + curr) });

		await msg.reply(`\`\`\`css\n Rolling ${numberOf} d ${diceType}.\`\`\`\n**Total**: *${sum}*\n*Rolls*:||${rolls.join(", ")}||`);
	}

	public static getRndNumber(min: number, max: number): number
	{
		return Math.floor(Math.random() * max) + min;
	}

}
