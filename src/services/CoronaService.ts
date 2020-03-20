import { TextChannel, Client, Message } from "discord.js";
import fetch from "node-fetch";
import {parse} from "node-html-parser";
import CoronaStats from "../models/CoronaStats";

export default abstract class CoronaService
{
	static client:Client;

	public static async postCoronaStats(msg:Message)
	{
		let stats = await this.fetchCoronaSite();

		msg.reply(`**Így áll a szituáció felebarátaim:**\n*Beteg:* **${stats.ill}**\n*Gyógyult:* **${stats.healed}**\n*Elhunyt:* **${stats.dead}** *Emeljünk 🎩-ot nekik 😢*`);
	}

	private static async fetchCoronaSite() : Promise<CoronaStats>
	{
		let site = await fetch("https://koronavirus.gov.hu/");
		let html = await site.text();
		console.log(html);
		let doc = parse(html) as any as HTMLElement;

		let numbersNodeList = doc.querySelectorAll(".number");
		console.log(numbersNodeList.length)
		let numbersArray:number[] = [];
		for (let ii = 0; ii < numbersNodeList.length;ii++)
		{
			let content = numbersNodeList[ii].innerHTML.trim().replace(" ","");
			console.log(numbersNodeList[ii].innerHTML)
			if (content)
				numbersArray.push(parseInt(content));
		}

		console.log("korona numbers : ",numbersArray);

		return {ill:numbersArray[0],healed:numbersArray[1],dead:numbersArray[2],illGlobal:numbersArray[4],healedGlobal:numbersArray[5],deadGlobal:numbersArray[6]};
	}
}
