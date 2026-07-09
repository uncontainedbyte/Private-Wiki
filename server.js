const http = require('node:http');
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "public");

let page_index = JSON.parse(fs.readFileSync("index.json", "utf8"));
const base_page = fs.readFileSync("base.html", "utf8");

function addPage(id, title) {
	page_index[id] = {
		title: title
	};
	
	fs.writeFileSync(
		"index.json",
		JSON.stringify(page_index, null, "\t"),
		"utf8"
	);
}

function findTitle(title){
	for(const id in page_index){
		if(page_index[id].title === title){
			return id;
		}
	}
	
	return "";
}
function getNextFreeID() {
	let id = 0;
	while(true){
		const str = id.toString().padStart(6, "0");
		if(!(str in page_index)){
			return str;
		}
		id++;
	}
}

function savePage(res,data){
	fs.writeFile("public/pages/"+data.id+".html", data.content, err => {
		if(err) throw err;
		
		res.end("Saved "+data.id+".html");
	});
	console.log("Saved "+data.id+".html");
}
function validTitle(res,data){
	let id = findTitle(data.title);
	
	if(id===""){
		res.writeHead(200);
		res.end("");
	}else{
		res.writeHead(403);
		res.end(id);
	}
}
function createPage(res,data){
	let id = findTitle(data.title);
	
	if(id===""){
		id = getNextFreeID();
		addPage(id,data.title);
		let html = base_page.replace("TITLE", data.title);
		html = html.replace("PAGE_ID", id);
		fs.writeFile("public/pages/"+id+".html", html, err => {
			if(err) throw err;
			res.writeHead(200);
			res.end(id);
		});
	}else{
		res.writeHead(403);
		res.end(id);
	}
}
function titleID(res,data){
	let id = findTitle(data.title);
	
	if(id===""){
		res.writeHead(403);
	}else{
		res.writeHead(200);
	}
	res.end(id);
}

http.createServer((req, res) => {
	const filePath = path.normalize(path.join(root, req.url));
	
	if(req.method === "GET"){
		if(!filePath.startsWith(root)){
			res.writeHead(403);
			res.end("Forbidden");
			return;
		}
		
		if(req.url === "/"){
			filePath = path.join(root, "index.html");
		}
		
		fs.readFile(filePath, (err, data) => {
			if(err){
				res.writeHead(404, { "Content-Type": "text/plain" });
				res.end("404 Not Found");
				return;
			}
			
			res.writeHead(200);
			res.end(data);
		});
	}else if(req.method === "POST"){
		let body = "";
		
		req.on("data", chunk => body += chunk);
		
		req.on("end", () => {
			const data = JSON.parse(body);
			
			switch(data.command){
				case "save":
					savePage(res,data);
					break;
				case "valid-title":
					validTitle(res,data);
					break;
				case "create-page":
					createPage(res,data);
					break;
				case "title-id":
					titleID(res,data);
					break;
				default:
					console.log("");
			}
		});
	}
}).listen(3000);

console.log("Listening on http://localhost:3000");
