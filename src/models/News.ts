import sha256 from "sha256";

export default interface News
{
	subject:string,
	message:string,
	from:string
}

export function getNewsId(news:News):string
{
	let msgId = sha256(JSON.stringify({subject:news.subject,message:news.message,from:news.from}));
	return msgId.substr(0,11);
}
