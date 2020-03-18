import { Builder, By, Key, until, WebDriver } from "selenium-webdriver";
import { ServiceBuilder, Options } from "selenium-webdriver/chrome";
import Config from "./Config";
import { Client, TextChannel } from "discord.js";
import sha256 from "sha256";
import News, { getNewsId } from "../models/News";
import Homework, { getHomeworkId } from "../models/Homework";

export default abstract class KretaScraper
{
	public static driver: WebDriver;
	public static discord: Client;

	public static async run()
	{
		while (true)
		{
			try{
				if (!Config.isDevelopmentMode())
				{
					let options = new Options().addArguments("--headless").addArguments("--no-sandbox").addArguments("--disable-dev-shm-usage");
					this.driver = await new Builder().forBrowser("chrome").setChromeOptions(options).build();
				}
				else
				{
					this.driver = await new Builder().forBrowser("chrome").build();
				}

				try
				{
					await this.loginToKreta();
					await this.sleep(10000);
					console.log("Loop check start")
					while (true)
					{
						await this.loopCheck();
						await this.sleep(1000);
					}
				} finally
				{
					await this.driver.quit();
				}
			}
			catch (ex)
			{
				console.error("ran into an error,restarting");
				console.error(ex);
			}
		}
	}

	public static async isKretaLoaded(): Promise<boolean>
	{
		console.log("segg");
		try
		{
			await this.driver.findElement(By.css("html"));
			await this.sleep(1500);
			return true;
		}
		catch (ex)
		{
			console.log("segg fail", ex);
			return false;
		}
	}

	public static async loginToKreta()
	{
		let login = Config.getKretaLogin();
		await this.driver.get(login.url);
		await this.driver.wait(this.isKretaLoaded.bind(this), 4000);
		await this.sleep(1000);
		await this.driver.findElement(By.xpath('//*[@id="UserName"]')).sendKeys(login.username);
		await this.driver.findElement(By.xpath('//*[@id="Password"]')).sendKeys(login.password);
		await (await this.driver.findElement(By.xpath('//*[@id="btnSubmit"]'))).click();
	}

	public static async loopCheck()
	{
		console.log("Loop running.")
		await this.handleNews();
		console.log("news handled")

		await (await this.driver.findElement(By.xpath('//*[@id="layout_navigationBar"]/nav/div/div/button'))).click();
		await this.sleep(2000);
		await (await this.driver.findElement(By.xpath('//*[@id="mb1"]/li[1]/a'))).click();
		await this.sleep(4000);

		await this.handleHomework();
		await (await this.driver.findElement(By.xpath('//*[@id="layout_navbar_home"]'))).click();
		await this.sleep(4000);
		await this.driver.navigate().refresh();
	}

	public static async handleNews()
	{
		let news = await this.driver.findElements(By.css(".nb-item.highlighted.row.row-eq-height"));
		for (let ii = 0; ii < news.length; ii++)
		{
			let item = news[ii];
			let ll = await item.findElement(By.css(".subject"));
			let mg = await item.findElement(By.css(".content"));
			let author = await item.findElement(By.css(".footer>.author>.info>span>span"));
			await this.sendNewKretaNews({ subject: await ll.getText(), message: await mg.getText(), from: await author.getText() })
		}
	}

	public static async handleHomework()
	{
		let items = await this.driver.findElements(By.css(".fc-time-grid-event.fc-event"));
		console.log(items.length," classes found");
		for (let ii = 0; ii < items.length; ii++)
		{
			let hw = await items[ii].findElements(By.css(".fc-content>.fa-home"));
			if (hw.length > 0)
			{
				await items[ii].click();
				await this.driver.wait(async () =>
				{
					return (await this.driver.findElements(By.xpath('//*[@id="detailOraAdatokWindow_wnd_title"]'))).length > 0;
				}, 3000);
				await this.sleep(1000);
				//fetch infos
				let subj = await (await this.driver.findElement(By.xpath('//*[@id="OraAdatokDetailTabStrip-1"]/div/div[2]/div[2]/label'))).getText();
				let teacher = await (await this.driver.findElement(By.xpath('//*[@id="OraAdatokDetailTabStrip-1"]/div/div[3]/div[2]/label'))).getText();
				await (await this.driver.findElement(By.xpath('//*[@id="OraAdatokDetailTabStrip_container"]/ul/li[2]/span'))).click();

				await this.sleep(2000);
				let infos = await this.driver.findElement(By.xpath('//*[@id="OraAdatokDetailTabStrip-2"]/div[2]/div[1]/div/div[2]'));
				let txt = await infos.getText();
				let hw: Homework = {
					teacher: teacher,
					subject: subj,
					content: txt,
				};
				await this.sendHomework(hw);
				let winBtns = (await this.driver.findElements(By.css('.k-window-action.k-link')))
				if (winBtns.length > 0)
				{
					let lastWinBtn = winBtns[winBtns.length-1];
					await lastWinBtn.click();
				}

				await this.sleep(2000);
			}
		}
	}

	public static async didAlreadyPost(msgId: string, chn: TextChannel): Promise<boolean>
	{
		let pins = (await chn.fetchPinnedMessages()).map(xx => xx.content);
		for (let ii = 0; ii < pins.length; ii++)
		{
			let xx = pins[ii];
			try
			{
				let lines = xx.split("\n");
				let lastLine = lines[lines.length - 1];
				let tok = lastLine.split("id:")[1].trim();
				if (tok === msgId)
				{
					return true;
				}
			}
			catch{ }
		}
		return false;
	}

	public static async getInfoChannel(): Promise<TextChannel>
	{
		let dcInfo = Config.getDiscordInfo();
		await this.discord.syncGuilds();
		let guild = this.discord.guilds.find(ll => ll.id === dcInfo.server);
		let chn: TextChannel = guild.channels.find(xx => xx.id === dcInfo.room) as TextChannel;
		return chn;
	}

	public static async sendHomework(hw: Homework)
	{
		let chn = await this.getInfoChannel();
		let msgId = getHomeworkId(hw);

		if (!await this.didAlreadyPost(msgId, chn))
		{
			let rcont = hw.content.length >= 1800 ? hw.content.substr(0, 1800) + " ... túl hosszú" : hw.content;
			let body = `**Új 🏠i feladat felebarátaim:**\n**${hw.subject} - ${hw.teacher}**\n\`\`\`${rcont}\`\`\`\n\nid:${msgId}`;
			let msg = await chn.send(body);
			await msg.pin();
		}
	}

	public static async sendNewKretaNews(news: News)
	{
		let { subject, message, from } = news;
		let chn = await this.getInfoChannel();
		let msgId = getNewsId(news);

		if (!await this.didAlreadyPost(msgId, chn))
		{
			let body = `**Krétáról új hír felebarátaim:**\n*${subject}*\n\`\`\`${message}\`\`\`-${from}\n\nid:${msgId}`;
			if (body.length >= 2000)
			{
				body = `**Krétáról új hír felebarátaim:**\n*${subject}*\n\`\`\`${message.substr(0, 1750)} ... túl hosszú üzenet\`\`\`-${from}\n\nid:${msgId}`
			}

			let msg = await chn.send(body);
			await msg.pin();
		}
	}

	public static sleep(ms: number): Promise<void>
	{
		return new Promise((res, rej) => { setTimeout(res, ms) });
	}
}
