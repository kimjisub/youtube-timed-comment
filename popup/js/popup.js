let background = chrome.extension.getBackgroundPage()
let ytApi = background.ytApi

let tab
chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
	tab = tabs[0]
	console.log('tab', tab)

	updateUI()

	document.getElementById('createRoom').onclick = () => {
		ytApi.create(tab, () => {
			updateUI()
		})
	}
	document.getElementById('joinRoom').onclick = () => {
		let roomId = document.getElementById('roomIdInput').value.replace('#', '')
		ytApi.join(tab, roomId, () => {
			updateUI()
		})
	}
	document.getElementById('copyRoomId').onclick = () => {
		let roomId = document.getElementById('roomId').innerHTML
		copyToClipboard('#' + roomId)
	}
	document.getElementById('exitRoom').onclick = () => {
		ytApi.remove(tab)
		updateUI()
	}
})

function updateUI() {
	let state = ytApi.get(tab)
	if (state) {
		document.getElementById('startPage').classList.add('hidden')
		document.getElementById('roomPage').classList.remove('hidden')
		console.log('state', state)
		document.getElementById('roomId').innerText = state.roomId
		document.getElementById('host').innerText = state.host
	} else {
		document.getElementById('startPage').classList.remove('hidden')
		document.getElementById('roomPage').classList.add('hidden')
	}
}

function copyToClipboard(val) {
	var t = document.createElement('textarea')
	document.body.appendChild(t)
	t.value = val
	t.select()
	document.execCommand('copy')
	document.body.removeChild(t)
}
