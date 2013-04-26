/*
 *   OPMP3Player ver 1.0 - jQuery plugin
 *   中文：网页MP3网页播放器
 *   作者：Eamonn
 *   博客：http://www.eamonning.com
 
 *	 Dual licensed under the MIT and GPL licenses.
 * 
 *	 Built for jQuery library
 *	 http://jquery.com
*/
(function($){
	
	$.fn.OPMP3Player = function(optionsOrg){
		
		var falsev = !1,
		truev = !falsev,
		defaults = {
			//flash地址
			flashUrl :'',
			//mp3地址
			mp3Url:'',
			//自动开始播放
			autoPlay:'true',
			//歌词地址
			lrcUrl:'',
			//歌词所放容器
			lrcContainer:'',
			//歌词样式
			lrcClass:'',
			//正在显示的行样式
			lrcHighlightClass:'',
			//时间改变回调函数，每100ms相应一次
			timeChangeCallback:'',
			//以下为私有变量
			_autoScroll:false
		},
		baseSelf = this;
		optionsOrg = $.extend(defaults, optionsOrg);		
		
		
		baseSelf.lrc_timeKey=[];
		baseSelf.lrc_strArray=[];
		
		///////////////////////// 私有函数开始 /////////////////////////////////
		baseSelf._urlencode=function(str){
			var ret="";
			str+="";
			var strSpecial="!\"#$%&'()*+,/:;<=>?[]^`{|}~%"; 
			for(var i=0;i<str.length;i++){ 
				var chr = str.charAt(i);
				var c=str.charCodeAt(i).toString(16);
				if(chr==" ") {
					ret+="+"; 
				}else if(strSpecial.indexOf(chr)!=-1){
					ret+="%"+c.toString(16); 
				}else{
					ret+=chr;
				}
			}
			return ret;
		};
		baseSelf._lrcProcess=function(lrc_str){
			var lrcArray = lrc_str.split("\n");
			/*
			列出LRC的所有普遍格式：
			[00:00]
			[00:00.00]
			[00:00:00]
			*/
			
			baseSelf.lrc_timeKey=[];
			baseSelf.lrc_strArray=[];
			
			for(var i = 0,l = lrcArray.length;i < l;i++){
				//正则匹配 删除[00:00.00]格式或者 [00:00:00]格式
				//所有的 lrc 都应该 decode 一下，因为各种语言都可能有
				//clouse是歌词
				clause = decodeURIComponent(lrcArray[i]).replace(/\[\d*:\d*((\.|\:)\d*)*\]/g,'');
				//这里匹配时间，一行可能有多个时间
				timeRegExpArr = decodeURIComponent(lrcArray[i]).match(/\[\d*:\d*((\.|\:)\d*)*\]/g);
				//console.debug(timeRegExpArr);
				if(timeRegExpArr) {
					for(var k = 0,h = timeRegExpArr.length;k < h;k++) {
						//第一遍循环，JSON存储歌词，数组存储时间
						var minute = Number(String(timeRegExpArr[k].match(/\[\d*/i)).slice(1));
						var second = Number(String(timeRegExpArr[k].match(/\:\d*/i)).slice(1));
						time = minute * 60 + second;
						//console.debug(time);
						if(!baseSelf.lrc_timeKey[time]){
							baseSelf.lrc_strArray.push(time);
							baseSelf.lrc_timeKey[time] = clause + '<br />';
						} else {
							baseSelf.lrc_timeKey[time] += clause + '<br />';
						}
					}
				} else {
					if(clause.replace(/\s* /g,'') == '') {
						continue;
					}
					//所有其他的信息都显示在刚开始
					if(!baseSelf.lrc_strArray.length) {
						time = 0;
						baseSelf.lrc_strArray.push(time);
						baseSelf.lrc_timeKey[time] = clause + '<br />';
					}
				}
			}
			baseSelf.lrc_strArray.sort(function(a,b) {
				return a-b;
			});
			
			//console.debug(baseSelf.lrc_timeKey);
			//console.debug(baseSelf.lrc_strArray);
			
			//如果需要添加歌词就嵌套一个div
			if(optionsOrg.lrcContainer){
				$(optionsOrg.lrcContainer).append('<div></div>');
				if($(optionsOrg.lrcContainer).css('position')=='relative' && $(optionsOrg.lrcContainer).css('overflow')=='hidden' && parseInt($(optionsOrg.lrcContainer).css('height'))>0){
					$(optionsOrg.lrcContainer).children('div').css({
						position:'absolute',
						textAlign:'center',
						width:'100%',
						top:0
					});
					optionsOrg._autoScroll=true;
				}
			}
			
			if(baseSelf.lrc_strArray.length==0){
				$(optionsOrg.lrcContainer).append('<div>LRC Parse Error !</div>');
				return;
			}
			
			//console.debug(baseSelf.lrc_timeKey);
			//console.debug(baseSelf.lrc_strArray);
			
			//第二遍循环，先将数组替换成歌词，JSON存储对应歌词行号（此处与编程中的数组下标相对应，从0开始），也就是变成了时间点和行号的键值对。
			lastSec=0;
			for(var i = 0,l = baseSelf.lrc_strArray.length;i < l;i++) { //第二遍循环，JSON存储时间，数组存储歌词
				var tempIndex = baseSelf.lrc_strArray[i],
				tempClause = baseSelf.lrc_timeKey[tempIndex];
				if(tempClause.substring(tempClause.length-6)=='<br />'){
					tempClause=tempClause.substring(0,tempClause.length-6);
				}
				//替换
				tempClause=tempClause.replace(/\[(al|ti|ar)\:([^\]]*)\]/g,'$2');
				tempClause=tempClause.replace(/\[[^\]]*\]/g,'');
				baseSelf.lrc_strArray[i] = '<p>'+ tempClause + '</p>';
				if(i) {
					for(var k=lastSec;k<tempIndex;k++){ //将之前空余时间全赋值，以便拖动时定位
						baseSelf.lrc_timeKey[k]=i-1;
					}
				} else {
					for(var k = lastSec;k < tempIndex;k++) { //将最开始未标记的时间的键值定为负值
						baseSelf.lrc_timeKey[k] = -1;
					}
				}
				baseSelf.lrc_timeKey[tempIndex] = i;
				lastSec = tempIndex + 1;
				//添加歌词
				if(optionsOrg.lrcContainer){
					if(optionsOrg.lrcClass){
						$(optionsOrg.lrcContainer).children('div').append($(baseSelf.lrc_strArray[i]).addClass(optionsOrg.lrcClass));
					}
				}
			}
			
			//console.debug(baseSelf.lrc_timeKey);
			//console.debug(baseSelf.lrc_strArray);
			
		};
		///////////////////////// 私有函数结束 ////////////////////////////////
		baseSelf.lastTimeChangeTime=0;
		baseSelf.timeChangeCallback=function(cur_ms,total_ms){		
			//$('#debug_box').html(cur_ms+'/'+total_ms);
			//console.debug(cur_ms);
			//查找DOM需要代价的
			if(baseSelf.lrc_timeKey.length==0){
			  	return; 
			 }
			var time=parseInt(cur_ms/1000);
			if(time!=baseSelf.lastTimeChangeTime || time==0){
				var container=$(optionsOrg.lrcContainer).children('div');
				var obj=container.children('p').removeClass(optionsOrg.lrcHighlightClass);
				//console.debug(time);
				if(obj[baseSelf.lrc_timeKey[time]]){
					var curline=$(obj[baseSelf.lrc_timeKey[time]]);
					curline.addClass(optionsOrg.lrcHighlightClass);
					//判断要不要滚动
					if(optionsOrg._autoScroll){
						var position=curline.position();
						var height=$(optionsOrg.lrcContainer).height();
						var newtop=((-position.top) + height / 2 - curline.height()/2);
						//console.debug(newtop);
						//console.debug(container.length);
						container.animate({top:newtop+'px'},100);
					}
				}
				baseSelf.lastTimeChangeTime=time;
			}
		};
		
		
		
		return this.each(function(){
			
			var obj = $(this),
			objo=null,
			opts = optionsOrg;
			
			/* 检查必要的参数 */
			if(!opts.flashUrl){
				alert('Missing argument ( flashUrl empty) !');
				return falsev;	
			}
			if(!opts.mp3Url){
				alert('Missing argument ( mp3Url empty) !');
				return falsev;	
			}
			if(opts.autoPlay){
				opts.autoPlay='true';
			}else{
				opts.autoPlay='false';	
			}
			/* 检查参数结束 */
			
			/* 生成 HTML代码 */
			var flashVar=new Array();
			
			flashVar.push('mp3Url='+baseSelf._urlencode(opts.mp3Url));
			flashVar.push('timeChangeCallback='+baseSelf._urlencode(opts.timeChangeCallback));
			flashVar.push('autoPlay='+baseSelf._urlencode(opts.autoPlay));
			
			var flashVarString=flashVar.join('&');
			var flashHtml=['<object id="_OPMP3Player_box" name="_OPMP3Player_box" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=6,0,29,0 " width="100%" height="50">',
				'<param name="movie" value="'+opts.flashUrl+'"> ',
				'<param name="quality" value="high">',
				'<param name="allowScriptAccess" value="always" />',
				'<param name="FlashVars" value="'+flashVarString+'" />',
				'<param name="wmode" value="transparent">',
				'<embed id="_OPMP3Player_box" name="_OPMP3Player_box" src="'+opts.flashUrl+'" FlashVars="'+flashVarString+'" quality="high" pluginspage="http://www.macromedia.com/go/getflashplayer" allowScriptAccess=”always” wmode="transparent" type="application/x-shockwave-flash" width="100%" height="50"></embed>',
			'</object>'];
			
			$(obj).html(flashHtml.join(''));
			
			//处理歌词
			if(opts.lrcUrl){
				$.get(opts.lrcUrl,{},function(data){baseSelf._lrcProcess(data);});
			}
		});
		
		
	};
	

})(jQuery);