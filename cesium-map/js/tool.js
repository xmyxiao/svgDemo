// window.customMap
(function(window, undefined){
	var customMap = customMap || {};
	customMap.tools = {
		//获取设备版本号
		getBrowserVersion: function(){
			// 获取设备
			var equipment = window.navigator.userAgent.toLowerCase();
			if(equipment.indexOf("msie") >= 0) {
				var e = Number(t.match(/msie ([\d]+)/)[1]);
				return {
					type: "IE",
					version: e
				}
			}
			if(equipment.indexOf("firefox") >= 0) {
				var e = Number(t.match(/firefox\/([\d]+)/)[1]);
				return {
					type: "Firefox",
					version: e
				}
			}
			if(equipment.indexOf("chrome") >= 0) {
				var e = Number(t.match(/chrome\/([\d]+)/)[1]);
				return {
					type: "Chrome",
					version: e
				}
			}
			if(equipment.indexOf("opera") >= 0) {
				var e = Number(t.match(/opera.([\d]+)/)[1]);
				return {
					type: "Opera",
					version: e
				}
			}
			if(equipment.indexOf("Safari") >= 0) {
				var e = Number(t.match(/version\/([\d]+)/)[1]);
				return {
					type: "Safari",
					version: e
				}
			}
			return {
				type: t,
				version: -1
			}
		},
		//判断是否支持webgl
		canWebgl: function(){
			var me = this, version = me.getBrowserVersion();
			if("IE" == version.type && version.version < 11){
				return !1;
			}
			try {
				var e, i = document.createElement("canvas");
				if("undefined" != typeof WebGL2RenderingContext && (e = i.getContext("webgl2") || i.getContext("experimental-webgl2") || void 0), null == e && (e = i.getContext("webgl") || i.getContext("experimental-webgl") || void 0), null == e){
					return !1
				}
			} catch(t) {
				return !1
			}
			return !0
		},
		// 获取当前三维范围
		getCurrentExtent: function() {
		    // 范围对象
		    var extent = {};
		    
		    // 得到当前三维场景
		    var scene = viewer.scene;
		    
		    // 得到当前三维场景的椭球体
		    var ellipsoid = scene.globe.ellipsoid;
		    var canvas = scene.canvas;
		    
		    // canvas左上角
		    var car3_lt = viewer.camera.pickEllipsoid(new Cesium.Cartesian2(0,0), ellipsoid);
		    
		    // canvas右下角
		    var car3_rb = viewer.camera.pickEllipsoid(new Cesium.Cartesian2(canvas.width,canvas.height), ellipsoid);
		    
		    // 当canvas左上角和右下角全部在椭球体上
		    if (car3_lt && car3_rb) {
		        var carto_lt = ellipsoid.cartesianToCartographic(car3_lt);
		        var carto_rb = ellipsoid.cartesianToCartographic(car3_rb);
		        extent.xmin = Cesium.Math.toDegrees(carto_lt.longitude);
		        extent.ymax = Cesium.Math.toDegrees(carto_lt.latitude);
		        extent.xmax = Cesium.Math.toDegrees(carto_rb.longitude);
		        extent.ymin = Cesium.Math.toDegrees(carto_rb.latitude);
		        extent.xcenter = (extent.xmin + extent.xmax) / 2;
		        extent.ycenter = (extent.ymin + extent.ymax) / 2;
		    }
		    
		    // 当canvas左上角不在但右下角在椭球体上
		    else if (!car3_lt && car3_rb) {
		        var car3_lt2 = null;
		        var yIndex = 0;
		        do {
		            // 这里每次10像素递加，一是10像素相差不大，二是为了提高程序运行效率
		            yIndex <= canvas.height ? yIndex += 10 : canvas.height;
		            car3_lt2 = viewer.camera.pickEllipsoid(new Cesium.Cartesian2(0,yIndex), ellipsoid);
		        }while (!car3_lt2);
		        var carto_lt2 = ellipsoid.cartesianToCartographic(car3_lt2);
		        var carto_rb2 = ellipsoid.cartesianToCartographic(car3_rb);
		        extent.xmin = Cesium.Math.toDegrees(carto_lt2.longitude);
		        extent.ymax = Cesium.Math.toDegrees(carto_lt2.latitude);
		        extent.xmax = Cesium.Math.toDegrees(carto_rb2.longitude);
		        extent.ymin = Cesium.Math.toDegrees(carto_rb2.latitude);
		        extent.xcenter = (extent.xmin + extent.xmax) / 2;
		        extent.ycenter = (extent.ymin + extent.ymax) / 2;
		    }
		    
		    // 获取高度
		    extent.height = Math.ceil(viewer.camera.positionCartographic.height);
		    return extent;
		}
	};
	customMap.widget = {
		// 点击事件
		activate: function(item){
			if(item.type && item.type === 'window'){
				this.openWindow(item)
			}else if(item.type && item.type === 'divwindow'){
				this.openDivWindow(item)
			}
		},
		// 打开窗口
		openWindow: function(item){
			if(item.layerIdx){
				layer.close(item.layerIdx);
				item.layerIdx = '';
				return
			}
			var me = this,
			itemUrl = item.widget,
			config = {
				type: 2,
				content: [itemUrl, "no"],
				success: function(data) {
					var layIframe = window[data.find("iframe")[0].name];
					layer.setTop(data);
					layIframe && layIframe.initWidgetView ? layIframe.initWidgetView(me) : console.error(itemUrl + "页面没有定义function initWidgetView(widget)方法，无法初始化widget页面!");
				},
				cancel: function(){
					item.layerIdx = '';
				}
			};
			item.layerIdx = layer.open(this.getWinOpt(item, config));
		},
		// 打开弹出框
		openDivWindow: function(item){
			if(item.layerIdx){
				layer.close(item.layerIdx);
				item.layerIdx = '';
				if(item.windowClose){
					eval(item.windowClose);
				}
				return
			}
			var widget = this;
			this.getHtml(item.widget, function(e) {
				var n = {
					type: 1,
					content: e,
					success: function(e) {
						layer.setTop(e);
					},
					cancel: function(data){
					   item.layerIdx = '';
					   if(item.windowClose){
						eval(item.windowClose)
					   }
					}
				};
				item.layerIdx = layer.open(widget.getWinOpt(item,n))
			})
		},
		// 弹出框html
		getHtml: function(url, fun) {
			$.ajax({
				url: url,
				type: "GET",
				dataType: "html",
				timeout: 0,
				success: function(t) {
					fun(t)
				}
			})
		},
		// 获取打开窗口配置
		getWinOpt: function(item, config){
			var defWindowOptions = {
				"skin": "layer-mars-dialog animation-scale-up",
				"maxmin": false,
				"name": '<i class="' + item.icon + '"></i>' + item.name + '',
				"type":item.type,
				"resize": true,
				"position": {
					"right": 10,
					"top": 50,
					"bottom":10
				}
			},
			newConfig = $.extend(defWindowOptions, item.windowOptions);
			item.windowOptions = newConfig;
			this.config = item;
			var me = this,
				size = this.getWinSize(newConfig),
				opt = {
					title: newConfig.name || " ",
					area: size.area,
					offset: size.offset,
					shade: 0,
					maxmin: !1,
					zIndex: layer.zIndex,
					end: function() {
						
					},
					full: function(t) {
						
					},
					min: function(t) {
						
					},
					restore: function(t) {
						
					}
				},
				newOption = $.extend(opt, newConfig);
			return $.extend(newOption, config || {})
		},
		// 获取弹框位置信息
		getWinSize: function(config){
			var width = config.width,
				height = config.height,
				newPosition = "",
				itemPosition = config.position;
			if(itemPosition){
				if("string" == typeof itemPosition){
					n = itemPosition;
				}
				else if("object" == typeof itemPosition) {
					var top, left;
					if(itemPosition.hasOwnProperty("top") && null != itemPosition.top && (top = itemPosition.top), itemPosition.hasOwnProperty("bottom") && null != itemPosition.bottom) {
						var bottom = itemPosition.bottom;
						null != top ? height = document.documentElement.clientHeight - top - bottom : top = document.documentElement.clientHeight - height - bottom;
					}
					if(itemPosition.hasOwnProperty("left") && null != itemPosition.left && (left = itemPosition.left), itemPosition.hasOwnProperty("right") && null != itemPosition.right) {
						var right = itemPosition.right;
						null != left ? width = document.documentElement.clientWidth - left - right : left = document.documentElement.clientWidth - width - right
					}
					null == top && (top = (document.documentElement.clientHeight - height) / 2), 
					null == left && (left = (document.documentElement.clientWidth - width) / 2), 
					newPosition = [top + "px", left + "px"]
				}
			}
			if(config.type === "divwindow"){
				width = config.width;
				height = config.height;
			}
			var areaConfig;
			return areaConfig = width && height ? [width + "px", height + "px"] : width + "px", {
				area: areaConfig,
				offset: newPosition
			}
		},
		// 获取弹框数据
		getLayerData: function(key){
			var config = customMap.config;
			var data = [];
			if(config && config.customMap){
				data = config.customMap[key];
			}
			return data;
		},
		// 视图焦点
		centerAt: function(config){
			if(!config.center){
				return
			}
			
			var center = config.center;
			// Cesium.Cartesian3.fromDegrees(longitude, latitude, height, ellipsoid, result)
			var initialPosition = new Cesium.Cartesian3.fromDegrees(center.x, center.y, center.z);
			// 创建摄像机位置
			var initialOrientation = new Cesium.HeadingPitchRoll.fromDegrees(center.heading || 0, center.pitch || -90, center.roll || 0);
			var centerCameraView = {
			    destination : initialPosition,   //摄像机在坐标中的最终位置或从上到下视图可见的矩形。
			    orientation : {
			        heading : initialOrientation.heading,  // 方位角
			        pitch : initialOrientation.pitch,  // 俯仰角（弧度）
			        roll : initialOrientation.roll  // 翻滚角
			    }
			};
			
			// 添加相机飞行动画
			centerCameraView.duration = 3.0;                           //飞行时间（s）
			centerCameraView.maximumHeight = 1500000;                     //飞行最大高度
			centerCameraView.pitchAdjustHeight = 1500000;				 //飞行高度高于这个值时俯视  和一些处理
			centerCameraView.endTransform = Cesium.Matrix4.IDENTITY;   //飞行完成后位置转换
			
			viewer.scene.camera.flyTo(centerCameraView);
		},
		// 添加gltf模型
		addGltfLayer: function(config){
			if(!config.position){
				return
			}
			var viewPosition = config.position;
			var position = Cesium.Cartesian3.fromDegrees(viewPosition.x,viewPosition.y);
			var hpRoll = new Cesium.HeadingPitchRoll(config.hpRoll);
			var fixedFrameTransforms = Cesium.Transforms.localFrameToFixedFrameGenerator('north','west');
			var scene = viewer.scene;
			var carPrimitive = scene.primitives.add(Cesium.Model.fromGltf({
				url : config.url,
				modelMatrix: Cesium.Transforms.headingPitchRollToFixedFrame(position,hpRoll,Cesium.Ellipsoid.WGS84,fixedFrameTransforms),
				minimumPixelSize:128,
				scale : config.scale || 1.0
			}));
			carPrimitive.show = config.visible || false;
			return carPrimitive;
		},
		// 添加3dtitle模型
		add3DtilesLayer: function(config){
			if(!config){
				return
			}
			var height = config.offset.z || 0;
			var tileset = new Cesium.Cesium3DTileset({ 
				url: config.url 
			});
			
			viewer.scene.primitives.add(tileset);
			
			tileset.readyPromise.then(function(tileset) {
			    var cartographic = Cesium.Cartographic.fromCartesian(tileset.boundingSphere.center);
			    var surface = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0.0);
			    var offset = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, height);
			    var translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());
			    tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
			}).otherwise(function(error) {
			    console.log(error);
			});
			tileset.show = config.visible || false;
			return tileset
		},
		// 获取标记信息
		getMarkData: function(){
			return customMap.config.customMap.markerData || []
		}
	}
	window.customMap = customMap;
})( window );