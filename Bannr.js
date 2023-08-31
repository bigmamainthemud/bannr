// UPDATED 04 2023 BAM
// -- NOTES --
// 'addChildren' - does not req. an array
// Added 'sheetsLoader'
// Removed setMask;

'use strict';

const { log, table } = console;
document.body.style.margin = '0px';
document.body.style.padding = '0px';

var dcs = false, sizmek = false;
var stageBorder, childIndex = 0, milsPassed = 0;
var images = [], imgNames = [], imgObjects = [];
var sheetsArr;

function getTimer(){
	return milsPassed;
}
function setMedia(mCo, fn){
	log('Init ' +mCo+ ' API');

	switch(mCo.toLowerCase()){
		case 'doubleclick':
		case 'dcs':
			dcs = true;
			function checkVisible() {
				Enabler.isVisible() ? politeLoad() : Enabler.addEventListener(studio.events.StudioEvent.VISIBLE, politeLoad);
			}
			function politeLoad(){
				Enabler.isPageLoaded() ? fn() : Enabler.addEventListener(studio.events.StudioEvent.PAGE_LOADED, fn);
			}
			Enabler.isInitialized() ? checkVisible() : Enabler.addEventListener(studio.events.StudioEvent.INIT, checkVisible);
			break;

		case 'sizmek':
			sizmek = true;
			function loadPolite(){
				EB._isPageLoaded ? fn() : EB.addEventListener(EBG.EventName.PAGE_LOAD, fn);
			}
			
			switch(window.location.href.substr(0, 17)){
				case 'http://clienthost': EB.isInitialized() ? fn() : EB.addEventListener(EBG.EventName.EB_INITIALIZED, fn); break;
				default: EB.isInitialized() ? loadPolite() : EB.addEventListener(EBG.EventName.EB_INITIALIZED, loadPolite); break;
			}
			break;

		case 'polite':
			if(document.readyState == 'complete' || document.readyState == 'loaded') fn();
			else document.addEventListener('readystatechange', (event) => {
				if(document.readyState == 'complete' || document.readyState == 'loaded') fn();
			});
			break;

		default: console.log('Set Media Company'); break;
	}
}
function assetLoader(arr, callback, vars){
	// log('LOAD IMAGES: '+arr, 'callback = '+callback.iname);
	// for(var i in vars){
	// 	log(i+':'+vars[i]);
	// }

	var vars = vars || {};
	var assetLoader = new Objectr('assetLoader');
    assetLoader.style.width = '25%';
    assetLoader.style.height = '10px';
    assetLoader.style.margin = 'auto';
    assetLoader.style.left = '0';
    assetLoader.style.right = '0';
    assetLoader.style.top = '0';
    assetLoader.style.bottom = '0';
    assetLoader.style.border = '1px solid #999';

    var progressBar = new Objectr('progressBar');
    progressBar.style.opacity = '0.5';
    progressBar.style.backgroundColor = (vars.color) ? vars.color : '#336699';
    progressBar.style.width = '0%';
    progressBar.style.height = '100%';
    assetLoader.addChild(progressBar);

	var imgIndex = 0, 
		imgQueue = arr,
		totalLoaded = 0,
		prefix = (vars.path === undefined) ? '' : vars.path;

	window.addEventListener('loadProgress', progressEvent);
	window.addEventListener('loadComplete', progressEvent);
	loadNext();

	function loadNext(){
		var img = new Image();
		img.iname = imgQueue[imgIndex].split('.')[0];
		img.src = prefix + imgQueue[imgIndex];
		img.addEventListener('load', getImage);
		img.addEventListener('error', getImage);

		let isSVG = imgQueue[imgIndex].split('.')[1] == 'svg';

		function getImage(event){
			switch(event.type){
				case 'error':
					if(vars.errorHandler){
						log('getImage.error: '+imgIndex, imgQueue[imgIndex]);
						imgQueue[imgIndex] = vars.errorHandler(imgIndex);
						img.src = prefix + imgQueue[imgIndex];
						getImage('load');
					}else{
						log('ERROR: 404 on image :: no error handler');
					}
					break;

				case 'load':
					// log('LoadURL: '+img.src);
					img.removeEventListener('load', getImage);
					img.removeEventListener('error', getImage);

					if(vars.logDetails) log('getImage.load: '+imgIndex, imgQueue[imgIndex]);
					
					imgIndex++;
					images.push(this);
					imgNames.push(this.iname);

					// NEW AUTO 2022_12
					// imgObjects.push(new ImageObject(this.iname, (isSVG) ? false : true));  // RETINA CONTROL

					totalLoaded = Math.round((imgIndex)*(100/imgQueue.length))+'%';

					if(imgIndex === imgQueue.length){
						totalLoaded = 100;
						dispatchCustomEvent('loadComplete', window);
						window.removeEventListener('loadProgress', progressEvent);
						window.removeEventListener('loadComplete', progressEvent);
					}else{
						loadNext();
						dispatchCustomEvent('loadProgress', window);
					}
					break;
			}
		}
	}
	
	function progressEvent(event){
		switch(event.type){
            case 'loadProgress':
            	// log('totalLoaded = '+totalLoaded);
				TweenMax.to(progressBar, 0.5, {width:totalLoaded});
				break;
            case 'loadComplete':
                callback();
                break;
        }
    }

	return assetLoader;
}
function sheetsLoader(id, sNames, fn) {
	const sheetId = id;
	const base = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?`;
	const sheetNames = sNames;
	sheetsArr = new Array(sNames.length).fill([]);
	const query1 = encodeURIComponent('select *');
	const tabs = sheetNames.map(name =>
		fetch(`${base}&sheet=${name}&tq=${query1}`)
	);

	Promise.all(tabs)
	.then(res => Promise.all( res.map(r => r.text()) ))
	.then(res => 
		Promise.all( 
			res.map( (r, i) => {
			const sheet = JSON.parse(r.substring(47).slice(0, -2));
			const headers = sheet.table.cols
				.filter(heading => heading.label)
				.map(heading => heading.label.toLowerCase());
			const rows = sheet.table.rows.map(rowData => {
				const row = {};
				headers.forEach( (header, ind) => {
					row[header] = rowData.c[ind] ? rowData.c[ind].f || rowData.c[ind].v : '';
				});
				sheetsArr[i].push(row);
			});
		})
	))
	.then(res => {
		if(fn) fn();
	});
}
function Stage(width, height, bg){// (Number, Number, css.style.background)
	var stage = document.createElement('div');
	stage.id = 'stage';
	stage.width = width;
	stage.height = height;
	stage.style.width = width + 'px';
	stage.style.height = height + 'px';
	stage.style.position = 'absolute';
	stage.style.margin = '0px';
	stage.style.padding = '0px';
	stage.style.overflow = 'hidden';
	stage.style.scrolling = 'no';
	stage.style.cursor = 'pointer';

	if(bg !== undefined){
		stage.style.background = bg;
		stage.style.backgroundSize = width + 'px ' + height + 'px';
		stage.style.backgroundRepeat = 'no-repeat';
	}

	// Public
	stage.addChild = function(child){
		if(child.id.slice(child.id.length - 6) !== 'Border' && child.id.slice(child.id.length - 6) !== 'Loader'){
			child.style.zIndex = childIndex++;
		}
		stage.appendChild(child);
	};
	stage.addChildren = function(...arr){
		for(let i=0; i<arr.length; i++) stage.appendChild(arr[i]);
	};
	stage.addBorder = function(borderColor, borderW){
		var bColor = (borderColor === undefined) ? 'black' : borderColor;
		var bThick = (borderW === undefined) ? 1 : borderW;

		var stageBorder = new Objectr('stageBorder');
		stageBorder.style.pointerEvents = 'none';
		stageBorder.style.zIndex = '999999';
			var bID = ['left', 'right', 'top', 'bottom'],
				bX = [0, width - bThick, 0, 0],
				bY = [0, 0, 0, height - bThick],
				bW = [bThick, bThick, stage.width, stage.width],
				bH = [stage.height, stage.height, bThick, bThick];

			for(var i = 0; i < 4; i++){
				var b = new Objectr(bID[i]+'Border');
				b.style.left = bX[i]+'px';
				b.style.top = bY[i]+'px';
				b.style.width = bW[i]+'px';
				b.style.height = bH[i]+'px';
				b.style.backgroundColor = bColor;
				stageBorder.appendChild(b);
			}
		stage.appendChild(stageBorder);
	};

	document.body.appendChild(stage);
	window.setInterval(function(){milsPassed += 1}, 1000);
	return stage;
}
function Objectr(objName){
	// log(objName);
	var obj = document.createElement('div');
	if(objName !== undefined) obj.id = objName;
	obj.style.position = 'absolute';
	obj.width = 0;
	obj.height = 0;	

	// window[objName] = obj;

	// Public
	obj.addChild = function(child){
		var thisWidth = Number(child.style.left.split('px')[0]) + Number(child.style.width.split('px')[0]);
		if(thisWidth > obj.width) obj.width = thisWidth;
		obj.appendChild(child);
	};
	obj.addChildren = function(...arr){
		for(let i=0; i<arr.length; i++){
			let thisWidth = Number(arr[i].style.left.split('px')[0]) + Number(arr[i].style.width.split('px')[0]);
			let thisHeight = Number(arr[i].style.top.split('px')[0]) + Number(arr[i].style.height.split('px')[0]);
			// log(this.id, thisWidth, obj.width);
			if(thisWidth > obj.width) {
				obj.width = thisWidth;
				obj.style.width = `${thisWidth}px`;
				obj.style.height = `${thisHeight}px`;;
			}
			obj.appendChild(arr[i]);
		}
	};
	obj.image = function(path, imgW, imgH){
		obj.width = `${imgW}px`;
		obj.height = `${imgH}px`;
		obj.style.width = `${imgW}px`;
		obj.style.height = `${imgH}px`;
		obj.style.backgroundImage = 'url(' +path+ ')';
		obj.style.backgroundRepeat = 'no-repeat';
		obj.style.backgroundSize = `cover`;
	};
	obj.setImageById = function(isRetina, center){
		var img = images[imgNames.indexOf(this.id)];
		
		if(img === undefined){
			console.error('The image "' +this.id+ '" is not loaded');
		}else{
			if(isRetina == 'double') {
				obj.style.width = img.naturalWidth*2 + 'px';
				obj.style.height = img.naturalHeight*2 + 'px';
				TweenMax.set(img, {scale:2, transformOrigin:'0% 0%'});
			}else if(isRetina == 'x4') {
				obj.style.width = img.naturalWidth/4 + 'px';
				obj.style.height = img.naturalHeight/4 + 'px';
				TweenMax.set(img, {scale:0.25, transformOrigin:'0% 0%'});
			}else if(isRetina === true){
				obj.style.width = img.naturalWidth/2 + 'px';
				obj.style.height = img.naturalHeight/2 + 'px';
				TweenMax.set(img, {scale:0.5, transformOrigin:'0% 0%'});
			}else{
				obj.style.width = img.naturalWidth + 'px';
				obj.style.height = img.naturalHeight + 'px';
			}

			if(center) img.style.transform = 'translate(-50%, -50%)';

			obj.width = img.naturalWidth;
			obj.height = img.naturalHeight;
			obj.img = img;
			if(img.used) obj.appendChild(img.cloneNode(true));
			else obj.appendChild(img);
			img.used = true;
		}
	};
	obj.setFTImage = function(isRetina){
		var img = new Image(this.id);
		img.src = this.id;
		img.onload = () => {
			if(isRetina === true){
				obj.style.width = img.naturalWidth/2 + 'px';
				obj.style.height = img.naturalHeight/2 + 'px';
				TweenMax.set(img, {scale:0.5, transformOrigin:'0% 0%'});
			}
			
			img.width = img.naturalWidth;
			img.height = img.naturalHeight;
			obj.img = img;
			
			if(img.used) obj.appendChild(img.cloneNode(true));
			else obj.appendChild(img);
			img.used = true;
		};
	};
	obj.gradientBackground = function(a, b, c){
		obj.style.background = '-webkit-linear-gradient(' + a +','+ b + ')';
		obj.style.background = '-o-linear-gradient(' + a +','+ b + ')';
		obj.style.background = '-moz-linear-gradient(' + a +','+ b + ')';
		obj.style.background = 'linear-gradient(' + a +','+ b + ')';
	};
	obj.getProperty = function(propAsString, returnType){
		var props = new Object();

		if(propAsString){
			switch(returnType){
				case 'Number': props = parseFloat(window.getComputedStyle(obj, null).getPropertyValue(propAsString)); break;
				default: props = window.getComputedStyle(obj, null).getPropertyValue(propAsString); break;
			}
		}else{
			// Object.values = obj => Object.keys(obj).map(key => obj[key]);
		}

		if(propAsString === 'transform'){
			var values = new Object();
				values = r.split('(')[1];
			    values = values.split(')')[0];
			    values = values.split(',');
			    values.a = Number(values[0]);
			    values.b = Number(values[1]);
			    values.c = Number(values[2]);
			    values.d = Number(values[3]);
			    values.tx = Number(values[4]);
			    values.ty = Number(values[5]);

			    props = values;
		}
		
		// log(obj.id, propAsString, returnType, props);
		return props;
	};
	obj.setAlphaMask = function(maskObj){
		var canvas = document.createElement('canvas');
		canvas.width = obj.width;
		canvas.height = obj.height;
		obj.appendChild(canvas);

		var objImg = obj.getElementsByTagName('img')[0];
		var imgMask = maskObj.getElementsByTagName('img')[0];

		var ctx = canvas.getContext('2d');


			if(obj._gsTransform !== undefined){
				tX = obj._gsTransform.x;
				tY = obj._gsTransform.y;
			}
			ctx.drawImage(imgMask, 0, 0, obj.width, obj.height, 0, 0, obj.width, obj.height);
			ctx.globalCompositeOperation = 'source-atop';
			ctx.drawImage(objImg, 0, 0, obj.width, obj.height, 0, 0, obj.width, obj.height);
			objImg.src = canvas.toDataURL();
	}

	return obj;
}
function ImageObject(objID, isRetina, newID = objID, center = false){
	var iObj = new Objectr(objID);
	iObj.setImageById(isRetina, center);
	iObj.id = newID;
	return iObj;
}
function dispatchCustomEvent(type, eventObj = window){
	var cEvent = new CustomEvent(type);
	eventObj.dispatchEvent(cEvent);

	// log(`dispatchCustomEvent: ${eventObj}.${type}`);
}
function randomNumber(min, max, str){
	var type = (str !== undefined) ? str : 'default';

	switch(str){
		case 'down': case 'floor': return Math.floor(Math.random()*max + min); break;
		case 'round': return Math.round(Math.random()*max + min); break;
		case 'up': case 'ceil': return Math.ceil(Math.random()*max + min); break;
		default: return Math.random()*max + min; break;
	}
}
function checkDate(dateArray, testDate){
	// Date Format = '1/01/2001 00:00:00'
	var today = (testDate === undefined) ? new Date() : new Date(testDate);
	// log('TODAY = ' +today);

	var tuneInPeriod = 0;
	for(var i = 0; i < dateArray.length; i++){
		var d = new Date(dateArray[i]);
		if(today >= d) tuneInPeriod = i+1;
	}
	
	// log('tuneInPeriod = ' +tuneInPeriod);
	return tuneInPeriod;
}
function size_snap() {
	const sizes_str = [ '300x50', '300x250', '300x600', '320x50', '320x480', '414x736', '480x320', '728x90', '768x1024', '970x90', '970x250', '1024x768' ];
    let sizes_num = [];
    sizes_str.forEach((e)=>{
        let n1 = Number(e.split('x')[0]);
        let n2 = Number(e.split('x')[1]);
        sizes_num.push(n1, n2);
    });
    sizes_num = [...new Set(sizes_num)];

    sizes_num.forEach((val)=> {
        if(Math.abs(stageW-val) < 5) stageW = val;
        if(Math.abs(stageH-val) < 5) stageH = val;
    })
}

function IDsToVars(){
    var allElements = document.getElementsByTagName("*");
    for(var q = 0; q<allElements.length; q++){
        var el = allElements[q];
        if(el.id) window[el.id] = document.getElementById(el.id);
    }
};