const METASTORAGE_ID = "MetaData";
const PAGESTORAGE_ID = "PageData";


async function openDB(){
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(PAGESTORAGE_ID, 1);
		
		request.onupgradeneeded = (event) => {
			const db = event.target.result;
			
			if (!db.objectStoreNames.contains("pages")) {
				db.createObjectStore("pages", { keyPath: "id" });
			}
		};
		
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}
function requestToPromise(request){
	return new Promise((resolve, reject) => {
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}
export async function savePage(id, value){
	const db = await openDB();
	const tx = db.transaction("pages", "readwrite");
	tx.objectStore("pages").put({ id: id, value });
	await new Promise((resolve, reject) => {
		tx.oncomplete = resolve;
		tx.onerror = () => reject(tx.error);
		tx.onabort = () => reject(tx.error);
	});
}
export async function loadPage(id){
	const db = await openDB();
	const tx = db.transaction("pages", "readonly");
	const result = await requestToPromise(tx.objectStore("pages").get(id));
	return result?.value;
}
export async function deletePage(id){
	const db = await openDB();
	const tx = db.transaction("pages", "readwrite");
	
	tx.objectStore("pages").delete(id);
	
	await new Promise((resolve, reject) => {
		tx.oncomplete = resolve;
		tx.onerror = () => reject(tx.error);
		tx.onabort = () => reject(tx.error);
	});
}
export async function getAllPages(){
	const db = await openDB();
	const tx = db.transaction("pages", "readonly");
	return await requestToPromise(
		tx.objectStore("pages").getAll()
	);
}

export function getMetaData(){
	try{
		const data = localStorage.getItem(METASTORAGE_ID);
		if(data === null) return null;
		return JSON.parse(data);
	}catch (err){
		console.error("Failed to read metadata:", err);
		localStorage.removeItem(METASTORAGE_ID);
		return null;
	}
}
export function setMetaData(data){
	try{ localStorage.setItem(METASTORAGE_ID, JSON.stringify(data));
	}catch(err){ console.error("Failed to save metadata:", err); }
}






















