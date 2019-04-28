var store = {
	ls   : window['localStorage'],
	init : function() {
		if ( !(('localStorage' in window) && this.ls && this.ls.setItem ) )
			alert('你的浏览器不支持本游戏！请更换你的浏览器');
	},
	get  : function (k,d) {
		var v = this.deserialize(this.ls.getItem(k));
		if ((typeof v === 'undefined' || v === null) && typeof d !== 'undefined') return d;
		return v;
	},
	set   : function(k, v){
		if (v === undefined) return this.ls.remove(k);
		if (typeof v !== 'string') v = JSON.stringify(v);
		return this.ls.setItem(k, v);
	},
	clear : function(){
		this.ls.clear();
		return true;
	},
	deserialize : function(v){
		if (typeof v !== 'string') return undefined;
		try{
			return JSON.parse(v);
		}catch (e){
			return v || undefined;
		}
	}
};
var s = new Vue({
	el: '#app',
	data : function() {
		var DEFAULT_DATA = {
			tiphtml : '',
			savetimer : 0,
			cx      : 0,
			cy      : 0,
			auto    : true,
			maxlv   : 1,
			topLv   : 1,
			boss    : 0,
			pleft   : 160,
			eleft   : 160,
			ebox    : [0, -1083, 55,  55],
			res     : [20,0,0,0],
			count   : 0,
			p  : {
				name  : '',
				lv    : 1,
				hp    : 10,
				mhp   : 10,
				att   : 1,
				elv   : 0,
				mhpe  : [1,1,1],
				atte  : [1,1,1],
				elve  : [1],
				spd   : 100,
				timer : 0,
			},
			e : {},
			builds : []
		};
		store.init();
		var data = store.get('vuegame');
		if (data != null && confirm("监测到游戏有存档\n是否读取?\n选择“取消”将开新档游戏!") ) return data;
		var name = prompt("为英雄起个响亮的名字吧!\n为英雄起个高大上的名字吧!\n为英雄起个让人无法忘怀的名字吧!\n\n","英雄");
		if ( name ) DEFAULT_DATA.p.name = name;
		return DEFAULT_DATA;
	},
	methods : {
		zs: function() {
			var s = this;
			var lv = s.p.lv+1;
			s.maxlv = 1;
			s.topLv = 1;
			s.auto  = true;
			s.boss  = 0;
			s.res   = [(lv-1)*100,0,0,0];
			s.builds = [];
			s.p = {
				lv    : lv,
				hp    : 15 * lv,
				mhp   : 15 * lv,
				att   : (lv-1)*10,
				elv   : lv-1,
				mhpe  : [1,1,1],
				atte  : [1,1,1],
				elve  : [1],
				spd   : 100,
				timer : 0,
			};
			s.changemob(1);
		},
		run : function() {
			var s = this;
			s.timer = new Worker("src/timer.js?"+Math.random());
			s.timer.onmessage = s.timerun;
			if (!s.e.name) s.changemob(1);
			s.timer.postMessage('timerun');
		},
		timerun : function(e) {
			var s = this;
			if (!s.savetimer) s.savetimer=0;
			if (!s.count) s.count = 0;
			s.savetimer++;
			if (s.savetimer%20 == 0) s.count ++;
			if (s.savetimer >= 100) {
				store.set('vuegame',s.$data);
				s.savetimer = 0;
			}
			if (s.p.hp > 0) {
				s.p.timer++;
				if (s.p.timer > s.p.spd-10) {
					s.pleft -= (s.p.timer > s.p.spd-5) ? 20 : -20;
				}
				if (s.p.timer == 15) s.p.dmg=0;
				if (s.p.timer >= s.p.spd) {
					s.p.timer = 0;
					s.pleft = 160;
					var dmg = s.p.att * (100+(s.p.lv-1)*5 +s.p.lv*s.p.elv)/100;
					var cri = Math.random()*100 < Math.ceil(s.p.elv/3);
					dmg = cri ? dmg*(100+(s.p.lv-1)*20+Math.ceil(s.p.elv/10)*5)/100 : dmg;
					s.e.hp -= Math.round(dmg);
					s.p.dmg = -Math.round(dmg)+''+(cri?'!!':'');
					if (s.e.hp <= 0) {
						if (s.auto) s.maxlv = (s.maxlv*10 + 1)/10;
						if (s.maxlv > s.topLv) s.topLv = s.maxlv;
						s.res[0] += Math.ceil(s.e.gold * s.p.lv);
						if (s.maxlv*10%10==0) s.p.hp = s.p.mhp;
						if (s.e.boss) {
							s.boss ++;
							s.p.att += (s.boss+1) * 5  * s.p.lv;
							s.p.mhp += (s.boss+1) * 10 * s.p.lv;
						}
						s.changemob(s.maxlv);
					}
				}
				s.e.timer++;
				if (s.e.timer > s.e.spd-10) {
					s.eleft -= (s.e.timer > s.e.spd-5) ? -20 : 20;
				}
				if (s.e.timer == 15) s.e.dmg=0;
				if (s.e.timer >= s.e.spd) {
					s.e.timer = 0;
					s.eleft = 160;
					s.pleft = 160;
					s.p.hp -= s.e.att;
					s.e.dmg = -s.e.att;
					if (s.p.hp <= 0){
						s.p.timer = -100;
						s.p.hp = 0;
						if (s.e.boss) s.changemob(s.maxlv);
					}
				}
			}else{
				s.e.timer = 0;
				s.eleft = 160;
				s.pleft = 160;
				s.p.timer++;
				if (s.p.timer >= 0) s.p.hp = s.p.mhp;
			}
			for (i in s.builds) {
				var build = s.builds[i];
				build.timer ++;
				if (build.timer >= build.spd) {
					build.timer = 0;
					s.res[parseInt(i)+1] += Math.ceil(Math.pow(build.lv,2)*(1+(s.p.lv-1)*0.5));
				}
			}
			s.timer.postMessage('timerun');
		},
		changemob : function(lv,t){
			var s = this;
			var bd = mbox(Math.floor(lv));
			if (t) lv =(lv+1) * 5;
			var rd = Math.abs(Math.round((Math.pow(lv,3)+30)/50*((lv-1)*2+10)));
			var hp = Math.ceil(s.p.lv*Math.random()*5*lv+3*(lv-1))+(rd*(s.p.lv-1));
			s.e = {
				name  : bd[0]+(t?'[boss]':''),
				boss  : t ? true : false,
				lv    : lv,
				hp    : Math.ceil(hp*(t?10:1)),
				mhp   : Math.ceil(hp*(t?10:1)),
				att   : Math.ceil(lv-1+(hp/10))*(t?2:1),
				spd   : Math.round(Math.random()*30+30),
				gold  : Math.round(Math.pow(lv,2)+(hp/100))*(t?10:1),
				timer : 0
			};
			s.ebox   = bd[1];
		},
		ckhide: function() {
			this.tiphtml = '';
		},
		ck : function(e,t,n,c) {
			var s = this;
			if (!n) n = 0;
			var o = e.target;
			var v,x=1,need=[];
			if (!c) s.tiphtml = '<p>需要</p><hr />';
			switch(t){
				case 'spd'  : v = Math.pow(101 - s.p.spd,2); x=15; break;
				case 'bspd' : v = ((n+1)*600 - s.builds[n].spd) + 1; x=Math.pow(5,n+1); break;
				case 'blv0' :
				case 'blv1' :
					x = Math.ceil(s.builds[n].lve[t=='blv0'?0:1]/2);
					x *= Math.pow(2,n+1);
					v = [1,10][t=='blv0'?0:1]*x;
				break;
				case 'att' :
				case 'mhp' :
				case 'elv' :
					x = Math.ceil(s.p[t+'e'][n]/3) * Math.ceil(s.p[t+'e'][n]/21/([1,2,3][n]));
					if (t == 'elv') x = Math.ceil(x*s.p[t+'e'][n]);
					v = [1,25,500][n]*x;
				break;
			}
			// console.log([v,x]);
			need[0] = Math.floor((0.75+s.p.lv/4) * x * 5  * v);
			need[1] = Math.floor((0.75+s.p.lv/4) * x * 25 * v /300);
			need[2] = Math.floor((0.75+s.p.lv/4) * x * 50 * v /5000);
			need[3] = Math.floor((0.75+s.p.lv/4) * x * 75 * v /80000);
			// console.log([x,v]);
			for (var i = 0; i < need.length; i++){
				if (need[i] > 0 && !c) {
					s.tiphtml += '<span style="color:'+((s.res[i] < need[i] || s.res[i] < 0)?'red':'gerrn')+'">';
					s.tiphtml += '<em class="icon-'+(3+i)+'"></em> x'+xint(need[i])+'</span><br>';
				}
				if (c && (s.res[i] < need[i] || s.res[i] < 0)) return false;
			}
			s.cx = s.$el.offsetLeft + o.offsetLeft + (o.offsetWidth/2);
			s.cy = window.innerHeight - s.$el.offsetTop - o.offsetTop + 6;
			if (c) return need;
		},
		up : function(e,t,n) {
			var s = this;
			if (!n) n = 0;
			var ckd = s.ck(e,t,n,1);
			if (ckd !== false) {
				s.tiphtml = '';
				switch(t){
					case 'bspd' :
						s.builds[n].spd -=10;
					break;
					case 'blv0' :
					case 'blv1' :
						s.builds[n].lv += [1,10,100][t=='blv0'?0:1];
						s.builds[n].lve[t=='blv0'?0:1] ++;
					break;
					case 'spd' :
						s.p[t] -= 2;
						s.pleft = 160;
						s.p.timer = 0;
					break;
					case 'att' :
					case 'mhp' :
					case 'elv' :
						s.p[t] += [1,10,100][n];
						s.p[t+'e'][n] ++;
					break;
				}
				for(i in ckd) s.res[i] -= ckd[i];
				s.ck(e,t,n);
				if (t=='elv' && s.p.elv >= Math.ceil(s.p.att/5)) s.tiphtml = '';
			}
		},
		bd : function(e) {
			var s = this;
			var need = Math.pow(10,s.builds.length)*10;
			if (s.res[0] >= need) {
				s.res[0] -= need;
				var btag = ['牧场','伐木场','矿场'];
				var build = {
					name  : btag[s.builds.length],
					lv    : 1,
					lve   : [1,1],
					timer : 0,
					spd   : (s.builds.length+1)*600
				};
				s.builds.push(build);
			}
		}
	}
});
s.run();
function xint(n) {
	return (!n) ? 0 : (n.toString().indexOf(',') == -1) ?
		(n+'').replace(/\d{1,3}(?=(\d{3})+(\.\d*)?$)/g, '$&,') :
		parseInt(n.replace(/[^\d\.-]/g,''));
}
function ftime(value){
	if (value < 0) return "00:00:00";
	var h=0,i=0,d=0,s=parseInt(value);
	if(s >= 60){
		i = parseInt(s/60);
		s = parseInt(s%60);
		if(i >= 60) {
			h = parseInt(i/60);
			i = parseInt(i%60);
		}
		if(h >= 24) {
			d = parseInt(h/24);
			h = parseInt(h%24);
		}
	}
	// 补零
	var zero = function(v){
		return (v>>0)<10?"0"+v:v;
	};
	return (d?d+' d':'')+([zero(h),zero(i),zero(s)].join(":"));
}
function mbox(lv) {
	var boxdata = [
		["英雄",         [0,    -1083,   55,    55]],
		["哥布林勇士",   [0,    -43,     40,    48]],
		["持斧哥布林",   [-40,  -43,     51,    48]],
		["哥布林拳师",   [-91,  -43,     51,    48]],
		["哥布林突击者", [-142, -42,     68,    49]],
		["哥布林法师",   [-210, -26,     48,    65]],
		["哥布林铁匠",   [-258, -45,     66,    46]],
		["哥布林大力士", [-324, -23,     56,    68]],
		["哥布林坦克",   [-380, 0,       106,   91]],
		["哥布林王子",   [-486, -5,      51,    86]],
		["哥布林骑士",   [-537, -48,     60,    43]],
		["滑雪哥布林",   [-597, -28,     50,    63]],
		["哥布林骑兵",   [-647, -40,     48,    51]],
		["就餐哥布林",   [-695, -9,      43,    82]],
		["就餐哥布林",   [-738, -9,      43,    82]],
		["就餐哥布林",   [-781, -9,      43,    82]],
		["黑铁哥布林",   [-824, -45,     66,    46]],
		["蜥蜴",         [0,    -165,    69,    27]],
		["褐蜥蜴",       [0,    -131,    69,    27]],
		["恶行海鸥",     [-69,  -96,     72,    96]],
		["巨钳蟹",       [-141, -120,    64,    72]],
		["靴精灵",       [-205, -128,    37,    64]],
		["恶行箱",       [-242, -141,    58,    51]],
		["剧毒蛙",       [-300, -146,    51,    46]],
		["眼球怪",       [-351, -131,    76,    61]],
		["邪恶海蜇",     [-427, -96,     62,    96]],
		["沼泽女巫",     [-489, -117,    56,    75]],
		["浅海鳄鱼",     [-545, -114,    125,   78]],
		["小蝙蝠",       [0,    -234,    26,    51]],
		["蝙蝠",         [-26,  -250,    24,    35]],
		["岩石蝎",       [-50,  -243,    61,    42]],
		["剧毒蛇",       [-111, -238,    62,    47]],
		["守灵者",       [-173, -239,    92,    46]],
		["隐士",         [-265, -239,    92,    46]],
		["恶灵箱",       [-357, -215,    64,    70]],
		["火蜥蜴",       [-421, -221,    56,    64]],
		["初级梦魇",     [-477, -197,    58,    88]],
		["沼泽狂战士",   [-535, -230,    80,    55]],
		["噩梦女巫",     [-615, -207,    62,    78]],
		["急兔子",       [0,    -352,    35,    39]],
		["狼",           [-35,  -346,    61,    45]],
		["雪狼",         [-96,  -357,    65,    34]],
		["捣蛋鬼",       [-161, -330,    62,    61]],
		["雷鸟",         [-223, -308,    64,    83]],
		["雷鹰",         [-287, -308,    64,    83]],
		["香蕉猴",       [-351, -327,    55,    64]],
		["香蕉猴勇士",   [-406, -319,    68,    72]],
		["香蕉猴王",     [-474, -319,    68,    72]],
		["邪恶巨木",     [-542, -304,    74,    87]],
		["人鱼战士",     [-616, -312,    61,    79]],
		["人鱼盗贼",     [-677, -303,    62,    88]],
		["人鱼巫师",     [-739, -303,    56,    88]],
		["人鱼勇士",     [-795, -303,    56,    88]],
		["人鱼女王",     [-851, -290,    92,   101]],
		["变异狮",       [0,    -448,    46,    51]],
		["鸟人",         [-46,  -411,    51,    88]],
		["沙盗",         [-97,  -438,    51,    61]],
		["蛋",           [-148, -471,    60,    28]],
		["奇美拉",       [-208, -416,    91,    83]],
		["食人花",       [-299, -436,    48,    63]],
		["岩石猪幼崽",   [-347, -463,    43,    36]],
		["飞天粉红猪",   [-390, -431,    52,    68]],
		["暴怒岩石猪",   [-442, -444,    99,    55]],
		["狼人",         [-541, -447,    66,    52]],
		["半人马",       [-607, -400,    72,    99]],
		["巨力熊",       [-679, -417,    74,    82]],
		["岩石巨人",     [-753, -396,    126,  103]],
		["迷茫者",       [0,    -556,    41,    44]],
		["僵尸",         [-41,  -536,    34,    64]],
		["骷髅",         [-75,  -538,    46,    62]],
		["骷髅射手",     [-121, -531,    43,    69]],
		["剑盾骷髅",     [-164, -548,    63,    52]],
		["骷髅士兵",     [-227, -505,    84,    95]],
		["骷髅队长",     [-311, -504,    53,    96]],
		["木乃伊囚徒",   [-364, -529,    62,    71]],
		["恶魔之火",     [-426, -525,    51,    75]],
		["掘墓木乃伊",   [-477, -511,    57,    89]],
		["火焰领主",     [-534, -504,    61,    96]],
		["光之女皇",     [-595, -520,    34,    80]],
		["暗黑精灵法师", [-629, -523,    33,    77]],
		["暗黑精灵战士", [-662, -536,    48,    64]],
		["迷雾之罐",     [-710, -505,    82,    95]],
		["迷雾之罐",     [-792, -505,    82,    95]],
		["雪人",         [0,    -648,    43,    45]],
		["暗黑小雪怪",   [-43,  -656,    37,    37]],
		["小雪怪",       [-80,  -656,    37,    37]],
		["驯鹿战士",     [-117, -617,    84,    76]],
		["暗黑雪怪",     [-201, -623,    79,    70]],
		["雪怪",         [-280, -623,    79,    70]],
		["驯鹿勇士",     [-359, -625,    83,    68]],
		["圣诞老人",     [-442, -608,    65,    85]],
		["雪精灵",       [-507, -608,    69,    85]],
		["雪地蜥蜴",     [-576, -621,    102,   72]],
		["冰雪女王",     [-678, -605,    93,    88]],
		["幽灵",         [0,    -740,    32,    56]],
		["双刀恶灵",     [-32,  -721,    58,    75]],
		["无形之雾",     [-90,  -709,    67,    87]],
		["恶魔",         [-157, -700,    64,    96]],
		["牛头锻造师",   [-221, -724,    80,    72]],
		["犀牛刺客",     [-301, -741,    68,    55]],
		["独眼锻造师",   [-369, -720,    80,    76]],
		["红衣亡灵巫师", [-449, -735,    48,    61]],
		["亡灵巫师",     [-497, -735,    48,    61]],
		["灵魂拷问者",   [-545, -711,    37,    85]],
		["石像鬼",       [-582, -726,    49,    70]],
		["地狱哨兵",     [-631, -709,    71,    87]],
		["恶魔领主",     [-702, -698,    76,    98]],
		["牛头人领主",   [-778, -700,    120,   96]],
		["海龙神",       [0,    -801,    77,   128]],
		["火凤凰",       [-77,  -803,    103,  126]],
		["暗黑龙",       [-180, -810,    86,   119]],
		["烈焰龙",       [-266, -810,    86,   119]],
		["食人魔",       [-352, -843,    91,    86]],
		["海妖",         [-443, -854,    134,   75]],
		["风之女神",     [0,    -958,    84,    99]],
		["火之女神",     [-84,  -966,    87,    91]],
		["土之女神",     [-171, -953,    83,   104]],
		["木之女神",     [-254, -953,    74,   104]],
		["海神库拉肯",   [-328, -972,    159,   85]],
		["地狱魔神",     [-487, -945,    136,  112]],
		["黑暗天使",     [-623, -902,    104,  155]],
		["光明天使",     [-727, -894,    148,  163]],
		["测试怪物2",    [-55,  -1090,   59,    48]],
		["测试怪物2",    [-114, -1062,   61,    76]],
		["测试怪物2",    [-175, -1075,   36,    63]],
		["测试怪物2",    [-211, -1075,   35,    63]],
		["测试怪物2",    [-246, -1090,   63,    48]],
		["测试怪物2",    [-309, -1090,   48,    48]],
		["测试怪物2",    [-357, -1090,   44,    48]],
		["测试怪物2",    [-401, -1090,   48,    48]],
		["测试怪物2",    [-449, -1092,   62,    46]],
		["测试怪物2",    [-511, -1088,   53,    50]],
		["测试怪物2",    [-564, -1082,   49,    56]],
		["测试怪物2",    [-613, -1088,   53,    50]],
		["测试怪物2",    [-666, -1072,   51,    66]],
		["测试怪物2",    [-717, -1071,   60,    67]],
		["测试怪物2",    [-777, -1079,   63,    59]],
		["测试怪物2",    [-840, -1075,   56,    63]],
		["测试怪物2",    [0,    -1150,   114,   76]],
		["测试怪物2",    [-114, -1143,   112,   83]],
		["测试怪物2",    [-226, -1166,   92,    60]],
		["测试怪物2",    [-318, -1161,   67,    65]],
		["测试怪物2",    [-385, -1164,   44,    62]],
		["测试怪物2",    [-429, -1164,   44,    62]],
		["测试怪物2",    [-473, -1164,   44,    62]],
		["测试怪物2",    [-517, -1160,   24,    66]],
		["测试怪物2",    [-541, -1160,   51,    66]],
		["测试怪物2",    [-592, -1160,   51,    66]],
		["测试怪物2",    [-643, -1160,   38,    66]],
		["测试怪物2",    [-681, -1155,   56,    71]],
		["测试怪物2",    [-737, -1155,   56,    71]],
		["测试怪物2",    [-793, -1158,   60,    68]],
		["测试怪物2",    [-853, -1159,   60,    67]],
		["测试怪物2",    [0,    -1231,   47,   120]],
		["测试怪物2",    [-47,  -1231,   60,   120]],
		["测试怪物2",    [-107, -1250,   85,   101]],
		["测试怪物2",    [-192, -1261,   63,    90]],
		["测试怪物2",    [-255, -1261,   63,    90]],
		["测试怪物2",    [-318, -1261,   62,    90]],
		["测试怪物2",    [-380, -1267,   51,    84]],
		["测试怪物2",    [-431, -1267,   51,    84]],
		["测试怪物2",    [-482, -1255,   69,    96]],
		["测试怪物2",    [-551, -1255,   69,    96]],
		["测试怪物2",    [-620, -1258,   69,    93]],
		["测试怪物2",    [-689, -1267,   81,    84]],
		["测试怪物2",    [-770, -1253,   80,    98]],
		["测试怪物2",    [-850, -1266,   76,    85]],
		["黑雾木神",     [-702, -128,    106,  157]],
	];
	return boxdata[lv%168];
}
