import * as ST from "./storage.js";


const blank_page_message = "this page is empty";


let Edit_Enabled = false;



async function setupPage(){
	let metaData = await ST.getMetaData();
	if(!metaData){
		const data = {
			title: "Home",
			content: "<div class=\"BLOCK paragraph\">"+blank_page_message+"</div>"
		};
		ST.savePage(0,data);
		
		metaData = {
			version:0,
			nextID: 1,
			pages:{
				lastOpenPage: 0,
				byID:{
					"0": "Home"
				},
				byTitle:{
					"Home": "0"
				}
			}
		};
		
		ST.setMetaData(metaData);
	}
	
	let id = metaData.pages.lastOpenPage;
	
	const params = new URLSearchParams(window.location.search);
	const page = Number(params.get("page") || "-1");
	if(page!==undefined&&page!==null&&page!==NaN&&page!==-1){
		if(Object.hasOwn(metaData.pages.byID,String(page))){
			id = page;
		}
	}
	if(page!==id){
		if(!Object.hasOwn(metaData.pages.byID,String(metaData.pages.lastOpenPage))){
			id = 0;
		}
	}
	
	await loadPage(id);
}
function getTimestamp(){
	const now = new Date();
	const timestamp =
		now.getFullYear() + "-" +
		String(now.getMonth() + 1).padStart(2, "0") + "-" +
		String(now.getDate()).padStart(2, "0") + "_" +
		String(now.getHours()).padStart(2, "0") + "-" +
		String(now.getMinutes()).padStart(2, "0") + "-" +
		String(now.getSeconds()).padStart(2, "0");
	return timestamp;
}

//SAVE
const SaveBtn = document.getElementById("save-btn");
SaveBtn.addEventListener("click", function(){
	savePage();
});
function savePage(){
	const C_DATA = Content.innerHTML;
	const T_DATA = Title.innerHTML;
	const id = Number(PageID.innerHTML);
	
	const data = {
		title: T_DATA,
		content: C_DATA,
		editing: Edit_Enabled
	};
	
	ST.savePage(id,data);
}

//LOAD
async function loadPage(id){
	let metaData = await ST.getMetaData();
	if(!metaData) return;
	
	metaData.pages.lastOpenPage = id;
	
	let page = await ST.loadPage(id);
	
	Content.innerHTML = page.content;
	Title.innerHTML = page.title;
	PageID.innerHTML = id;
	
	if(Object.hasOwn(page,"editing")){
		Edit_Enabled = page.editing;
	}else{ Edit_Enabled = false; }
	EditingUpdate()
	
	ST.setMetaData(metaData);
}

//CREATE
const CreatePageBtn = document.getElementById("create-page-btn");
CreatePageBtn.addEventListener("click", function(){
	popupTextInput();
	showPopup("Enter Page Title:", async text =>{
		if(text !== null){
			if(text==="") return;
			
			const metaData = await ST.getMetaData();
			if(!metaData) return;
			
			if(Object.hasOwn(metaData.pages.byTitle,text)) return;
			
			createPage(text);
		}
	});
});
async function createPage(title){
	const metaData = await ST.getMetaData();
	if(!metaData) return;
	
	const id = metaData.nextID;
	metaData.nextID += 1;
	
	metaData.pages.byID[String(id)] = title;
	metaData.pages.byTitle[title] = String(id);
	
	ST.setMetaData(metaData);
	
	const data = {title: title,content: "<div class=\"BLOCK paragraph\">"+blank_page_message+"</div>"};
	ST.savePage(id,data);
	
	window.location.href = `?page=${id}`;
}

//DELETE
const DeletePageBtn = document.getElementById("delete-page-btn");
DeletePageBtn.addEventListener("click", function(){
	const id = Number(PageID.innerHTML);
	
	if(id===0){
		popupInfo();
		showPopup("You Cant Delete The Home Page", async yes =>{});
		return;
	}
	popupYesNo();
	showPopup("Are you sure you want to delete this Page?", async yes =>{
		if(yes!==null){
			deletePage();
		}
	});
});
async function deletePage(){
	const title = Title.innerHTML;
	const id = Number(PageID.innerHTML);
	
	if(id===0) return;
	
	let metaData = await ST.getMetaData();
	if(!metaData) return;
	
	delete metaData.pages.byID[String(id)];
	delete metaData.pages.byTitle[title];
	
	ST.setMetaData(metaData);
	
	ST.deletePage(id);
	
	ST.loadPage(0);
}

//BACKUP
const BackupExportBtn = document.getElementById("backup-export-btn");
BackupExportBtn.addEventListener("click", async function(){
	const pages = await ST.getAllPages();
	const metaData = await ST.getMetaData();
	
	const backup = {
		meta: metaData,
		pages: pages
	};
	
	const json = JSON.stringify(backup, null, 2);
	
	//DOWNLOAD
	const blob = new Blob([json], { type: "application/json" });
	const a = document.createElement("a");
	a.href = URL.createObjectURL(blob);
	a.download = `backup_${getTimestamp()}.json`;
	a.click();
	URL.revokeObjectURL(a.href);
});
const BackupImportBtn = document.getElementById("backup-import-btn");
BackupImportBtn.addEventListener("click", async function(){
	const input = document.getElementById("fileInput");
	input.addEventListener("change", async () => {
		const file = input.files[0];
		if(!file) return;
		const text = await file.text();
		
		const backup = JSON.parse(text);
		
		ST.setMetaData(backup.meta);
		
		for(const page of backup.pages){
			await ST.savePage(page.id, page.value);
		}
	});
	input.click();
});




const SearchBox = document.getElementById("search-box");



const Menu = document.getElementById("menu");

const EditLockBtn = document.getElementById("edit-lock-btn");
const EditSign = document.getElementById("edit-sign");
const Content = document.getElementById("content");
const Title = document.getElementById("title");
const PageID = document.getElementById("page-id");

const LinkBtn = document.querySelector(".link-btn");
const NewLineBtn = document.querySelector(".newline-btn");
const DividerBtn = document.querySelector(".divider-btn");
const TableBtn = document.querySelector(".table-btn");

const RowAddBtn = document.querySelector(".rowA-btn");
const RowDelBtn = document.querySelector(".rowS-btn");
const ColumnAddBtn = document.querySelector(".colA-btn");
const ColumnDelBtn = document.querySelector(".colS-btn");

const DeleteBtn = document.querySelector(".delete-btn");
const ClearBtn = document.querySelector(".clear-btn");

const B_Btn = document.querySelector(".B-Btn");
const I_Btn = document.querySelector(".I-Btn");
const U_Btn = document.querySelector(".U-Btn");
const S_Btn = document.querySelector(".S-Btn");

const H1_Btn = document.querySelector(".H1-Btn");
const H2_Btn = document.querySelector(".H2-Btn");
const H3_Btn = document.querySelector(".H3-Btn");
const H4_Btn = document.querySelector(".H4-Btn");
const H5_Btn = document.querySelector(".H5-Btn");
const H6_Btn = document.querySelector(".H6-Btn");

SearchBox.disabled = true;

const Menu_Formatting   = document.getElementById("menu-text-formatting");
const Menu_Headings     = document.getElementById("menu-headings");
const Menu_DividerTable = document.getElementById("menu-divider-table");
const Menu_Link         = document.getElementById("menu-link");
const Menu_NewLine      = document.getElementById("menu-newline");
const Menu_RowCol       = document.getElementById("menu-row-col");
const Menu_Delete       = document.getElementById("menu-delete");
const Menu_Clear        = document.getElementById("menu-clear");

function disable_Menu(){
	Menu_Formatting.style.display  = "none";
	Menu_Headings.style.display    = "none";
	Menu_DividerTable.style.display= "none";
	Menu_Link.style.display        = "none";
	Menu_NewLine.style.display     = "none";
	Menu_RowCol.style.display      = "none";
	Menu_Delete.style.display      = "none";
	Menu_Clear.style.display       = "none";
}
function enable_ContentMenu(){
	Menu_Formatting.style.display  = "flex";
	Menu_Headings.style.display    = "flex";
	Menu_DividerTable.style.display= "flex";
	Menu_Link.style.display        = "flex";
	Menu_NewLine.style.display     = "none";
	Menu_RowCol.style.display      = "none";
	Menu_Delete.style.display      = "none";
	Menu_Clear.style.display       = "flex";
}
function enable_TableMenu(){
	Menu_Formatting.style.display  = "flex";
	Menu_Headings.style.display    = "none";
	Menu_DividerTable.style.display= "none";
	Menu_Link.style.display        = "flex";
	Menu_NewLine.style.display     = "flex";
	Menu_RowCol.style.display      = "flex";
	Menu_Delete.style.display      = "flex";
	Menu_Clear.style.display       = "flex";
}
function enable_LineMenu(){
	Menu_Formatting.style.display  = "none";
	Menu_Headings.style.display    = "none";
	Menu_DividerTable.style.display= "none";
	Menu_Link.style.display        = "none";
	Menu_NewLine.style.display     = "flex";
	Menu_RowCol.style.display      = "none";
	Menu_Delete.style.display      = "flex";
	Menu_Clear.style.display       = "none";
}

content.addEventListener("keydown", e => {
	if(e.key === "Backspace"){
		if(handleBackspace()){
			e.preventDefault();
	}}
	if(e.key === "Delete"){
		if(handleDelete()){
			e.preventDefault();
	}}
	if(e.key === "Enter"){
		if(handleEnter()){
			e.preventDefault();
	}}
	if(e.key === "ArrowUp"){
		if(handleArrowUp()){
			e.preventDefault();
	}}
	if(e.key === "ArrowDown"){
		if(handleArrowDown()){
			e.preventDefault();
	}}
	if(e.key === "ArrowLeft"){
		if(handleArrowLeft()){
			e.preventDefault();
	}}
	if(e.key === "ArrowRight"){
		if(handleArrowRight()){
			e.preventDefault();
	}}
});
function hasText(node){
	const walker = document.createTreeWalker(node,NodeFilter.SHOW_TEXT);
	return walker.nextNode() !== null;
}
function insideTable(range){
	let node = range.startContainer;
	
	if(node.nodeType === Node.TEXT_NODE){
		node = node.parentElement;
	}
	
	const cell = node.closest("td");
	
	if(cell){
		return true;
	}
	return false;
}
function deleteParagraphSelection(selection){
	
	const range = selection.getRangeAt(0).cloneRange();
	if(range.collapsed) return false;
	let node = range.startContainer;
	
	if(node.nodeType === Node.TEXT_NODE){
		node = node.parentElement;
	}
	
	let start = node.closest(".paragraph");
	if(!start) return true;
	
	let cur = start;
	while(cur){
		if(cur.classList.contains("paragraph")){
			let elmrange = document.createRange();
			elmrange.selectNodeContents(cur);
			const overlaps = range.intersectsNode(cur);
			const startIn = cur.contains(range.startContainer);
			const endIn   = cur.contains(range.endContainer);
			if(!overlaps){
				cur = cur.nextElementSibling;
			}else if(startIn&&endIn){
				const r = range.cloneRange();
				range.deleteContents();
				r.collapse(true);
				selection.removeAllRanges();
				selection.addRange(r);
				return true;
			}else if(startIn){
				elmrange.setStart(range.startContainer, range.startOffset);
				elmrange.deleteContents();
				cur = cur.nextElementSibling;
			}else if(endIn){
				elmrange.setEnd(range.endContainer, range.endOffset);
				elmrange.deleteContents();
				const r = range.cloneRange();
				r.collapse(true);
				selection.removeAllRanges();
				selection.addRange(r);
				start.append(...Array.from(cur.childNodes));
				cur.remove();
				return true;
			}else{
				let tmp = cur;
				cur = tmp.nextElementSibling;
				tmp.remove();
			}
		}else{
			let next = cur.nextElementSibling;
			while(next && !next.classList.contains("paragraph")){
				next = next.nextElementSibling;
			}
			cur = next;
		}
	}
	return true;
}
function handleBackspace(){
	const selection = window.getSelection();
	if(!selection.rangeCount) return false;
	
	if(deleteParagraphSelection(selection)) return true;
	
	const range = selection.getRangeAt(0).cloneRange();
	let node = range.startContainer;
	
	if(node.nodeType === Node.TEXT_NODE){
		node = node.parentElement;
	}
	
	const paragraph = node.closest(".paragraph");
	if(!paragraph) return false;
	
	const test = range.cloneRange();
	range.selectNodeContents(paragraph);
	range.setEnd(test.startContainer, test.startOffset);
	
	const atStart = range.toString() === "";
	if(!atStart) return false;
	
	const current = paragraph;
	let previous = current.previousElementSibling;
	
	while(previous && !previous.classList.contains("paragraph")){
		previous = previous.previousElementSibling;
	}
	
	if(!previous) return true;
	
	const afterRange = document.createRange();
	afterRange.selectNodeContents(paragraph);
	afterRange.setStart(range.startContainer, range.startOffset);
	
	let HasText = false;
	if(hasText(paragraph)) HasText = true;
	
	const fragment = afterRange.extractContents();
	
	paragraph.remove();
	
	const newRange = document.createRange();
	
	newRange.selectNodeContents(previous);
	newRange.collapse(false);
	
	if(!hasText(previous)){
		previous.innerHTML = "";
		previous.appendChild(fragment);
	}else if(HasText){ previous.appendChild(fragment); }
	
	selection.removeAllRanges();
	selection.addRange(newRange);
	
	return true;
}
function handleDelete(){
	const selection = window.getSelection();
	if(!selection.rangeCount) return false;
	
	if(deleteParagraphSelection(selection)) return true;
	
	const range = selection.getRangeAt(0).cloneRange();
	let node = range.startContainer;
	
	if(node.nodeType === Node.TEXT_NODE){
		node = node.parentElement;
	}
	
	const paragraph = node.closest(".paragraph");
	if(!paragraph) return false;
	
	const endTest = range.cloneRange();
	endTest.selectNodeContents(paragraph);
	endTest.setStart(range.startContainer, range.startOffset);
	const atEnd = endTest.toString() === "";
	
	if(!atEnd) return false;
	
	const current = paragraph;
	let next = current.nextElementSibling;
	
	while(next && !next.classList.contains("paragraph")){
		next = next.nextElementSibling;
	}
	
	if(!next) return true;
	
	const afterRange = document.createRange();
	afterRange.selectNodeContents(next);
	
	let HasText = false;
	if(hasText(next)) HasText = true;
	
	const fragment = afterRange.extractContents();
	
	next.remove();
	
	const newRange = document.createRange();
	
	newRange.selectNodeContents(paragraph);
	newRange.collapse(false);
	
	if(!hasText(paragraph)){
		paragraph.innerHTML = "";
		paragraph.appendChild(fragment);
	}else if(HasText){ paragraph.appendChild(fragment); }
	
	selection.removeAllRanges();
	selection.addRange(newRange);
	
	return true;
}
function handleEnter(){
	const selection = window.getSelection();
	if(!selection.rangeCount) return false;
	
	deleteParagraphSelection(selection);
	
	const range = selection.getRangeAt(0).cloneRange();
	let node = range.startContainer;
	
	if(node.nodeType === Node.TEXT_NODE){
		node = node.parentElement;
	}
	
	const paragraph = node.closest(".paragraph");
	if(!paragraph) return false;
	
	const startTest = range.cloneRange();
	startTest.selectNodeContents(paragraph);
	startTest.setEnd(range.startContainer, range.startOffset);
	const atStart = startTest.toString() === "";
	
	const endTest = range.cloneRange();
	endTest.selectNodeContents(paragraph);
	endTest.setStart(range.startContainer, range.startOffset);
	const atEnd = endTest.toString() === "";
	
	let newParagraph = null;
	if(atEnd){
		newParagraph = document.createElement("div");
		newParagraph.className = "BLOCK paragraph";
		newParagraph.appendChild(document.createElement("br"));
	}else if(atStart){
		newParagraph = document.createElement("div");
		newParagraph.className = "BLOCK paragraph";
		newParagraph.append(...Array.from(paragraph.childNodes));
		paragraph.appendChild(document.createElement("br"));
	}else{
		const afterRange = document.createRange();
		afterRange.selectNodeContents(paragraph);
		afterRange.setStart(range.startContainer, range.startOffset);
		
		const fragment = afterRange.extractContents();
		
		newParagraph = document.createElement("div");
		newParagraph.className = "BLOCK paragraph";
		newParagraph.appendChild(fragment);
	}
	
	paragraph.after(newParagraph);
	
	const newRange = document.createRange();
	
	newRange.selectNodeContents(newParagraph);
	newRange.collapse(true);
	
	selection.removeAllRanges();
	selection.addRange(newRange);
	
	return true;
}
function handleArrowUp(){
	const selection = window.getSelection();
	if(!selection.rangeCount) return false;
	
	const range = selection.getRangeAt(0).cloneRange();
	if(!range.collapsed) return false;
	
	if(insideTable(range)){
		return Table_handleArrowUp(selection,range);
	}
	
	let node = range.startContainer;
	
	if(node.nodeType === Node.TEXT_NODE){
		node = node.parentElement;
	}
	
	const paragraph = node.closest(".paragraph");
	if(!paragraph) return false;
	
	let previous = paragraph.previousElementSibling;
	
	while(previous && !previous.classList.contains("paragraph")){
		previous = previous.previousElementSibling;
	}
	
	if(!previous) return true;
	
	const before = document.createRange();
	before.selectNodeContents(paragraph);
	before.setEnd(range.startContainer, range.startOffset);
	const offset = before.toString().length;
	
	const walker = document.createTreeWalker(previous,NodeFilter.SHOW_TEXT);
	let remaining = offset;
	let textNode;
	
	while((textNode = walker.nextNode())){
		if(remaining <= textNode.length) break;
		remaining -= textNode.length;
	}
	
	const newRange = document.createRange();
	if(textNode){
		newRange.setStart(textNode, remaining);
	}else{
		newRange.selectNodeContents(previous);
		newRange.collapse(false);
	}
	newRange.collapse(true);
	selection.removeAllRanges();
	selection.addRange(newRange);
	
	return true;
}
function handleArrowDown(){
	const selection = window.getSelection();
	if(!selection.rangeCount) return false;
	
	const range = selection.getRangeAt(0).cloneRange();
	if(!range.collapsed) return false;
	
	if(insideTable(range)){
		return Table_handleArrowDown(selection,range);
	}
	
	let node = range.startContainer;
	
	if(node.nodeType === Node.TEXT_NODE){
		node = node.parentElement;
	}
	
	const paragraph = node.closest(".paragraph");
	if(!paragraph) return false;
	
	let next = paragraph.nextElementSibling;
	
	while(next && !next.classList.contains("paragraph")){
		next = next.nextElementSibling;
	}
	
	if(!next) return true;
	
	const before = document.createRange();
	before.selectNodeContents(paragraph);
	before.setEnd(range.startContainer, range.startOffset);
	const offset = before.toString().length;
	
	const walker = document.createTreeWalker(next,NodeFilter.SHOW_TEXT);
	let remaining = offset;
	let textNode;
	
	while((textNode = walker.nextNode())){
		if(remaining <= textNode.length) break;
		remaining -= textNode.length;
	}
	
	const newRange = document.createRange();
	if(textNode){
		newRange.setStart(textNode, remaining);
	}else{
		newRange.selectNodeContents(next);
		newRange.collapse(false);
	}
	newRange.collapse(true);
	selection.removeAllRanges();
	selection.addRange(newRange);
	
	return true;
}
function handleArrowLeft(){
	const selection = window.getSelection();
	if(!selection.rangeCount) return false;
	
	const range = selection.getRangeAt(0).cloneRange();
	if(!range.collapsed) return false;
	
	if(insideTable(range)){
		return Table_handleArrowLeft(selection,range);
	}
	
	let node = range.startContainer;
	if(node.nodeType === Node.TEXT_NODE){
		node = node.parentElement;
	}
	
	const paragraph = node.closest(".paragraph");
	if(!paragraph) return false;
	
	const test = range.cloneRange();
	range.selectNodeContents(paragraph);
	range.setEnd(test.startContainer, test.startOffset);
	const atStart = range.toString() === "";
	if(!atStart) return false;
	
	let previous = paragraph.previousElementSibling;
	while(previous && !previous.classList.contains("paragraph")){
		previous = previous.previousElementSibling;
	}
	if(!previous) return true;
	
	const newRange = document.createRange();
	newRange.selectNodeContents(previous);
	newRange.collapse(false);
	selection.removeAllRanges();
	selection.addRange(newRange);
	
	return true;
}
function handleArrowRight(){
	const selection = window.getSelection();
	if(!selection.rangeCount) return false;
	
	const range = selection.getRangeAt(0).cloneRange();
	if(!range.collapsed) return false;
	
	if(insideTable(range)){
		return Table_handleArrowRight(selection,range);
	}
	
	let node = range.startContainer;
	if(node.nodeType === Node.TEXT_NODE){
		node = node.parentElement;
	}
	
	const paragraph = node.closest(".paragraph");
	if(!paragraph) return false;
	
	const endTest = range.cloneRange();
	endTest.selectNodeContents(paragraph);
	endTest.setStart(range.startContainer, range.startOffset);
	const atEnd = endTest.toString() === "";
	if(!atEnd) return false;
	
	let next = paragraph.nextElementSibling;
	while(next && !next.classList.contains("paragraph")){
		next = next.nextElementSibling;
	}
	if(!next) return true;
	
	const newRange = document.createRange();
	newRange.selectNodeContents(next);
	newRange.collapse(true);
	selection.removeAllRanges();
	selection.addRange(newRange);
	
	return true;
}

function setTableEditing(enabled){
	const tds = content.querySelectorAll("td");
	
	for(const td of tds){
		td.contentEditable = enabled ? "true" : "false";
	}
}
EditLockBtn.addEventListener("click", function(){
	Edit_Enabled = !Edit_Enabled;
	
	EditingUpdate();
});
function EditingUpdate(){
	if(Edit_Enabled===true){
		Content.contentEditable = "true";
		EditSign.hidden = false;
		setTableEditing(true);
	}else{
		Content.contentEditable = "false";
		EditSign.hidden = true;
		setTableEditing(false);
	}
}

document.addEventListener('contextmenu', function(e){
	if(Edit_Enabled){ e.preventDefault(); }
});
document.addEventListener("mousedown", function (event) {
	if(Edit_Enabled){
		if(event.button === 2){
			const inside = event.target.closest("#content");
			if(!inside){
				disable_Menu();
			}
			displayMenu();
		}
	}
});
document.addEventListener("mouseup", function (event) {
	if(Edit_Enabled){
		if(event.button === 2){
		}else{ Menu.style.display = "none"; }
	}
});
content.addEventListener("mousedown", event => {
	if(event.button !== 2){ return; };
	
	const divider = event.target.closest(".divider");
	if(divider){
		CurrentBlock = packET(divider,"divider");
		enable_LineMenu();
		return;
	}
	
	const table = event.target.closest(".table");
	if(table){
		CurrentBlock = packET(table,"table");
		CurrentBlock.cell = event.target.closest("td");
		enable_TableMenu();
		return;
	}
	
	const paragraph = event.target.closest(".paragraph");
	if(paragraph){
		CurrentBlock = packET(paragraph,"paragraph");
		enable_ContentMenu();
		return;
	}
});

function displayMenu(){
	Menu.style.display = "block";
	Menu.style.top = event.clientY + 'px';
	Menu.style.left = event.clientX + 'px';
	
	const rect = Menu.getBoundingClientRect();
	
	if(window.innerWidth < event.clientX + rect.width){
		Menu.style.left = event.clientX - rect.width + 'px';
	}
	if(window.innerHeight < event.clientY + rect.height){
		Menu.style.top = event.clientY - rect.height + 'px';
	}
}



let CurrentBlock = null;

//NEWLINE
NewLineBtn.addEventListener("click", function(){
	if(!CurrentBlock) return;
	
	paragraph = document.createElement("div");
	paragraph.className = "BLOCK paragraph";
	paragraph.appendChild(document.createElement("br"));
	
	paragraph.after(CurrentBlock.block.nextElementSibling);
	CurrentBlock.block.after(paragraph);
	
	const r = document.createRange();
	r.selectNodeContents(paragraph);
	r.collapse(true);
	window.getSelection().removeAllRanges();
	window.getSelection().addRange(r);
});

// DIVIDER
DividerBtn.addEventListener("click", function(){
	const divider = document.createElement("div");
	divider.className = "BLOCK divider";
	divider.contentEditable = "false";
	divider.addEventListener("mousedown", e => {
		e.preventDefault();
	});
	insertBlock(divider);
	CurrentBlock = packET(divider,"divider");
});
DeleteBtn.addEventListener("click", event => {
	if(!CurrentBlock) return;
	if(CurrentBlock.type!=="divider") return;
	
	CurrentBlock.block.remove();
	CurrentBlock = null;
});

//FORMATTING
 B_Btn.addEventListener("click", function(){wrapBasic("strong");});
 I_Btn.addEventListener("click", function(){wrapBasic("em");});
 U_Btn.addEventListener("click", function(){wrapBasic("u");});
 S_Btn.addEventListener("click", function(){wrapBasic("del");});
H1_Btn.addEventListener("click", function(){
	const elm = document.createElement("div");
	elm.className = "FORMAT Heading1";
	wrapAdvan(elm);
});
H2_Btn.addEventListener("click", function(){
	const elm = document.createElement("div");
	elm.className = "FORMAT Heading2";
	wrapAdvan(elm);
});
H3_Btn.addEventListener("click", function(){
	const elm = document.createElement("div");
	elm.className = "FORMAT Heading3";
	wrapAdvan(elm);
});
H4_Btn.addEventListener("click", function(){
	const elm = document.createElement("div");
	elm.className = "FORMAT Heading4";
	wrapAdvan(elm);
});
H5_Btn.addEventListener("click", function(){
	const elm = document.createElement("div");
	elm.className = "FORMAT Heading5";
	wrapAdvan(elm);
});
H6_Btn.addEventListener("click", function(){
	const elm = document.createElement("div");
	elm.className = "FORMAT Heading6";
	wrapAdvan(elm);
});
ClearBtn.addEventListener("click", function(){
	const selection = window.getSelection();
	if(!selection.rangeCount) return;
	const range = selection.getRangeAt(0);
	if(!content.contains(range.commonAncestorContainer)) return;
	const walker = document.createTreeWalker(content,NodeFilter.SHOW_ELEMENT);
	
	const toRemove = [];
	while(walker.nextNode()){
		const node = walker.currentNode;
		
		if(node.classList.contains("FORMAT") && range.intersectsNode(node)){
			toRemove.push(node);
		}
	}
	
	for(const elm of toRemove){
		while(elm.firstChild){
			elm.parentNode.insertBefore(elm.firstChild, elm);
		}
		elm.remove();
	}
});

//TABLE
TableBtn.addEventListener("click", function(){
	const table = document.createElement("table");
	table.className = "BLOCK table";
	table.innerHTML = `<tr><td contentEditable="true"><br></td></tr>`;
	table.contentEditable = "false";
	insertBlock(table);
	CurrentBlock = packET(table,"table");
});
DeleteBtn.addEventListener("click", function(){
	if(!CurrentBlock) return;
	if(CurrentBlock.type!=="table") return;
	
	CurrentBlock.block.remove();
	CurrentBlock = null;
});
RowAddBtn.addEventListener("click", function(){
	if(!CurrentBlock) return;
	if(CurrentBlock.type!=="table") return;
	if(!CurrentBlock.block || !CurrentBlock.cell) return;
	
	const row = CurrentBlock.cell.parentElement;
	const newRow = row.cloneNode(true);
	
	for(const cell of newRow.cells){
		cell.contentEditable = "true";
		cell.innerHTML = "<br>";
	}
	
	row.after(newRow);
});
RowDelBtn.addEventListener("click", function(){
	if(!CurrentBlock) return;
	if(CurrentBlock.type!=="table") return;
	if(!CurrentBlock.block || !CurrentBlock.cell) return;
	
	const row = CurrentBlock.cell.parentElement;
	
	if(CurrentBlock.block.rows.length <= 1) return;
	
	row.remove();
	
	CurrentBlock.cell = null;
});
ColumnAddBtn.addEventListener("click", function(){
	if(!CurrentBlock) return;
	if(CurrentBlock.type!=="table") return;
	if(!CurrentBlock.block || !CurrentBlock.cell) return;
	
	const col = CurrentBlock.cell.cellIndex;
	
	for(const row of CurrentBlock.block.rows){
		const cell = row.insertCell(col + 1);
		cell.contentEditable = "true";
		cell.innerHTML = "<br>";
	}
});
ColumnDelBtn.addEventListener("click", function(){
	if(!CurrentBlock) return;
	if(CurrentBlock.type!=="table") return;
	if(!CurrentBlock.block || !CurrentBlock.cell) return;
	
	const col = CurrentBlock.cell.cellIndex;
	
	if(CurrentBlock.block.rows[0].cells.length <= 1) return;
	
	for(const row of CurrentBlock.block.rows){
		row.deleteCell(col);
	}
	
	CurrentBlock.cell = null;
});
function Table_handleArrowUp(selection,range){
	
	let node = range.startContainer;
	
	if(node.nodeType === Node.TEXT_NODE){
		node = node.parentElement;
	}
	
	const cell = node.closest("td");
	if(!cell) return false;
	
	const row = cell.closest("tr");
	
	const previousRow = row.previousElementSibling;
	if(!previousRow) return true;
	
	const column = cell.cellIndex;
	const targetCell = previousRow.cells[column];
	if(!targetCell) return true;
	
	const before = document.createRange();
	before.selectNodeContents(cell);
	before.setEnd(range.startContainer, range.startOffset);
	const offset = before.toString().length;
	
	const walker = document.createTreeWalker(targetCell,NodeFilter.SHOW_TEXT);
	let remaining = offset;
	let textNode;
	
	while((textNode = walker.nextNode())){
		if(remaining <= textNode.length) break;
		remaining -= textNode.length;
	}
	
	const newRange = document.createRange();
	if(textNode){
		newRange.setStart(textNode, remaining);
	}else{
		newRange.selectNodeContents(targetCell);
		newRange.collapse(false);
	}
	newRange.collapse(true);
	selection.removeAllRanges();
	selection.addRange(newRange);
	
	return true;
}
function Table_handleArrowDown(selection,range){
	
	let node = range.startContainer;
	
	if(node.nodeType === Node.TEXT_NODE){
		node = node.parentElement;
	}
	
	const cell = node.closest("td");
	if(!cell) return false;
	
	const row = cell.closest("tr");
	
	const nextRow = row.nextElementSibling;
	if(!nextRow) return true;
	
	const column = cell.cellIndex;
	const targetCell = nextRow.cells[column];
	if(!targetCell) return true;
	
	const before = document.createRange();
	before.selectNodeContents(cell);
	before.setEnd(range.startContainer, range.startOffset);
	const offset = before.toString().length;
	
	const walker = document.createTreeWalker(targetCell,NodeFilter.SHOW_TEXT);
	let remaining = offset;
	let textNode;
	
	while((textNode = walker.nextNode())){
		if(remaining <= textNode.length) break;
		remaining -= textNode.length;
	}
	
	const newRange = document.createRange();
	if(textNode){
		newRange.setStart(textNode, remaining);
	}else{
		newRange.selectNodeContents(targetCell);
		newRange.collapse(false);
	}
	newRange.collapse(true);
	selection.removeAllRanges();
	selection.addRange(newRange);
	
	return true;
}
function Table_handleArrowLeft(selection,range){
	
	let node = range.startContainer;
	if(node.nodeType === Node.TEXT_NODE){
		node = node.parentElement;
	}
	
	const cell = node.closest("td");
	if(!cell) return false;
	
	const row = cell.parentElement;
	const index = cell.cellIndex;
	
	const test = range.cloneRange();
	range.selectNodeContents(cell);
	range.setEnd(test.startContainer, test.startOffset);
	const atStart = range.toString() === "";
	if(!atStart) return false;
	
	let targetCell;
	if(index > 0){
		targetCell = row.cells[index - 1];
	}else{
		const previousRow = row.previousElementSibling;
		if(!previousRow) return true;
		
		targetCell = previousRow.cells[previousRow.cells.length - 1];
	}
	
	const newRange = document.createRange();
	newRange.selectNodeContents(targetCell);
	newRange.collapse(false);
	selection.removeAllRanges();
	selection.addRange(newRange);
	
	return true;
}
function Table_handleArrowRight(selection,range){
	
	let node = range.startContainer;
	if(node.nodeType === Node.TEXT_NODE){
		node = node.parentElement;
	}
	
	const cell = node.closest("td");
	if(!cell) return false;
	
	const endTest = range.cloneRange();
	endTest.selectNodeContents(cell);
	endTest.setStart(range.startContainer, range.startOffset);
	const atEnd = endTest.toString() === "";
	if(!atEnd) return false;
	
	const row = cell.parentElement;
	const index = cell.cellIndex;
	
	let targetCell;
	if(index < row.cells.length - 1){
		targetCell = row.cells[index + 1];
	}else{
		const nextRow = row.nextElementSibling;
		if(!nextRow) return true;
		
		targetCell = nextRow.cells[0];
	}
	
	const newRange = document.createRange();
	newRange.selectNodeContents(targetCell);
	newRange.collapse(true);
	selection.removeAllRanges();
	selection.addRange(newRange);
	
	return true;
}
function Table_wrapBasic(selection,range,fm){
	
	let node = range.startContainer;
	
	if(node.nodeType === Node.TEXT_NODE){
		node = node.parentElement;
	}
	
	let cell = node.closest("td");
	if(!cell) return true;
	
	const r = range.cloneRange();
	const format = document.createElement(fm);
	format.className = "FORMAT";
	const fragment = range.extractContents();
	format.appendChild(fragment);
	range.insertNode(format);
	r.collapse(true);
	selection.removeAllRanges();
	selection.addRange(r);
}
function Table_wrapAdvan(selection,range,elm){
	
	let node = range.startContainer;
	
	if(node.nodeType === Node.TEXT_NODE){
		node = node.parentElement;
	}
	
	let cell = node.closest("td");
	if(!cell) return true;
	
	const r = range.cloneRange();
	const fragment = range.extractContents();
	elm.appendChild(fragment);
	range.insertNode(elm);
	r.collapse(true);
	selection.removeAllRanges();
	selection.addRange(r);
}

//POPUP OVERLAY
const overlay = document.getElementById("overlay");
const popup = document.getElementById("popup");
const popup_input = document.getElementById("popupInput");
const popup_okBtn = document.getElementById("popup-okBtn");
const popup_cancelBtn = document.getElementById("popup-cancelBtn");
let popupCallback = null;
popup_input.addEventListener("keydown", (e) => {
	if(e.key !== "Enter") return;
	e.preventDefault();
	overlay.hidden = true;
	if(popupCallback) popupCallback(popup_input.value);
});
popup_okBtn.addEventListener("click", () => {
	overlay.hidden = true;
	if(popupCallback) popupCallback(popup_input.value);
});
popup_cancelBtn.addEventListener("click", () => {
	overlay.hidden = true;
	if(popupCallback) popupCallback(null);
});
function showPopup(label, callback) {
	popup.querySelector("label").textContent = label;
	popup_input.value = "";
	overlay.hidden = false;
	popup_input.focus();
	popupCallback = callback;
}
function popupYesNo(){
	popup_okBtn.innerHTML = "Yes";
	popup_cancelBtn.innerHTML = "No";
	popup_input.hidden = true;
	popup_cancelBtn.hidden = false;
}
function popupTextInput(){
	popup_okBtn.innerHTML = "Ok";
	popup_cancelBtn.innerHTML = "Cancel";
	popup_input.hidden = false;
	popup_cancelBtn.hidden = false;
}
function popupInfo(){
	popup_okBtn.innerHTML = "Ok";
	popup_input.hidden = true;
	popup_cancelBtn.hidden = true;
}

//LINK
function isURL(str){
	try{ new URL(str);
		return true;
	}catch{ return false; }
}
LinkBtn.addEventListener("click", function(){
	const selection = window.getSelection();
	if(!selection.rangeCount) return;
	const range = selection.getRangeAt(0).cloneRange();
	if(range.collapsed) return false;
	
	popupTextInput();
	showPopup("Enter Page Title:", async text =>{
		if(text !== null){
			if(text==="") return;
			
			if(isURL(text)){
				let format = document.createElement("a");
				format.href = text;
				format.className = "FORMAT";
				wrapAdvan(format,range);
				return;
			}
			
			const metaData = ST.getMetaData();
			let result = null;
			if(Object.hasOwn(metaData.pages.byTitle,text)){
				result = metaData.pages.byTitle[text];
			}
			
			if(result){
				const id = result;
				const link = `?page=${id}`;
				
				let format = document.createElement("a");
				format.href = link;
				format.className = "FORMAT";
				wrapAdvan(format,range);
			}
		}
	});
});



function splitParagraph(selection){
	const range = selection.getRangeAt(0).cloneRange();
	let node = range.startContainer;
	
	if(node.nodeType === Node.TEXT_NODE){
		node = node.parentElement;
	}
	
	let paragraph = node.closest(".paragraph");
	if(!paragraph) return null;
	
	const afterRange = document.createRange();
	afterRange.selectNodeContents(paragraph);
	afterRange.setStart(range.startContainer, range.startOffset);
	
	const fragment = afterRange.extractContents();
	
	const newParagraph = document.createElement("div");
	newParagraph.className = "BLOCK paragraph";
	newParagraph.appendChild(fragment);
	
	let test = range.cloneRange();
	test.selectNodeContents(paragraph);
	test.setEnd(range.startContainer, range.startOffset);
	let empty = test.toString().length === 0;
	if(empty){
		paragraph.innerHTML = "<br>";
	}
	
	test = range.cloneRange();
	test.selectNodeContents(newParagraph);
	test.setEnd(range.startContainer, range.startOffset);
	empty = test.toString().length === 0;
	if(empty){
		newParagraph.innerHTML = "<br>";
	}
	
	return {
		before: paragraph,
		after: newParagraph
	};
}
function insertBlock(block){
	const selection = window.getSelection();
	if(!selection.rangeCount) return false;
	
	deleteParagraphSelection(selection);
	
	const split = splitParagraph(selection);
	
	if(split){
		split.before.after(block);
		block.after(split.after);
		const r = document.createRange();
		r.selectNodeContents(split.after);
		r.collapse(true);
		selection.removeAllRanges();
		selection.addRange(r);
		return;
	}
	console.log("Failed To Add Block");
}
function wrapBasic(fm){
	const selection = window.getSelection();
	if(!selection.rangeCount) return false;
	const range = selection.getRangeAt(0).cloneRange();
	if(range.collapsed) return false;
	
	if(insideTable(range)){
		return Table_wrapBasic(selection,range,fm);
	}
	
	let node = range.startContainer;
	
	if(node.nodeType === Node.TEXT_NODE){
		node = node.parentElement;
	}
	
	let start = node.closest(".paragraph");
	if(!start) return true;
	
	let cur = start;
	while(cur){
		if(cur.classList.contains("paragraph")){
			let elmrange = document.createRange();
			elmrange.selectNodeContents(cur);
			const overlaps = range.intersectsNode(cur);
			const startIn = cur.contains(range.startContainer);
			const endIn   = cur.contains(range.endContainer);
			if(!overlaps){
				cur = cur.nextElementSibling;
			}else if(startIn&&endIn){
				const r = range.cloneRange();
				const format = document.createElement(fm);
				format.className = "FORMAT";
				const fragment = range.extractContents();
				format.appendChild(fragment);
				range.insertNode(format);
				r.collapse(true);
				selection.removeAllRanges();
				selection.addRange(r);
				return;
			}else if(startIn){
				elmrange.setStart(range.startContainer, range.startOffset);
				const format = document.createElement(fm);
				format.className = "FORMAT";
				const fragment = elmrange.extractContents();
				format.appendChild(fragment);
				elmrange.insertNode(format);
				cur = cur.nextElementSibling;
			}else if(endIn){
				elmrange.setEnd(range.endContainer, range.endOffset);
				const format = document.createElement(fm);
				format.className = "FORMAT";
				const fragment = elmrange.extractContents();
				format.appendChild(fragment);
				elmrange.insertNode(format);
				const r = range.cloneRange();
				r.collapse(true);
				selection.removeAllRanges();
				selection.addRange(r);
				return true;
			}else{
				const format = document.createElement(fm);
				format.className = "FORMAT";
				const fragment = elmrange.extractContents();
				format.appendChild(fragment);
				elmrange.insertNode(format);
				cur = cur.nextElementSibling;
			}
		}else{
			let next = cur.nextElementSibling;
			while(next && !next.classList.contains("paragraph")){
				next = next.nextElementSibling;
			}
			cur = next;
		}
	}
}
function wrapAdvan(elm,range=null){
	const selection = window.getSelection();
	if(range===null){
		if(!selection.rangeCount) return false;
		range = selection.getRangeAt(0).cloneRange();
	}
	if(range.collapsed) return false;
	
	if(insideTable(range)){
		return Table_wrapAdvan(selection,range,elm);
	}
	
	let node = range.startContainer;
	
	if(node.nodeType === Node.TEXT_NODE){
		node = node.parentElement;
	}
	
	let start = node.closest(".paragraph");
	if(!start) return true;
	
	let cur = start;
	while(cur){
		if(cur.classList.contains("paragraph")){
			let elmrange = document.createRange();
			elmrange.selectNodeContents(cur);
			const overlaps = range.intersectsNode(cur);
			const startIn = cur.contains(range.startContainer);
			const endIn   = cur.contains(range.endContainer);
			if(!overlaps){
				cur = cur.nextElementSibling;
			}else if(startIn&&endIn){
				const r = range.cloneRange();
				const fragment = range.extractContents();
				const format = elm.cloneNode(false);
				format.appendChild(fragment);
				range.insertNode(format);
				r.collapse(true);
				selection.removeAllRanges();
				selection.addRange(r);
				return;
			}else if(startIn){
				elmrange.setStart(range.startContainer, range.startOffset);
				const fragment = elmrange.extractContents();
				const format = elm.cloneNode(false);
				format.appendChild(fragment);
				elmrange.insertNode(format);
				cur = cur.nextElementSibling;
			}else if(endIn){
				elmrange.setEnd(range.endContainer, range.endOffset);
				const fragment = elmrange.extractContents();
				const format = elm.cloneNode(false);
				format.appendChild(fragment);
				elmrange.insertNode(format);
				const r = range.cloneRange();
				r.collapse(true);
				selection.removeAllRanges();
				selection.addRange(r);
				return true;
			}else{
				const fragment = elmrange.extractContents();
				const format = elm.cloneNode(false);
				format.appendChild(fragment);
				elmrange.insertNode(format);
				cur = cur.nextElementSibling;
			}
		}else{
			let next = cur.nextElementSibling;
			while(next && !next.classList.contains("paragraph")){
				next = next.nextElementSibling;
			}
			cur = next;
		}
	}
}

function packET(elm,type){
	return {block:elm,type:type};
}



setupPage();























































