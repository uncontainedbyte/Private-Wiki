import * as ST from "./storage.js";


const blank_page_message = "this page is empty";


let Edit_Enabled = false;
let UndoStack = [];
let RedoStack = [];





function getClosest(range,elmName){
	let node = range.startContainer;
	
	if(node.nodeType === Node.TEXT_NODE){
		node = node.parentElement;
	}
	
	let cell = node.closest("td");
}
function getRange(selection){
	if(!selection.rangeCount) return null;
	return selection.getRangeAt(0).cloneRange();
}
function selectElm(elm){
	const r = document.createRange();
	r.selectNodeContents(elm);
	return r;
}
function setSelect(range,collapse){
	range.collapse(collapse);
	window.getSelection().removeAllRanges();
	window.getSelection().addRange(range);
}
function extractRange(paragraph,range,selectAll=false){
	const afterRange = document.createRange();
	afterRange.selectNodeContents(paragraph);
	if(!selectAll) afterRange.setStart(range.startContainer, range.startOffset);
	return afterRange.extractContents();
}
function isAtEnd(range,elm,isStart){
	const test = range.cloneRange();
	test.selectNodeContents(elm);
	if(!Start) test.setStart(range.startContainer, range.startOffset);
	if(Start) test.setEnd(range.startContainer, range.startOffset);
	return (test.toString() === "");
}
function getOffset(elm,range){
	const before = document.createRange();
	before.selectNodeContents(elm);
	before.setEnd(range.startContainer, range.startOffset);
	return before.toString().length;
}
function findNextElm(elm,type,isNext){
	let result = (isNext)?elm.nextElementSibling:elm.previousElementSibling;
	while(next && !result.classList.contains(type)){
		result = (isNext)?result.nextElementSibling:result.previousElementSibling;
	}
	return result;
}


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
const ImageBtn = document.querySelector(".image-btn");
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

const Copy_Btn = document.querySelector(".copy-btn");
const Paste_Btn= document.querySelector(".paste-btn");
const Cut_Btn  = document.querySelector(".cut-btn");
const Undo_Btn = document.querySelector(".undo-btn");
const Redo_Btn = document.querySelector(".redo-btn");

const H1_Btn = document.querySelector(".H1-Btn");
const H2_Btn = document.querySelector(".H2-Btn");
const H3_Btn = document.querySelector(".H3-Btn");
const H4_Btn = document.querySelector(".H4-Btn");
const H5_Btn = document.querySelector(".H5-Btn");
const H6_Btn = document.querySelector(".H6-Btn");

SearchBox.disabled = true;

const Menu_Formatting   = document.getElementById("menu-text-formatting");
const Menu_Headings     = document.getElementById("menu-headings");
const Menu_XCV          = document.getElementById("menu-XCV");
const Menu_UndoRedo     = document.getElementById("menu-undo-redo");
const Menu_DividerTable = document.getElementById("menu-divider-table");
const Menu_Image        = document.getElementById("menu-image");
const Menu_Link         = document.getElementById("menu-link");
const Menu_NewLine      = document.getElementById("menu-newline");
const Menu_RowCol       = document.getElementById("menu-row-col");
const Menu_Delete       = document.getElementById("menu-delete");
const Menu_Clear        = document.getElementById("menu-clear");

function disable_Menu(){
	Menu_UndoRedo.style.display    = "none";
	Menu_Formatting.style.display  = "none";
	Menu_Headings.style.display    = "none";
	Menu_XCV.style.display         = "none";
	Menu_DividerTable.style.display= "none";
	Menu_Link.style.display        = "none";
	Menu_Image.style.display       = "none";
	Menu_NewLine.style.display     = "none";
	Menu_RowCol.style.display      = "none";
	Menu_Delete.style.display      = "none";
	Menu_Clear.style.display       = "none";
}
function enable_ContentMenu(){
	Menu_UndoRedo.style.display    = "flex";
	Menu_Formatting.style.display  = "flex";
	Menu_Headings.style.display    = "flex";
	Menu_XCV.style.display         = "flex";
	Menu_DividerTable.style.display= "flex";
	Menu_Link.style.display        = "flex";
	Menu_Image.style.display       = "flex";
	Menu_NewLine.style.display     = "none";
	Menu_RowCol.style.display      = "none";
	Menu_Delete.style.display      = "none";
	Menu_Clear.style.display       = "flex";
}
function enable_TableMenu(){
	Menu_UndoRedo.style.display    = "flex";
	Menu_Formatting.style.display  = "flex";
	Menu_Headings.style.display    = "flex";
	Menu_XCV.style.display         = "flex";
	Menu_DividerTable.style.display= "none";
	Menu_Link.style.display        = "flex";
	Menu_Image.style.display       = "flex";
	Menu_NewLine.style.display     = "flex";
	Menu_RowCol.style.display      = "flex";
	Menu_Delete.style.display      = "flex";
	Menu_Clear.style.display       = "flex";
}
function enable_LineMenu(){
	Menu_UndoRedo.style.display    = "flex";
	Menu_Formatting.style.display  = "none";
	Menu_Headings.style.display    = "none";
	Menu_XCV.style.display         = "none";
	Menu_DividerTable.style.display= "none";
	Menu_Link.style.display        = "none";
	Menu_Image.style.display       = "none";
	Menu_NewLine.style.display     = "flex";
	Menu_RowCol.style.display      = "none";
	Menu_Delete.style.display      = "flex";
	Menu_Clear.style.display       = "none";
}
function enable_ImageMenu(){
	Menu_UndoRedo.style.display    = "flex";
	Menu_Formatting.style.display  = "none";
	Menu_Headings.style.display    = "none";
	Menu_XCV.style.display         = "none";
	Menu_DividerTable.style.display= "none";
	Menu_Link.style.display        = "none";
	Menu_Image.style.display       = "none";
	Menu_NewLine.style.display     = "flex";
	Menu_RowCol.style.display      = "none";
	Menu_Delete.style.display      = "flex";
	Menu_Clear.style.display       = "none";
}

//CTRL+C,V,X,S,D,Z,Y
document.addEventListener("keydown", e => {
	if(!event.ctrlKey) return;
	if(e.key.toLowerCase() === "s"){
		e.preventDefault();
		handleCtrlS();
	}
	if(!Edit_Enabled) return;
	if(e.key.toLowerCase() === "z"){
		if(handleCtrlZ()) e.preventDefault();
	}
	if(e.key.toLowerCase() === "y"){
		if(handleCtrlY()) e.preventDefault();
	}
});
document.addEventListener("keydown", e => {
	if(!Edit_Enabled) return;
	if(!event.ctrlKey) return;
	if(e.key.toLowerCase() === "d"){
		if(handleCtrlD()) e.preventDefault();
	}
});
document.addEventListener("copy", async (event) => {
	if(!Edit_Enabled) return;
	if(await handleCtrlC()) event.preventDefault();
});
document.addEventListener("cut", async (event) => {
	if(!Edit_Enabled) return;
	if(await handleCtrlX()) event.preventDefault();
});
document.addEventListener("paste", async (event) => {
	if(!Edit_Enabled) return;
	if(popupActive) return;
	handleCtrlV(event);
});
async function handleCtrlX(){
	const selection = window.getSelection();
	const range = getRange(selection);
	if(!range) return false;
	pushUndo();
	
	await navigator.clipboard.writeText(selection.toString());
	if(insideTable(range)){
		range.deleteContents();
	}else{
		deleteParagraphSelection(selection);
	}
	return true;
}
async function handleCtrlC(){
	const selection = window.getSelection();
	const range = getRange(selection);
	if(!range) return false;
	await navigator.clipboard.writeText(selection.toString());
	return true;
}
async function handleCtrlV(event){
	
	const selection = window.getSelection();
	const range = getRange(selection);
	if(!range) return false;
	
	if(insideTable(range)){
		return Table_handleCtrlV(selection,range,text);
	}
	
	const paragraph = getClosest(range,".paragraph");
	if(!paragraph) return false;
	
	event.preventDefault();
	pushUndo();
	
	deleteParagraphSelection(selection);
	
	try{
		const items = await navigator.clipboard.read();
		for(const item of items){
			for(const type of item.types){
				if(type.startsWith("image/")){
					const blob = await item.getType(type);
					const img = document.createElement("div");
					img.className = "BLOCK image";
					img.contentEditable = "false";
					const i = document.createElement("img");
					i.src = URL.createObjectURL(blob);
					const resizer = document.createElement("div");
					resizer.className = "resize-handle";
					img.addEventListener("mousedown", e => {e.preventDefault();});
					
					img.append(i);
					img.append(resizer);
					insertBlock(img);
					CurrentBlock = packET(img,"image");
					return true;
				}
			}
		}
		console.log("No image found in clipboard.");
	}catch(err){
		console.error(err);
	}
	
	const text = await navigator.clipboard.readText();
	
	const lines = text.split(/\r?\n/);
	
	const atStart = isAtEnd(range,paragraph,true);
	const atEnd = isAtEnd(range,paragraph,false);
	
	let current = paragraph;
	let previous = null;
	let fragment = null;
	if(atStart){
		fragment = document.createDocumentFragment();
		fragment.append(...current.childNodes);
	}else{
		fragment = extractRange(paragraph,range);
	}
	
	for(const line of lines){
		if(line !== ""){
			current.append(line);
		}else{
			current.append(document.createElement("br"));
		}
		let newParagraph = document.createElement("div");
		newParagraph.className = "BLOCK paragraph";
		current.after(newParagraph);
		previous = current;
		current = newParagraph;
	}
	
	if(atEnd){
		current.remove();
		current = previous;
	}else if(atStart){
		current.remove();
		previous.appendChild(fragment);
		current = previous;
	}else{
		current.remove();
		previous.appendChild(fragment);
		current = previous;
	}
	
	const newRange = range.cloneRange();
	
	setSelect(newRange,true);
	return true;
}
function handleCtrlS(){
	savePage();
}
function handleCtrlD(){
	const selection = window.getSelection();
	const range = getRange(selection);
	if(!range) return false;
	
	const paragraph = getClosest(range,".paragraph");
	if(!paragraph) return false;
	
	const copy = paragraph.cloneNode(true);
	
	pushUndo();
	
	paragraph.after(copy);
	
	return true;
}
function captureState(){
	let sel = {start:-1,end:-1};;
	const range = window.getSelection().getRangeAt(0);
	if(window.getSelection().rangeCount){
		const startRange = document.createRange();
		startRange.selectNodeContents(Content);
		startRange.setEnd(range.startContainer, range.startOffset);
		
		const start = startRange.toString().length;
		const end = start + range.toString().length;
		
		sel = {
			start: start,
			end: end,
		};
	}
	const state = {
		content: Content.innerHTML,
		select: sel
	};
	return state;
}
function getTextPosition(root, charOffset) {
	const walker = document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
	
	let node;
	let remaining = charOffset;
	
	while((node = walker.nextNode())){
		const len = node.textContent.length;
		
		if(remaining <= len){
			return {node,offset: remaining};
		}
		
		remaining -= len;
	}
	
	return {
		node: root,
		offset: root.childNodes.length
	};
}
function restoreState(state){
	Content.innerHTML = state.content;
	
	if(state.select.start === -1 || state.select.end === -1) return;
	
	const selection = window.getSelection();
	const range = document.createRange();
	const start = getTextPosition(Content, state.select.start);
	const end = getTextPosition(Content, state.select.end);
	range.setStart(start.node, start.offset);
	range.setEnd(end.node, end.offset);
	selection.removeAllRanges();
	selection.addRange(range);
}
function pushUndo(){
	UndoStack.push(captureState());
	RedoStack.length = 0;
}
function handleCtrlZ(){
	if(UndoStack.length===0) return false;
	const previous = UndoStack.pop();
	RedoStack.push(captureState());
	restoreState(previous);
	return true;
}
function handleCtrlY(){
	if(RedoStack.length===0) return false;
	const next = RedoStack.pop();
	UndoStack.push(captureState());
	restoreState(next);
	return true;
}



content.addEventListener("keydown", e => {
	if(e.key === "Backspace"){
		if(handleBackspace()) e.preventDefault();
	}
	if(e.key === "Delete"){
		if(handleDelete()) e.preventDefault();
	}
	if(e.key === "Enter"){
		if(handleEnter()) e.preventDefault();
	}
	if(e.key === "ArrowUp"){
		if(handleArrowUp()) e.preventDefault();
	}
	if(e.key === "ArrowDown"){
		if(handleArrowDown()) e.preventDefault();
	}
	if(e.key === "ArrowLeft"){
		if(handleArrowLeft()) e.preventDefault();
	}
	if(e.key === "ArrowRight"){
		if(handleArrowRight()) e.preventDefault();
	}
});
function hasText(node){
	const walker = document.createTreeWalker(node,NodeFilter.SHOW_TEXT);
	return walker.nextNode() !== null;
}
function insideTable(range){
	const cell = getClosest(range,"td");
	if(cell) return true;
	return false;
}
function deleteParagraphSelection(selection){
	const range = getRange(selection);
	if(!range) return false;
	if(range.collapsed) return false;
	
	let start = getClosest(range,".paragraph");
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
				setSelect(r,true);
				return true;
			}else if(startIn){
				elmrange.setStart(range.startContainer, range.startOffset);
				elmrange.deleteContents();
				cur = cur.nextElementSibling;
			}else if(endIn){
				elmrange.setEnd(range.endContainer, range.endOffset);
				elmrange.deleteContents();
				const r = range.cloneRange();
				setSelect(r,true);
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
	
	pushUndo();
	
	if(deleteParagraphSelection(selection)) return true;
	
	const range = getRange(selection);
	if(!range) return false;
	
	const paragraph = getClosest(range,".paragraph");
	if(!paragraph) return false;
	
	const atStart = isAtEnd(range,paragraph,true);
	if(!atStart) return false;
	
	let previous = findNextElm(paragraph,"paragraph",false);
	if(!previous) return true;
	
	let HasText = false;
	if(hasText(paragraph)) HasText = true;
	
	const fragment = extractRange(paragraph,range);
	
	paragraph.remove();
	
	const newRange = selectElm(previous);
	
	if(!hasText(previous)){
		previous.innerHTML = "";
		previous.appendChild(fragment);
	}else if(HasText){ previous.appendChild(fragment); }
	
	setSelect(newRange,false);
	return true;
}
function handleDelete(){
	const selection = window.getSelection();
	
	pushUndo();
	
	if(deleteParagraphSelection(selection)) return true;
	
	const range = getRange(selection);
	if(!range) return false;
	
	const paragraph = getClosest(range,".paragraph");
	if(!paragraph) return false;
	
	const atEnd = isAtEnd(range,paragraph,false);
	if(!atEnd) return false;
	
	let next = findNextElm(paragraph,"paragraph",true);
	if(!next) return true;
	
	let HasText = false;
	if(hasText(next)) HasText = true;
	
	const fragment = extractRange(next,range,true);
	next.remove();
	
	const newRange = selectElm(paragraph);
	
	if(!hasText(paragraph)){
		paragraph.innerHTML = "";
		paragraph.appendChild(fragment);
	}else if(HasText){ paragraph.appendChild(fragment); }
	
	setSelect(newRange,false);
	return true;
}
function handleEnter(){
	const selection = window.getSelection();
	
	pushUndo();
	
	deleteParagraphSelection(selection);
	
	const range = getRange(selection);
	if(!range) return false;
	
	const paragraph = getClosest(range,".paragraph");
	if(!paragraph) return false;
	
	const atStart = isAtEnd(range,paragraph,true);
	const atEnd = isAtEnd(range,paragraph,false);
	
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
		const fragment = extractRange(paragraph,range);
		
		newParagraph = document.createElement("div");
		newParagraph.className = "BLOCK paragraph";
		newParagraph.appendChild(fragment);
	}
	
	paragraph.after(newParagraph);
	
	const newRange = selectElm(newParagraph);
	setSelect(newRange,true);
	return true;
}
function handleArrowUp(){
	const selection = window.getSelection();
	const range = getRange(selection);
	if(!range) return false;
	if(!range.collapsed) return false;
	
	if(insideTable(range)){
		return Table_handleArrowUp(selection,range);
	}
	
	const paragraph = getClosest(range,".paragraph");
	if(!paragraph) return false;
	
	let previous = findNextElm(paragraph,"paragraph",false);
	if(!previous) return true;
	
	const offset = getOffset(paragraph,range);
	
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
	}
	setSelect(newRange,true);
	return true;
}
function handleArrowDown(){
	const selection = window.getSelection();
	const range = getRange(selection);
	if(!range) return false;
	if(!range.collapsed) return false;
	
	if(insideTable(range)){
		return Table_handleArrowDown(selection,range);
	}
	
	const paragraph = getClosest(range,".paragraph");
	if(!paragraph) return false;
	
	let next = findNextElm(paragraph,"paragraph",true);
	if(!next) return true;
	
	const offset = getOffset(paragraph,range);
	
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
	}
	setSelect(newRange,true);
	return true;
}
function handleArrowLeft(){
	const selection = window.getSelection();
	const range = getRange(selection);
	if(!range) return false;
	if(!range.collapsed) return false;
	
	if(insideTable(range)){
		return Table_handleArrowLeft(selection,range);
	}
	
	const paragraph = getClosest(range,".paragraph");
	if(!paragraph) return false;
	
	const atStart = isAtEnd(range,paragraph,true);
	if(!atStart) return false;
	
	let previous = findNextElm(paragraph,"paragraph",false);
	if(!previous) return true;
	
	const newRange = selectElm(previous);
	setSelect(newRange,false);
	return true;
}
function handleArrowRight(){
	const selection = window.getSelection();
	const range = getRange(selection);
	if(!range) return false;
	if(!range.collapsed) return false;
	
	if(insideTable(range)){
		return Table_handleArrowRight(selection,range);
	}
	
	const paragraph = getClosest(range,".paragraph");
	if(!paragraph) return false;
	
	const atEnd = isAtEnd(range,paragraph,false);
	if(!atEnd) return false;
	
	let next = findNextElm(paragraph,"paragraph",true);
	if(!next) return true;
	
	const newRange = selectElm(next);
	setSelect(newRange,true);
	return true;
}

function setImageEditing(enabled){
	if(enabled){
		document.querySelectorAll(".resize-handle-off").forEach(element => {
			element.className = "resize-handle";
		});
	}else{
		document.querySelectorAll(".resize-handle").forEach(element => {
			element.className = "resize-handle-off";
		});
	}
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
		setImageEditing(true);
	}else{
		Content.contentEditable = "false";
		EditSign.hidden = true;
		setTableEditing(false);
		setImageEditing(false);
	}
}

document.addEventListener('contextmenu', function(e){
	if(Edit_Enabled&&popupActive==false){ e.preventDefault(); }
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
	
	const image = event.target.closest(".image");
	if(image){
		CurrentBlock = packET(image,"image");
		enable_ImageMenu();
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
	
	pushUndo();
	
	let paragraph = document.createElement("div");
	paragraph.className = "BLOCK paragraph";
	paragraph.appendChild(document.createElement("br"));
	
	paragraph.after(CurrentBlock.block.nextElementSibling);
	CurrentBlock.block.after(paragraph);
	
	const r = selectElm(paragraph);
	setSelect(r,true);
});

//IMAGE
let activeResize = null;
document.addEventListener("pointermove", (e) => {
	if(!activeResize) return;
	const dx = e.clientX - activeResize.startX;
	const width = Math.max(50,activeResize.startWidth + dx);
	activeResize.wrapper.style.width = `${width}px`;
});
document.addEventListener("pointerup", () => {
	activeResize = null;
});
document.addEventListener("pointerdown", (e) => {
	if(!Edit_Enabled) return;
	const handle = e.target.closest(".resize-handle");
	if(!handle) return;
	
	e.preventDefault();
	
	const wrapper = handle.closest(".image");
	
	activeResize = {
		wrapper,
		startX: e.clientX,
		startWidth: wrapper.offsetWidth
	};
});
ImageBtn.addEventListener("click", function(){
	const selection = window.getSelection();
	const range = getRange(selection);
	if(!range) return false;
	
	popupImageInput();
	showPopup("Select Image", async text =>{
		if(text===null) return;
		if(!popupImage) return;
		if(popupImage.value===null) return;
		
		window.getSelection().removeAllRanges();
		window.getSelection().addRange(range);
		deleteParagraphSelection(window.getSelection());
		
		const img = document.createElement("div");
		img.className = "BLOCK image";
		img.contentEditable = "false";
		const i = document.createElement("img");
		i.src = popupImage.value;
		const resizer = document.createElement("div");
		resizer.className = "resize-handle";
		img.addEventListener("mousedown", e => {e.preventDefault();});
		
		img.append(i);
		img.append(resizer);
		insertBlock(img);
		CurrentBlock = packET(img,"image");
	});
});
DeleteBtn.addEventListener("click", event => {
	if(!CurrentBlock) return;
	if(CurrentBlock.type!=="image") return;
	
	pushUndo();
	
	CurrentBlock.block.remove();
	CurrentBlock = null;
});

// DIVIDER
DividerBtn.addEventListener("click", function(){
	const divider = document.createElement("div");
	divider.className = "BLOCK divider";
	divider.contentEditable = "false";
	divider.addEventListener("mousedown", e => {e.preventDefault();});
	insertBlock(divider);
	CurrentBlock = packET(divider,"divider");
});
DeleteBtn.addEventListener("click", event => {
	if(!CurrentBlock) return;
	if(CurrentBlock.type!=="divider") return;
	
	pushUndo();
	
	CurrentBlock.block.remove();
	CurrentBlock = null;
});

// COPY/PASTE/CUT/UNDO/REDO
Copy_Btn.addEventListener("click", async function(){await handleCtrlC();});
Paste_Btn.addEventListener("click",async function(){await handleCtrlV();});
Cut_Btn.addEventListener("click",  async function(){await handleCtrlX();});
Undo_Btn.addEventListener("click", async function(){await handleCtrlZ();});
Redo_Btn.addEventListener("click", async function(){await handleCtrlY();});

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
	const range = getRange(selection);
	if(!range) return false;
	if(!content.contains(range.commonAncestorContainer)) return;
	const walker = document.createTreeWalker(content,NodeFilter.SHOW_ELEMENT);
	
	pushUndo();
	
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
	
	pushUndo();
	
	CurrentBlock.block.remove();
	CurrentBlock = null;
});
RowAddBtn.addEventListener("click", function(){
	if(!CurrentBlock) return;
	if(CurrentBlock.type!=="table") return;
	if(!CurrentBlock.block || !CurrentBlock.cell) return;
	
	const row = CurrentBlock.cell.parentElement;
	const newRow = row.cloneNode(true);
	
	pushUndo();
	
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
	
	pushUndo();
	
	row.remove();
	
	CurrentBlock.cell = null;
});
ColumnAddBtn.addEventListener("click", function(){
	if(!CurrentBlock) return;
	if(CurrentBlock.type!=="table") return;
	if(!CurrentBlock.block || !CurrentBlock.cell) return;
	
	const col = CurrentBlock.cell.cellIndex;
	
	pushUndo();
	
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
	
	pushUndo();
	
	for(const row of CurrentBlock.block.rows){
		row.deleteCell(col);
	}
	
	CurrentBlock.cell = null;
});
function Table_handleArrowUp(selection,range){
	const cell = getClosest(range,"td");
	if(!cell) return false;
	
	const row = cell.closest("tr");
	
	const previousRow = row.previousElementSibling;
	if(!previousRow) return true;
	
	const column = cell.cellIndex;
	const targetCell = previousRow.cells[column];
	if(!targetCell) return true;
	
	const offset = getOffset(cell,range);
	
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
	}
	setSelect(newRange,true);
	return true;
}
function Table_handleArrowDown(selection,range){
	const cell = getClosest(range,"td");
	if(!cell) return false;
	
	const row = cell.closest("tr");
	
	const nextRow = row.nextElementSibling;
	if(!nextRow) return true;
	
	const column = cell.cellIndex;
	const targetCell = nextRow.cells[column];
	if(!targetCell) return true;
	
	const offset = getOffset(cell,range);
	
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
	}
	setSelect(newRange,false);
	return true;
}
function Table_handleArrowLeft(selection,range){
	const cell = getClosest(range,"td");
	if(!cell) return false;
	
	const row = cell.parentElement;
	const index = cell.cellIndex;
	
	const atStart = isAtEnd(range,cell,true);
	if(!atStart) return false;
	
	let targetCell;
	if(index > 0){
		targetCell = row.cells[index - 1];
	}else{
		const previousRow = row.previousElementSibling;
		if(!previousRow) return true;
		
		targetCell = previousRow.cells[previousRow.cells.length - 1];
	}
	
	const newRange = selectElm(targetCell);
	setSelect(newRange,false);
	return true;
}
function Table_handleArrowRight(selection,range){
	const cell = getClosest(range,"td");
	if(!cell) return false;
	
	const atEnd = isAtEnd(range,cell,false);
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
	
	const newRange = selectElm(targetCell);
	setSelect(newRange,true);
	return true;
}
function Table_wrapBasic(selection,range,fm){
	let cell = getClosest(range,"td");
	if(!cell) return true;
	
	pushUndo();
	
	const r = range.cloneRange();
	const format = document.createElement(fm);
	format.className = "FORMAT";
	const fragment = range.extractContents();
	format.appendChild(fragment);
	range.insertNode(format);
	setSelect(r,true);
	return true;
}
function Table_wrapAdvan(selection,range,elm){
	let cell = getClosest(range,"td");
	if(!cell) return true;
	
	pushUndo();
	
	const r = range.cloneRange();
	const fragment = range.extractContents();
	elm.appendChild(fragment);
	range.insertNode(elm);
	setSelect(r,true);
	return true;
}
function Table_handleCtrlV(selection,range,text){
	let cell = getClosest(range,"td")
	if(!cell) return true;
	
	pushUndo();
	
	range.deleteContents();
	
	const r = range.cloneRange();
	range.insertNode(document.createTextNode(text));
	setSelect(r,true);
	return true;
}

//POPUP OVERLAY
const overlay         = document.getElementById("overlay");
const popup           = document.getElementById("popup");
const popup_input     = document.getElementById("popupInput");
const popup_okBtn     = document.getElementById("popup-okBtn");
const popup_cancelBtn = document.getElementById("popup-cancelBtn");
const popup_file      = document.getElementById("popupFile");
const dropZone        = document.getElementById("dropZone");
let popupCallback     = null;
let popupImage        = {isURL: false,value: null};
let popupActive       = false;
dropZone.addEventListener("dragenter", () => {dropZone.classList.add("dragover");});
dropZone.addEventListener("dragleave", () => {dropZone.classList.remove("dragover");});
dropZone.addEventListener("drop", () => {dropZone.classList.remove("dragover");});
dropZone.addEventListener("click", () => popup_file.click());
popup_file.addEventListener("change", () => {
	for(const file of popup_file.files){
		popup_handleFile(file);
	}
});
dropZone.addEventListener("dragover", (e) => {e.preventDefault();});
dropZone.addEventListener("drop", (e) => {
	e.preventDefault();
	for(const file of e.dataTransfer.files){
		popup_handleFile(file);
	}
});
dropZone.addEventListener("paste", async (e) => {
	if(!popupActive) return;
	e.preventDefault();
	
	for(const item of e.clipboardData.items){
		if(item.type.startsWith("image/")){
			const file = item.getAsFile();
			if(file){
				popup_handleFile(file);
				return;
			}
		}
	}
	
	const text = e.clipboardData.getData("text/plain").trim();
	if(text){
		try{
			const url = new URL(text);
			popup_handleImageURL(url.href);
		}catch{}
	}
});
function popup_handleImageURL(url){
	dropZone.innerHTML = url;
	popupImage = {isURL: true,value: url};
}
function popup_handleFile(file) {
	const reader = new FileReader();
	reader.onload = () => {
		const img = document.createElement("img");
		img.src = reader.result;
		img.style.maxWidth = "200px";
		img.style.maxHeight = "200px";
		
		dropZone.innerHTML = "";
		dropZone.append(img);
		popupImage = {
			isURL: false,
			value: reader.result
		};
	};
	reader.readAsDataURL(file);
}
popup_input.addEventListener("keydown", (e) => {
	if(e.key !== "Enter") return;
	e.preventDefault();
	overlay.hidden = true;
	popupActive = false;
	if(popupCallback) popupCallback(popup_input.value);
});
popup_okBtn.addEventListener("click", () => {
	overlay.hidden = true;
	popupActive = false;
	if(popupCallback) popupCallback(popup_input.value);
});
popup_cancelBtn.addEventListener("click", () => {
	overlay.hidden = true;
	popupActive = false;
	if(popupCallback) popupCallback(null);
});
function showPopup(label, callback) {
	popup.querySelector("label").textContent = label;
	popup_input.value = "";
	overlay.hidden = false;
	popup_input.focus();
	popupCallback = callback;
	popupActive = true;
}
function popupYesNo(){
	popup_okBtn.innerHTML = "Yes";
	popup_cancelBtn.innerHTML = "No";
	popup_input.hidden = true;
	popup_cancelBtn.hidden = false;
	dropZone.hidden = true;
}
function popupTextInput(){
	popup_okBtn.innerHTML = "Ok";
	popup_cancelBtn.innerHTML = "Cancel";
	popup_input.hidden = false;
	popup_cancelBtn.hidden = false;
	dropZone.hidden = true;
}
function popupInfo(){
	popup_okBtn.innerHTML = "Ok";
	popup_input.hidden = true;
	popup_cancelBtn.hidden = true;
	dropZone.hidden = true;
}
function popupImageInput(){
	popup_okBtn.innerHTML = "Ok";
	popup_cancelBtn.innerHTML = "Cancel";
	popup_input.hidden = true;
	popup_cancelBtn.hidden = false;
	dropZone.hidden = false;
	dropZone.innerHTML = "";
}

//LINK
function isURL(str){
	try{ new URL(str);
		return true;
	}catch{ return false; }
}
LinkBtn.addEventListener("click", function(){
	const selection = window.getSelection();
	const range = getRange(selection);
	if(!range) return false;
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



function splitParagraph(){
	const selection = window.getSelection();
	const range = getRange(selection);
	if(!range) return false;
	
	let paragraph = getClosest(range,".paragraph");
	if(!paragraph) return null;
	
	const fragment = extractRange(paragraph,range);
	
	const newParagraph = document.createElement("div");
	newParagraph.className = "BLOCK paragraph";
	newParagraph.appendChild(fragment);
	
	if(!paragraph.hasChildNodes() || paragraph.textContent.length === 0){
		paragraph.innerHTML = "<br>";
	}
	
	if(!newParagraph.hasChildNodes() || newParagraph.textContent.length === 0){
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
	
	pushUndo();
	
	deleteParagraphSelection(selection);
	
	const split = splitParagraph();
	
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
	const range = getRange(selection);
	if(!range) return false;
	if(range.collapsed) return false;
	
	if(insideTable(range)){
		return Table_wrapBasic(selection,range,fm);
	}
	
	let start = getClosest(range,".paragraph");
	if(!start) return true;
	
	pushUndo();
	
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
				setSelect(r,true);
				return true;
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
				setSelect(r,true);
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
		range = getRange(selection);
		if(!range) return false;
	}
	if(range.collapsed) return false;
	
	if(insideTable(range)){
		return Table_wrapAdvan(selection,range,elm);
	}
	
	let start = getClosest(range,".paragraph");
	if(!start) return true;
	
	pushUndo();
	
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
				setSelect(r,true);
				return true;
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
				setSelect(r,true);
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























































