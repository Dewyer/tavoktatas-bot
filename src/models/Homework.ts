import sha256 from "sha256";

export default interface Homework
{
	subject:string,
	teacher:string,
	content:string,
}

export function getHomeworkId(hw:Homework) : string
{
	let msgId = sha256(JSON.stringify({ subject: hw.subject,teacher:hw.teacher,content:hw.content }));
	return msgId.substr(0, 11);

}
