function discard(){var e,t;if(discarding=!0,"multiWorker"===workerType){if(loadRequests.length>0){for(t=new RequestsBatch;e=loadRequests.shift();)t.requests.push(e);pendingLoadBatch.push(t)}loadRequests.length=0}else for(var a in loadRequests){if(loadRequests[a].length>0){for(t=new RequestsBatch;e=loadRequests[a].shift();)t.requests.push(e);pendingLoadBatch.push(t)}delete loadRequests[a]}for(;t=pendingLoadBatch.shift();)loadBatch(t),requestedloadBatchCount++;pendingLoadBatch=[],void 0!==loadBatchTimeoutId&&(clearTimeout(loadBatchTimeoutId),loadBatchTimeoutId=void 0),requestedloadBatchCount=0,buildedloadBatchCount=0;for(var r in xhrs)xhrs[r].abort();xhrs={},discarding=!1}function convertToTypedArraySet(e,t,a,r,o){if(o[t]){var s=a+r.readInt32(),d=r.readInt32(),n=0;if("index"===t&&o.intIdx){n=d/bufferParam.index_32.BYTES_PER_ELEMENT;var i=e.slice(s,s+d);o[t].push(new bufferParam.index_32.typedArray(i,0,n))}else n=d/bufferParam[t].BYTES_PER_ELEMENT,o[t].push(new bufferParam[t].typedArray(e,s,n))}}function convertToPrimitiveResources(e,t,a,r,o,s,d,n,i,u){var f=[];t.forEach(function(e,t){var a={};if(e>>PRIM_MODE_BIT==4)a.position=[],e&PRIM_NRM_MASK&&(a.normal=[]);else{if(u===RANGE_LODTYPE_LD)return;a.position=[]}a.index=[],e&PRIM_UV_MASK&&(a.uv=[]),e&PRIM_COLOR_MASK&&(a.color=[]),a.intIdx=i[t],f[t]=a});var c,l=new DataStream(e,!0);c=u===RANGE_LODTYPE_LD?a.rangeLD:u===RANGE_LODTYPE_HD?a.rangeHD:a.range;var p,h=c[r];for(p=r;p<o;p++){var g=c[p]-h;c[p+1];l.seek(g),f.forEach(function(t){convertToTypedArraySet(e,"position",g,l,t),convertToTypedArraySet(e,"normal",g,l,t),convertToTypedArraySet(e,"uv",g,l,t),convertToTypedArraySet(e,"color",g,l,t),convertToTypedArraySet(e,"index",g,l,t)})}f.forEach(function(e){var t={},a={};for(attr in e){var r=0,o=0,i=null,u=null;if("intIdx"!==attr){e[attr].forEach(function(e){r+=e.length}),"position"!==attr&&"index"!==attr||(u=new Uint32Array(e[attr].length)),i="index"===attr&&e.intIdx?new bufferParam.index_32.typedArray(r):new bufferParam[attr].typedArray(r),o=0;var f=0;e[attr].forEach(function(e){if(i.set(e,o),o+=e.length,u){var t=o/bufferParam[attr].componentSize;u[f++]=t}}),t[attr]=i,u&&(a[attr]=u,n.push(u.buffer)),n.push(i.buffer)}}s.push(t),d.push(a)})}function getSegBufferRange(e,t){var a,r,o;if([e.segIdxRange,e.segRange,e.geomRange].forEach(function(e,t){e&&(r=void 0===r?e[0]:Math.min(r,e[0]),o=void 0===o?e[1]:Math.max(o,e[1]))}),void 0!==r&&void 0!==o){var s;s=t===RANGE_LODTYPE_LD?e.bufferLD:t===RANGE_LODTYPE_HD?e.bufferHD:e.buffer;var d=s.byteOffset;a={begin:r+d,end:o+d}}return a}function convertToTypedArray(e,t,a,r,o,s,d,n,i){var u,f,c,l;if(c=i===RANGE_LODTYPE_LD?t.bufferLD:i===RANGE_LODTYPE_HD?t.bufferHD:t.buffer,u=c.byteOffset,f=t[a+"Range"]){l=bufferParam[a].typedArray;var p=new DataStream(e,!0),h=f[0]-r+u;f[1];p.seek(h),o.forEach(function(t,r){if((i!==RANGE_LODTYPE_LD||t>>PRIM_MODE_BIT!=1)&&t>>PRIM_MODE_BIT!=0){var o=h+p.readUint32(),u=p.readUint32();if(0!==u){var f,c,g,v=n[r];"segIdx"===a&&v?(f=u/bufferParam.segIdx_32.typedArray.BYTES_PER_ELEMENT,c=e.slice(o,o+u),g=new bufferParam.segIdx_32.typedArray(c,0,f)):(f=u/l.BYTES_PER_ELEMENT,c=e.slice(o,o+u),g=new l(c,0,f)),s[r][a]=g,d.push(g.buffer)}}})}}function convertToSegResources(e,t,a,r,o,s,d,n){var i;i=n===RANGE_LODTYPE_LD?a.rangeLD:n===RANGE_LODTYPE_HD?a.rangeHD:a.range;var u=i[r];convertToTypedArray(e,a,"segIdx",u,t,o,s,d,n),convertToTypedArray(e,a,"seg",u,t,o,s,d,n),convertToTypedArray(e,a,"geom",u,t,o,s,d,n)}function getBufferRange(e,t){var a=e.loadedLODLevel,r=e.LODLevel,o=e.bufferView;e.LODtype===RANGE_LODTYPE_LD?(t.startIndex=0,t.endIndex=1,t.buffer=o.bufferLD,t.range=o.rangeLD):e.LODtype===RANGE_LODTYPE_HD?(a<1?(t.startIndex=0,t.endIndex=1):(t.startIndex=1,t.endIndex=1),t.buffer=o.bufferHD,t.range=o.rangeHD):(t.startIndex=a<0?0:a+1,t.endIndex=r+1,t.buffer=o.buffer,t.range=o.range)}function load(e){var t,a,r,o=new XMLHttpRequest,s=e.id,d=e.primitiveModes,n=e.loadedLODLevel,i=e.LODLevel,u=e.bufferView,f={};xhrs[s]=o,getBufferRange(e,f),r=f.buffer.byteOffset,t=r+f.range[f.startIndex],a=r+f.range[f.endIndex]-1;var c;e.forceLoadMaxLOD&&(c=getSegBufferRange(u,e.LODtype)),c&&a<c.end&&(a=c.end);var l=getXHRParameter(t+"-"+a),p=f.buffer.uri;o.open(l.method,p),o.responseType="arraybuffer",o.setRequestHeader(l.header,l.value),o.onload=function(t){if(200===o.status||206===o.status){if(discarding)return void postMessage({type:"onBuildedLoad",requestSize:1});if(!xhrs[e.id])return void postMessage({type:"onBuildedLoad",requestSize:1});delete xhrs[e.id];var a=o.response,r=a.byteLength;postMessage({type:"onBuildedLoad",requestSize:1,dataSize:r});var s=[],l=[],h=[],g=e.intIndices,v=e.LODtype;convertToPrimitiveResources(a,d,u,f.startIndex,f.endIndex,s,l,h,g,v);var L=!1;void 0!==c&&(convertToSegResources(a,d,u,f.startIndex,s,h,g,v),L=!0);var y={id:e.id,type:"onload",loadedLODLevel:n,LODLevel:i,LODtype:v,primitive:{resources:s,ranges:l}};L&&(y.isSegment=!0),postMessage(y,h)}else{var y={id:e.id,uri:p,status:o.status,text:o.statusText,type:"onerror"};postMessage(y),postMessage({type:"onBuildedLoad",requestSize:1})}},o.onerror=function(t){postMessage({type:"onBuildedLoad",requestSize:1});var a={id:e.id,uri:p,status:o.status,text:o.statusText,type:"onerror"};postMessage(a)},o.send(l.body)}function parseMultipartBody(e,t){for(var a="--"+t,r=a,o=new DataView(e),s=0,d=[],n=0,i=0,u=0;u<o.byteLength;++u){if(o.getUint8(u)==r.charCodeAt(s)){if(++s>=r.length)switch(n){case 0:n=1,s=0,r="\r\n\r\n";break;case 1:n=2,s=0,r=a,i=u+1;break;case 2:d.push({begin:i,end:u-r.length-2}),n=1,s=0,r="\r\n\r\n"}}else s=0}return d}function getXHRParameter(e){return useHttpParameter?{method:"POST",header:"Content-Type",value:"application/x-www-form-urlencoded",body:"Range=bytes%3D"+e}:{method:"GET",header:"Range",value:"bytes="+e,body:null}}function loadBatch(e){var t,a,r=e.requests,o=[];if(r.forEach(function(e){if(isStopForceLoad&&e.forceLoadRequest)return void postMessage({type:"onForceLoadStop",id:e.id});e.forceLoadRequest?postMessage({type:"onForceLoadRequest"}):postMessage({type:"onSmartLoadRequest"});var r,s,d,n=(e.id,e.primitiveModes,e.intIndices,e.loadedLODLevel,e.LODLevel,e.bufferView),i={};getBufferRange(e,i),d=i.buffer.byteOffset,r=d+i.range[i.startIndex],s=d+i.range[i.endIndex]-1;var u;e.forceLoadMaxLOD&&(u=getSegBufferRange(n,e.LODtype)),u&&s<u.end&&(s=u.end),u&&(e.segRange=u),void 0===t?t="":t+=",",t+=r+"-"+s,o.push({begin:r,end:s}),void 0===a&&(a=i.buffer.uri)}),0===o.length)return buildedloadBatchCount++,void postMessage({type:"onBuildedLoad",requestSize:e.requests.length});var s=getXHRParameter(t),d=new XMLHttpRequest,n=e.batchId;xhrs[n]=d,d.open(s.method,a),d.responseType="arraybuffer",d.setRequestHeader(s.header,s.value),d.onload=function(t){if(discarding)return buildedloadBatchCount++,void postMessage({type:"onBuildedLoad",requestSize:e.requests.length});if(!xhrs[e.batchId])return buildedloadBatchCount++,void postMessage({type:"onBuildedLoad",requestSize:e.requests.length});if(delete xhrs[e.batchId],200===d.status||206===d.status){var s,n=d.response,i=d.getResponseHeader("Content-Type"),u=i.match(/boundary=(.+)$/i),f=n.byteLength;s=u?parseMultipartBody(n,u[1]):o,postMessage({type:"onBuildedLoad",requestSize:e.requests.length,dataSize:f});var c=0;s.forEach(function(e,t){var a,o,s=e.begin,d=e.end;u?(a=s,o=d):(a=c,o=c+d-s,c=o+1);var i,f,l=[],p=[],h=[],g=r[t],v=(g.id,g.primitiveModes),L=g.intIndices,y=g.loadedLODLevel,E=g.LODLevel,b=g.bufferView,T=g.LODtype;if(isStopForceLoad&&g.forceLoadRequest)return void postMessage({type:"onForceLoadStop",id:g.id});T===RANGE_LODTYPE_LD?(i=0,f=1):T===RANGE_LODTYPE_HD?y<1?(i=0,f=1):(i=1,f=1):(i=y<0?0:y+1,f=E+1);var _=n.slice(a,o+1);convertToPrimitiveResources(_,v,b,i,f,l,p,h,L,T);var R=!1;void 0!==g.segRange&&(convertToSegResources(_,v,b,i,l,h,L,T),R=!0);var B={id:g.id,type:"onload",loadedLODLevel:y,LODLevel:E,LODtype:T,primitive:{resources:l,ranges:p}};R&&(B.isSegment=!0),postMessage(B,h)}),buildedloadBatchCount++}else{for(var l=0;l<r.length;l++){var p={id:r[l].id,uri:a,status:d.status,text:d.statusText,type:"onerror"};postMessage(p)}buildedloadBatchCount++,postMessage({type:"onBuildedLoad",requestSize:e.requests.length})}},d.onabort=function(t){if(buildedloadBatchCount++,postMessage({type:"onBuildedLoad",requestSize:e.requests.length}),xhrs[e.batchId]){delete xhrs[e.batchId];for(var a=0;a<r.length;a++){var o={id:r[a].id,type:"onabort"};postMessage(o)}}},d.onerror=function(t){if(buildedloadBatchCount++,postMessage({type:"onBuildedLoad",requestSize:e.requests.length}),!discarding&&xhrs[e.batchId]){delete xhrs[e.batchId];for(var o=0;o<r.length;o++){var s={id:r[o].id,uri:a,status:d.status,text:d.statusText,type:"onerror"};postMessage(s)}}},d.ontimeout=function(t){if(buildedloadBatchCount++,postMessage({type:"onBuildedLoad",requestSize:e.requests.length}),!discarding&&xhrs[e.batchId]){delete xhrs[e.batchId];for(var o=0;o<r.length;o++){var s={id:r[o].id,uri:a,status:d.status,text:d.statusText,type:"onerror"};postMessage(s)}}},d.send(s.body)}function execLoadBatch(){var e;if(requestedloadBatchCount===requestLoadBatchMax)requestedloadBatchCount===buildedloadBatchCount&&(requestedloadBatchCount=0,buildedloadBatchCount=0);else for(;(e=pendingLoadBatch.shift())&&(loadBatch(e),!(++requestedloadBatchCount>=requestLoadBatchMax)););void 0!==loadBatchTimeoutId&&0===pendingLoadBatch.length?(clearTimeout(loadBatchTimeoutId),loadBatchTimeoutId=void 0):loadBatchTimeoutId=setTimeout(execLoadBatch,10)}function flush(){if("multiWorker"===workerType){for(var e=new RequestsBatch,t=!0;request=loadRequests.shift();)e.requests.push(request),t=!1;t||pendingLoadBatch.push(e),void 0===loadBatchTimeoutId?loadBatchTimeoutId=setTimeout(execLoadBatch,10):t&&void 0!==loadBatchTimeoutId&&0===pendingLoadBatch.length&&(clearTimeout(loadBatchTimeoutId),loadBatchTimeoutId=void 0)}else for(var a in loadRequests){for(var e=new RequestsBatch,t=!0;request=loadRequests[a].shift();)e.requests.push(request),t=!1;t||pendingLoadBatch.push(e),void 0===loadBatchTimeoutId?loadBatchTimeoutId=setTimeout(execLoadBatch,10):t&&void 0!==loadBatchTimeoutId&&0===pendingLoadBatch.length&&clearTimeout(loadBatchTimeoutId)}}var xhrs={},workerId=0,loadRequests=[],requestsBatchIdCount=0,batchSize=10,serverType="XCM",workerType="multiWorker",useHttpParameter=!1,requestLoadBatchMax=100,pendingLoadBatch=[],loadBatchTimeoutId=void 0,requestedloadBatchCount=0,buildedloadBatchCount=0,isStopForceLoad=!1,RequestsBatch=function(){this.batchId=requestsBatchIdCount++,this.requests=[]};RequestsBatch.prototype.clear=function(){this.requests.length=0};var discarding=!1;addEventListener("message",function(e){switch(e.data.type){case"set worker id":workerId=e.data.value;break;case"set batch size":batchSize=e.data.value;break;case"set use http parameter":useHttpParameter=e.data.value;break;case"set server type":serverType=e.data.value;break;case"set worker type":workerType=e.data.value;break;case"set request load batch max":requestLoadBatchMax=e.data.value;break;case"load":if("XCM"===serverType)if("multiWorker"===workerType)loadRequests.push(e.data),loadRequests.length>=batchSize&&flush();else{if(!e.data||!e.data.bufferView)break;var t;if(e.data.LODtype===RANGE_LODTYPE_LD){if(!e.data.bufferView.bufferLD||!e.data.bufferView.bufferLD.uri)break;t=e.data.bufferView.bufferLD.uri}else if(e.data.LODtype===RANGE_LODTYPE_HD){if(!e.data.bufferView.bufferHD||!e.data.bufferView.bufferHD.uri)break;t=e.data.bufferView.bufferHD.uri}else{if(!e.data.bufferView.buffer||!e.data.bufferView.buffer.uri)break;t=e.data.bufferView.buffer.uri}void 0===loadRequests[t]&&(loadRequests[t]=[]),loadRequests[t].push(e.data),loadRequests[t].length>=batchSize&&flush()}else load(e.data);break;case"flush":"XCM"===serverType&&flush();break;case"process":discard(),postMessage({type:"onpreprocess"});break;case"interrupt":0===loadRequests.length&&0===Object.keys(xhrs).length&&postMessage({type:"onabort"}),discard();break;case"close":discard(),close();break;case"set stop force Load":isStopForceLoad=e.data.value}});var DataStream=function(e,t){this._position=0,this._dataView=new DataView(e),this._littleEndian=t||!0};DataStream.prototype.readUint32=function(){var e=this._dataView.getUint32(this._position,this._littleEndian);return this._position+=4,e},DataStream.prototype.readInt32=function(){var e=this._dataView.getInt32(this._position,this._littleEndian);return this._position+=4,e},DataStream.prototype.readUint16=function(){var e=this._dataView.getUint16(this._position,this._littleEndian);return this._position+=2,e},DataStream.prototype.seek=function(e){this._position=e};var bufferParam={position:{typedArray:Uint16Array,BYTES_PER_ELEMENT:2,componentSize:3},normal:{typedArray:Uint8Array,BYTES_PER_ELEMENT:1,componentSize:2},uv:{typedArray:Uint16Array,BYTES_PER_ELEMENT:2,componentSize:2},color:{typedArray:Uint8Array,BYTES_PER_ELEMENT:1,componentSize:3},index:{typedArray:Uint16Array,BYTES_PER_ELEMENT:2,componentSize:1},index_32:{typedArray:Uint32Array,BYTES_PER_ELEMENT:4,componentSize:1},segIdx:{typedArray:Uint16Array,BYTES_PER_ELEMENT:2,componentSize:1},segIdx_32:{typedArray:Uint32Array,BYTES_PER_ELEMENT:4,componentSize:1},seg:{typedArray:Uint32Array,BYTES_PER_ELEMENT:4,componentSize:1},geom:{typedArray:Int32Array,BYTES_PER_ELEMENT:4,componentSize:1}},PRIM_TRIANGLE=4,PRIM_LINES=1,PRIM_NRM_MASK=4,PRIM_UV_MASK=2,PRIM_COLOR_MASK=1,PRIM_MODE_BIT=3,RANGE_LODTYPE_LD=1,RANGE_LODTYPE_HD=2;