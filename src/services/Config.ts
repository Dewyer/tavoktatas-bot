import { Executor } from "selenium-webdriver/http";

export default abstract class Config
{
	public static getDiscordToken(): string
	{
		let realToken = process.env["DC_TOKEN"];
		process.argv.forEach(function (val, index, array)
		{
			if (val == "dev")
			{
				console.log("Running dev mode.")
				realToken = process.env["DC_DEV_TOKEN"];
			}
		});
		if (!realToken)
			throw new Error("No discord token in env.");

		return realToken;
	}

	public static isDevelopmentMode(): boolean
	{
		return process.argv.some(xx => xx === "dev");
	}

	public static getKretaLogin(): { username: string, password: string, url: string }
	{
		let un = process.env["KRETA_USERNAME"];
		let pw = process.env["KRETA_PASSWORD"];
		let url = process.env["KRETA_URL"];

		if (un !== undefined && pw !== undefined && url !== undefined)
		{
			return { username: un, password: pw, url };
		}
		else
		{
			throw new Error("No kreta login.");
		}
	}

	public static getDiscordInfo(): { server: string, room: string }
	{
		let ss = process.env["SERVER_ID"];
		let room = process.env["INFO_ROOM_ID"];

		if (ss && room)
		{
			return { server: ss, room: room }
		}
		else
		{
			throw new Error("Discord settings not found");
		}
	}
}
