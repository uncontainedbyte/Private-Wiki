
let Edit_Enabled = 0;





const SaveBtn = document.getElementById("save-btn");
const CreatePageBtn = document.getElementById("create-page-btn");
const SearchBox = document.getElementById("search-box");



const menu = document.getElementById("menu");
function setup_Menu(){
	menu.innerHTML = `
	<div id="menu-text-formatting" class="menu-entry">
		<button class="B-Btn menu-entry-dot"><strong>B</strong></button>
		<button class="I-Btn menu-entry-dot"><em>I</em></button>
		<button class="U-Btn menu-entry-dot"><u>U</u></button>
		<button class="S-Btn menu-entry-dot"><del>S</del></button>
	</div>
	<div id="menu-headings" class="menu-entry">
		<button class="H1-Btn menu-entry-dot">h1</button>
		<button class="H2-Btn menu-entry-dot">h2</button>
		<button class="H3-Btn menu-entry-dot">h3</button>
		<button class="H4-Btn menu-entry-dot">h4</button>
		<button class="H5-Btn menu-entry-dot">h5</button>
		<button class="H6-Btn menu-entry-dot">h6</button>
	</div>
	<div id="menu-line-table" class="menu-entry">
		<button class="line-btn menu-entry-dot">line</button>
		<button class="table-btn menu-entry-dot">table</button>
	</div>
	<div id="menu-link" class="menu-entry">
		<button class="link-btn menu-entry-dot">link</button>
	</div>
	<div id="menu-row-col" class="menu-entry">
		<button class="rowA-btn menu-entry-dot">rw+</button>
		<button class="rowS-btn menu-entry-dot">rw-</button>
		<button class="colA-btn menu-entry-dot">cl+</button>
		<button class="colS-btn menu-entry-dot">cl-</button>
	</div>
	<div id="menu-delete" class="menu-entry">
		<button class="delete-btn menu-entry-dot">delete</button>
	</div>
	<div id="menu-clear" class="menu-entry">
		<button class="clear-btn menu-entry-dot">clear</button>
	</div>
	`;
}
setup_Menu();

const EditLockBtn = document.getElementById("edit-lock-btn");
const Content = document.getElementById("content");
const HeaderTitle = document.getElementById("header-title");
const Status = document.getElementById("status");
const EditMenu = document.getElementById("menu");

const LinkBtn = document.querySelector(".link-btn");
const LineBtn = document.querySelector(".line-btn");
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

const editor = {
	selection: null,
	range: null,
	selectedBlock: null,
	currentTable: null,
	currentCell: null
};

const Menu_Formatting = document.getElementById("menu-text-formatting");
const Menu_Headings   = document.getElementById("menu-headings");
const Menu_LineTable  = document.getElementById("menu-line-table");
const Menu_Link       = document.getElementById("menu-link");
const Menu_RowCol     = document.getElementById("menu-row-col");
const Menu_Delete     = document.getElementById("menu-delete");
const Menu_Clear      = document.getElementById("menu-clear");

function enable_ContentMenu(){
	Menu_Formatting.style.display = "flex";
	Menu_Headings.style.display   = "flex";
	Menu_LineTable.style.display  = "flex";
	Menu_Link.style.display       = "flex";
	Menu_RowCol.style.display     = "none";
	Menu_Delete.style.display     = "none";
	Menu_Clear.style.display      = "flex";
}
function enable_TableMenu(){
	Menu_Formatting.style.display = "flex";
	Menu_Headings.style.display   = "none";
	Menu_LineTable.style.display  = "none";
	Menu_Link.style.display       = "flex";
	Menu_RowCol.style.display     = "flex";
	Menu_Delete.style.display     = "flex";
	Menu_Clear.style.display      = "flex";
}
function enable_LineMenu(){
	Menu_Formatting.style.display = "none";
	Menu_Headings.style.display   = "none";
	Menu_LineTable.style.display  = "none";
	Menu_Link.style.display       = "none";
	Menu_RowCol.style.display     = "none";
	Menu_Delete.style.display     = "flex";
	Menu_Clear.style.display      = "none";
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
function hasText(node) {
	const walker = document.createTreeWalker(node,NodeFilter.SHOW_TEXT);
	return walker.nextNode() !== null;
}
function handleBackspace(){
	const selection = window.getSelection();
	if(!selection.rangeCount) return false;
	
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
	
	return false;
	return true;
}
function handleArrowDown(){
	
	return false;
	return true;
}
function handleArrowLeft(){
	
	return false;
	return true;
}
function handleArrowRight(){
	
	return false;
	return true;
}






/*
function _createBlock(){
	let block = document.createElement("div");
	block.classList.add("BLOCK");
	return block;
}
function _deleteSelection(){
	const range = _getRange();
	if(!range) return;
	
	range.deleteContents();
	_updateSelection();
}
function _updateSelection(){
	const selection = window.getSelection();
	
	if(!selection.rangeCount){
		editor.selection = null;
		editor.range = null;
		return;
	}
	
	const range = selection.getRangeAt(0);
	
	if(!content.contains(range.commonAncestorContainer)){
		editor.selection = null;
		editor.range = null;
		return;
	}
	
	editor.selection = selection;
	editor.range = range.cloneRange();
}
function _clearSelection(){
	window.getSelection().removeAllRanges();
	editor.selection = null;
	editor.range = null;
}
function _hasSelection(){
	return editor.range !== null;
}
function _getRange(){
	return editor.range ? editor.range.cloneRange() : null;
}
function _wrapBasic(elm, range = null){
	if(!range){
		range = _getRange();
		if(!range) return;
	}
	const format = document.createElement(elm);
	const fragment = range.extractContents();
	format.appendChild(fragment);
	range.insertNode(format);
	window.getSelection().removeAllRanges();
}
function _wrapAdv(element, range = null){
	if(!range){
		range = _getRange();
		if(!range) return;
	}
	const fragment = range.extractContents();
	element.appendChild(fragment);
	range.insertNode(element);
	selection.removeAllRanges();
}
function _createParagraph(){
	const block = _createBlock();
	block.classList.add("paragraph");
	block.innerHTML = "<br>";
	return block;
}
function _splitParagraph(range){
	let paragraph = range.startContainer;
	
	while(paragraph && paragraph !== content){
		if(paragraph.nodeType === Node.ELEMENT_NODE && paragraph.classList.contains("paragraph")){
			break;
		}
		paragraph = paragraph.parentNode;
	}
	
	if(!paragraph || paragraph === content) return null;
	
	const splitRange = range.cloneRange();
	splitRange.selectNodeContents(paragraph);
	splitRange.setStart(range.startContainer, range.startOffset);
	
	const after = splitRange.extractContents();
	
	const newParagraph = _createParagraph();
	
	if(after.hasChildNodes()){
		newParagraph.append(...Array.from(after.childNodes));
	}
	
	if(!paragraph.hasChildNodes()){
		paragraph.innerHTML = "<br>";
	}
	if(!newParagraph.hasChildNodes()){
		newParagraph.innerHTML = "<br>";
	}
	
	return {
		before: paragraph,
		after: newParagraph
	};
}
function _insertBlock(block){
	const range = _getRange();
	if(!range) return false;
	
	const split = _splitParagraph(range);
	
	if(split){
		split.before.after(block);
		block.after(split.after);
		
		const newRange = document.createRange();
		newRange.selectNodeContents(split.after);
		newRange.collapse(true);
		
		const selection = window.getSelection();
		selection.removeAllRanges();
		selection.addRange(newRange);
	}else{
		
		
		range.deleteContents();
		range.insertNode(block);
		
		range.setStartAfter(block);
		range.collapse(true);
		
		const selection = window.getSelection();
		selection.removeAllRanges();
		selection.addRange(range);
	}
	
	_updateSelection();
	
	return true;
}


//SELECTION
document.addEventListener("selectionchange", _updateSelection);
content.addEventListener("mouseup", _updateSelection);
content.addEventListener("keyup", _updateSelection);
content.addEventListener("focus", _updateSelection);

//DELETE/BACKSPACE
content.addEventListener("keydown", e => {
	if(e.key === "Backspace"){
		if(_handleBackspace()){
			e.preventDefault();
	}}
	if(e.key === "Delete"){
		if(_handleDelete()){
			e.preventDefault();
}}});
function _isAtStartOfParagraph(range, paragraph){
	const test = range.cloneRange();
	test.selectNodeContents(paragraph);
	test.setEnd(range.startContainer, range.startOffset);
	return test.toString() === "";
}
function _isAtEndOfParagraph(range, paragraph){
	const test = range.cloneRange();
	test.selectNodeContents(paragraph);
	test.setStart(range.endContainer, range.endOffset);
	return test.toString() === "";
}
function _isEmptyParagraph(paragraph){
	return (
		paragraph.textContent.trim() === "" &&
		[...paragraph.childNodes].every(node =>
			node.nodeType === Node.ELEMENT_NODE
				? node.tagName === "BR"
				: node.textContent.trim() === ""
		)
	);
}
function _handleBackspace(){
	const range = _getRange();
	if (!range || !range.collapsed) return false;
	
	let paragraph = range.startContainer;
	while (paragraph && paragraph !== content) {
		if (
			paragraph.nodeType === Node.ELEMENT_NODE &&
			paragraph.classList.contains("paragraph")
		) break;
		paragraph = paragraph.parentNode;
	}
	
	if (!paragraph || paragraph === content) return true;
	
	if (!_isAtStartOfParagraph(range, paragraph))
		return false;
	
	let prev = paragraph.previousElementSibling;
	
	while (prev && !prev.classList.contains("BLOCK"))
		prev = prev.previousElementSibling;
	
	// Previous block is a paragraph -> merge
	if (prev && prev.classList.contains("paragraph")) {
		
		// Remove placeholder <br>
		if (_isEmptyParagraph(prev))
			prev.innerHTML = "";
		
		const caretNode = prev;
		const caretOffset = prev.childNodes.length;
		
		// Move everything except placeholder <br>
		while (paragraph.firstChild) {
			if (
				paragraph.firstChild.nodeName === "BR" &&
				paragraph.childNodes.length === 1
			) {
				paragraph.removeChild(paragraph.firstChild);
				break;
			}
			
			prev.appendChild(paragraph.firstChild);
		}
		
		paragraph.remove();
		
		if (_isEmptyParagraph(prev))
			prev.innerHTML = "<br>";
		
		const sel = window.getSelection();
		const newRange = document.createRange();
		newRange.setStart(caretNode, caretOffset);
		newRange.collapse(true);
		
		sel.removeAllRanges();
		sel.addRange(newRange);
		
		_updateSelection();
		return true;
	}
	
	// No previous paragraph
	if (_isEmptyParagraph(paragraph)) {
		paragraph.remove();
		
		_updateSelection();
		return true;
	}
	
	// Don't let Backspace remove structural blocks
	return true;
}
function _handleDelete(){
	
}

// DIVIDER
LineBtn.addEventListener("click", function(){
	const block = _createBlock();
	
	block.classList.add("divider");
	block.contentEditable = "false";
	
	_insertBlock(block);
});
DeleteBtn.addEventListener("click", event => {
	if(!currentDivider){ return; }
	
	currentDivider.remove();
	currentDivider = null;
});

//TABLE
let currentTable = null;
let currentCell = null;
TableBtn.addEventListener("click", function(){
	
	
	
	
	
	
	
	
	const selection = window.getSelection();
	if(!selection.rangeCount) return;
	const range = selection.getRangeAt(0);
	if(!content.contains(range.commonAncestorContainer)) return;
	let table = document.createElement("table");
	table.contentEditable="false"
	table.innerHTML = `<tr><td contentEditable="true"><br></td></tr>`;
	range.deleteContents();
	range.insertNode(table);
	range.setStartAfter(table);
	range.collapse(true);
	selection.removeAllRanges();
	selection.addRange(range);
});

DeleteBtn.addEventListener("click", () =>{
	if(!currentTable) return;
	
	currentTable.remove();
	currentTable = null;
	currentCell = null;
});
RowAddBtn.addEventListener("click", () => {
	if(!currentTable || !currentCell) return;
	
	const row = currentCell.parentElement;
	const newRow = row.cloneNode(true);
	
	for(const cell of newRow.cells){
		cell.contentEditable = "true";
		cell.innerHTML = "<br>";
	}
	
	row.after(newRow);
});
RowDelBtn.addEventListener("click", () => {
	if(!currentTable || !currentCell) return;
	
	const row = currentCell.parentElement;
	
	if(currentTable.rows.length <= 1) return;
	
	row.remove();
	
	currentCell = null;
});
ColumnAddBtn.addEventListener("click", () => {
	if(!currentTable || !currentCell) return;
	
	const col = currentCell.cellIndex;
	
	for(const row of currentTable.rows){
		const cell = row.insertCell(col + 1);
		cell.contentEditable = "true";
		cell.innerHTML = "<br>";
	}
});
ColumnDelBtn.addEventListener("click", () => {
	if(!currentTable || !currentCell) return;
	
	const col = currentCell.cellIndex;
	
	if(currentTable.rows[0].cells.length <= 1) return;
	
	for(const row of currentTable.rows){
		row.deleteCell(col);
	}
	
	currentCell = null;
});

//GLOBAL
content.addEventListener("mousedown", event => {
	if(event.button !== 2){ return; };
	
	const divider = event.target.closest(".divider");
	if(divider){
		currentDivider = divider;
		enable_LineMenu();
		return;
	}
	currentDivider = null;
	
	const table = event.target.closest("table");
	if(table){
		currentTable = table;
		currentCell = event.target.closest("td");
		enable_TableMenu();
		return;
	}
	currentTable = null;
	currentCell = null;
	
	enable_ContentMenu();
});

//FORMATTING
 B_Btn.addEventListener("click", function(){_wrapBasic("strong");});
 I_Btn.addEventListener("click", function(){_wrapBasic("em");});
 U_Btn.addEventListener("click", function(){_wrapBasic("u");});
 S_Btn.addEventListener("click", function(){_wrapBasic("del");});
H1_Btn.addEventListener("click", function(){_wrapBasic("h1");});
H2_Btn.addEventListener("click", function(){_wrapBasic("h2");});
H3_Btn.addEventListener("click", function(){_wrapBasic("h3");});
H4_Btn.addEventListener("click", function(){_wrapBasic("h4");});
H5_Btn.addEventListener("click", function(){_wrapBasic("h5");});
H6_Btn.addEventListener("click", function(){_wrapBasic("h6");});

//POPUP OVERLAY
const overlay = document.getElementById("overlay");
const popup = document.getElementById("popup");
const input = document.getElementById("popupInput");
const popup_okBtn = document.getElementById("popup-okBtn");
const popup_cancelBtn = document.getElementById("popup-cancelBtn");
let popupCallback = null;
popup_okBtn.addEventListener("click", () => {
	overlay.hidden = true;
	if(popupCallback) popupCallback(input.value);
});
popup_cancelBtn.addEventListener("click", () => {
	overlay.hidden = true;
	if(popupCallback) popupCallback(null);
});
function showPopup(label, callback) {
	popup.querySelector("label").textContent = label;
	input.value = "";
	overlay.hidden = false;
	input.focus();
	popupCallback = callback;
}
*/
































SaveBtn.addEventListener("click", function(){ sendHTML(); });
function setTableEditing(enabled) {
	const tds = content.querySelectorAll("td");
	
	for(const td of tds){
		td.contentEditable = enabled ? "true" : "false";
	}
}
EditLockBtn.addEventListener("click", function(){
	Edit_Enabled = !Edit_Enabled;
	
	if(Edit_Enabled){
		Status.innerHTML = "Editing";
		Content.contentEditable = "true";
		setTableEditing(true);
	}else{
		Status.innerHTML = "Null";
		Content.contentEditable = "false";
		setTableEditing(false);
	}
});

function sendHTML(){
	const page = "<!DOCTYPE html>\n" + document.documentElement.outerHTML;
	let id = document.querySelector("meta[name='page-id']").getAttribute("content");
	
	fetch("/api", {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			command: "save",
			id: id,
			content: page
		})
	});
}

document.addEventListener('contextmenu', function(e){
	if(Edit_Enabled){ e.preventDefault(); }
});
document.addEventListener("mousedown", function (event) {
	if(Edit_Enabled){
		if(event.button === 2){
			EditMenu.style.display = "block";
			EditMenu.style.top = event.clientY + 'px';
			EditMenu.style.left = event.clientX + 'px';
		}
	}
});
document.addEventListener("mouseup", function (event) {
	if(Edit_Enabled){
		if(event.button === 2){
		}else{ EditMenu.style.display = "none"; }
	}
});

const tags = ["STRONG", "EM", "U", "S", "DEL", "H1", "H2", "H3", "H4", "H5", "H6"];
ClearBtn.addEventListener("click", () => {
	const selection = window.getSelection();
	if(!selection.rangeCount) return;
	
	const range = selection.getRangeAt(0);
	
	if(!content.contains(range.commonAncestorContainer)) return;
	
	const walker = document.createTreeWalker(
		content,
		NodeFilter.SHOW_ELEMENT
	);
	
	const toRemove = [];
	
	while(walker.nextNode()){
		const node = walker.currentNode;
		
		if(tags.includes(node.tagName) && range.intersectsNode(node)){
			toRemove.push(node);
		}
	}
	
	for(const el of toRemove){
		while (el.firstChild){
			el.parentNode.insertBefore(el.firstChild, el);
		}
		el.remove();
	}
});

CreatePageBtn.addEventListener("click", function(){
	showPopup("Enter Page Title:", async text =>{
		if(text !== null){
			if(text==="") return;
			
			const res = await fetch("/api", {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					command: "create-page",
					title: text,
				})
			});
			
			if(res.status===403){
				Status.innerHTML = "Page Already Exists";
			}else{
				const id = await res.text();
				window.location.href = `${id}.html`;
			}
		}
	});
});
function isURL(str){
	try{ new URL(str);
		return true;
	}catch{ return false; }
}
LinkBtn.addEventListener("click", function(){
	const selection = window.getSelection();
	if(!selection.rangeCount) return;
	const range = selection.getRangeAt(0).cloneRange();
	if(!content.contains(range.commonAncestorContainer)){ return; }
	
	showPopup("Enter Page Title:", async text =>{
		if(text !== null){
			if(text==="") return;
			
			if(isURL(text)){
				let format = document.createElement("a");
				format.href = text;
				wrapSelection(format,range);
				return;
			}
			
			const res = await fetch("/api", {
				method: "POST",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({
					command: "title-id",
					title: text,
				})
			});
			
			if(res.status===403){
				Status.innerHTML = "Page Not Found";
			}else{
				const id = await res.text();
				const link = `${id}.html`;
				
				let format = document.createElement("a");
				format.href = link;
				wrapSelection(format,range);
			}
		}
	});
});




















