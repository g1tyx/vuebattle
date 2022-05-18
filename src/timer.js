// 游戏控制提交计时器
onmessage = function(e) {
	setTimeout(function() {
		postMessage(e.data);
	}, 50);
}
