var version = (function () {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', chrome.extension.getURL('../manifest.json'), false);
	xhr.send(null);
	return JSON.parse(xhr.responseText).version;
}());
var port = chrome.extension.connect({name: "popuplifeline"});
var bkg = chrome.extension.getBackgroundPage();
var closepage, mode, taburl, tabid, tabdomain;
var selected = false;
var intemp = false;
var blocked = [];
var allowed = [];
var statuschange = function() {
	port.postMessage({url: taburl, tid: tabid});
	bkg.statuschanger();
	window.close();
};
var revokealltemp = function() {
	port.postMessage({url: taburl, tid: tabid});
	bkg.revokeTemp();
	window.close();
};
var bulkhandle = function() {
	port.postMessage({url: taburl, tid: tabid});
	bulk($(this));
};
var removehandle = function() {
	remove(tabdomain, $(this), '0');
};
var x_removehandle = function() {
	remove($(this).parent().attr("rel"), $(this), '1');
};
var savehandle = function() {
	port.postMessage({url: taburl, tid: tabid});
	save(tabdomain, $(this), '0');
};
var x_savehandle = function() {
	port.postMessage({url: taburl, tid: tabid});
	save($(this).parent().attr("rel"), $(this), '1');
};
function openTab(url) {
	chrome.tabs.create({url: url});
	window.close();
}
function truncate(str, len) {
	if (str.length > len)
		return str.substring(0, len)+'...';
	return str;
}
document.addEventListener('DOMContentLoaded', function () {
	setTimeout(init, 150);
	$("#pop_ay").click(function() { openTab('https://twitter.com/andryou'); });
	$("#pop_docs").click(function() { openTab('https://www.andryou.com/scriptsafe/'); });
	$("#pop_project").click(function() { openTab('https://github.com/andryou/scriptsafe'); });
	$("#pop_options").click(function() { openTab(chrome.extension.getURL('html/options.html')); });
	$("#pop_webstore").click(function() { openTab('https://chrome.google.com/webstore/detail/scriptsafe/oiigbmnaadbkfbmpbfijlflahbdbdgdf'); });
	$("#pop_close").click(function() { window.close(); });
});
function init() {
	$("#version").html(version);
	$("#pop_options").html(chrome.i18n.getMessage("options"));
	chrome.windows.getCurrent(function(w) {
		chrome.tabs.getSelected(w.id, function(tab) {
			taburl = tab.url;
			tabdomain = bkg.extractDomainFromURL(taburl);
			if (tabdomain.substr(0,4) == 'www.') tabdomain = tabdomain.substr(4);
			tabid = tab.id;
			if (tabdomain == 'chrome.google.com') {
				$("#currentdomain").html(chrome.i18n.getMessage("notfiltered"));
				$(".thirds").html('<i>'+chrome.i18n.getMessage("noexternal")+'</i>');
			} else {
				chrome.extension.sendRequest({reqtype: "get-list", url: taburl, tid: tabid}, function(response) {
					if (typeof response === 'undefined' || response == 'reload') {
						if (tab.url.substring(0, 4) == 'http') {
							$("table").html('<tr><td>'+chrome.i18n.getMessage("recentlyupdated")+'</td></tr>');
						} else {
							$("table").html('<tr><td>'+chrome.i18n.getMessage("cannotprocess")+'</td></tr>');
						}
						return;
					}
					mode = response.mode;
					var responseBlockedCount = response.blockeditems.length;
					var responseAllowedCount = response.alloweditems.length;
					var tabInTemp = bkg.in_array(tabdomain, response.temp);
					var tabdomainfriendly = tabdomain.replace(/[.\[\]:]/g,"_");
					var tabdomainroot = bkg.getDomain(tabdomain);
					$("#currentdomain").html('<span title="'+tabdomain+'">'+tabdomain+'</span>');
					if ((responseBlockedCount == 0 && responseAllowedCount == 0) || response.status == 'false' || (response.mode == 'block' && (response.enable == '1' || response.enable == '4'))) {
						if (response.status == 'false') {
							$(".thirds").html('<i>'+chrome.i18n.getMessage("ssdisabled")+'</i>');
							$("#parent").append('<div class="box box1 snstatus" title="'+chrome.i18n.getMessage("enabless")+'">'+chrome.i18n.getMessage("enabless")+'</div>');
							$(".snstatus").bind("click", statuschange);
							return false;
						}
						$(".thirds").html('<i>'+chrome.i18n.getMessage("noexternal")+'</i>');
					} else {
						if (responseBlockedCount != 0) {
							if (response.domainsort == 'true') response.blockeditems = bkg.domainSort(response.blockeditems);
							else response.blockeditems.sort();
							$(".thirds").parent().after("<tr><td class='bolded' style='height: 14px; padding-top: 5px;'><span class='blocked'>"+chrome.i18n.getMessage("blockeditems")+"</span></td><td id='parent'></td></tr><tr><td class='thirds' id='blocked'></td><td></td></tr>");
							$(".thirds:first").parent().remove();
							$("#parent").attr("rowspan","2");
							for (var i=0;i<responseBlockedCount;i++) {
								var itemdomain = response.blockeditems[i][2];
								if (response.blockeditems[i][1] == 'NOSCRIPT') itemdomain = 'no.script';
								else if (response.blockeditems[i][1] == 'WEBBUG') itemdomain = 'web.bug';
								else if (response.blockeditems[i][1] == 'Canvas Fingerprint') itemdomain = 'canvas.fingerprint';
								else if (response.blockeditems[i][1] == 'Canvas Font Access') itemdomain = 'canvas.font.access';
								else if (response.blockeditems[i][1] == 'Audio Fingerprint') itemdomain = 'audio.fingerprint';
								else if (response.blockeditems[i][1] == 'WebGL Fingerprint') itemdomain = 'webgl.fingerprint';
								else if (response.blockeditems[i][1] == 'Battery Fingerprint') itemdomain = 'battery.fingerprint';
								else if (response.blockeditems[i][1] == 'Device Enumeration') itemdomain = 'device.enumeration';
								else if (response.blockeditems[i][1] == 'Gamepad Enumeration') itemdomain = 'gamepad.enumeration';
								else if (response.blockeditems[i][1] == 'Spoofed Timezone') itemdomain = 'spoofed.timezone';
								else if (response.blockeditems[i][1] == 'Client Rectangles') itemdomain = 'client.rectangles';
								else if (response.blockeditems[i][1] == 'Clipboard Interference') itemdomain = 'clipboard.interference';
								if (itemdomain) {
									var baddiesstatus = response.blockeditems[i][5];
									var parentstatus = response.blockeditems[i][4];
									var itemdomainfriendly = itemdomain.replace(/[.\[\]:]/g,"_");
									var domainCheckStatus = response.blockeditems[i][3];
									blocked.push(itemdomain);
									if ($('#blocked .thirditem[rel="x_'+itemdomainfriendly+'"]').length == 0) {
										if (domainCheckStatus == '1') {
											var trustval0 = '';
											var trustval1 = '';
											var allowedtype;
											var trustType = bkg.trustCheck(itemdomain);
											if (trustType == '1') {
												trustval0 = ' selected';
												allowedtype = 3;
											} else if (trustType == '2') {
												trustval1 = ' selected';
												allowedtype = 4;
											} else allowedtype = 1;
											var outputdomain = itemdomain;
											if (response.blockeditems[i][1] == 'NOSCRIPT' || response.blockeditems[i][1] == 'WEBBUG') outputdomain = '&lt;'+response.blockeditems[i][1]+'&gt;';
											else if (response.blockeditems[i][1] == 'Canvas Fingerprint' || response.blockeditems[i][1] == 'Canvas Font Access' || response.blockeditems[i][1] == 'Audio Fingerprint' || response.blockeditems[i][1] == 'WebGL Fingerprint' || response.blockeditems[i][1] == 'Battery Fingerprint' || response.blockeditems[i][1] == 'Device Enumeration' || response.blockeditems[i][1] == 'Gamepad Enumeration' || response.blockeditems[i][1] == 'Spoofed Timezone' || response.blockeditems[i][1] == 'Client Rectangles' || response.blockeditems[i][1] == 'Clipboard Interference') outputdomain = response.blockeditems[i][1];
											$("#blocked").append('<div class="thirditem" title="['+response.blockeditems[i][1]+'] '+$.trim(response.blockeditems[i][0].replace(/"/g, "'").replace(/\&lt;/g, "<").replace(/\&gt;/g, ">").replace(/\&amp;/g, "&"))+'" rel="x_'+itemdomainfriendly+'" data-domain="'+bkg.getDomain(itemdomain)+'" data-baddie="'+baddiesstatus+'"><span><span rel="r_'+itemdomainfriendly+'"></span><span>'+outputdomain+'</span> (<span rel="count_'+itemdomainfriendly+'">1</span>)</span><br /><span class="choices" rel="'+itemdomain+'" sn_list="'+allowedtype+'"><span class="box box4 x_'+itemdomainfriendly+'" title="Clear Domain from List">'+chrome.i18n.getMessage("clear")+'</span><span class="box box1 x_whitelist" rel="0" title="Allow Domain">'+chrome.i18n.getMessage("allow")+'</span><span class="box box1 x_trust'+trustval0+'" rel="3" title="Trust Entire Domain">'+chrome.i18n.getMessage("trust")+'</span><span class="box box2 x_blacklist selected" rel="1" title="Deny">'+chrome.i18n.getMessage("deny")+'</span><span class="box box2 x_trust'+trustval1+'" rel="4" title="Distrust Entire Domain">'+chrome.i18n.getMessage("distrust")+'</span><span class="box box3 x_bypass" rel="2" title="Temporary">'+chrome.i18n.getMessage("temp")+'</span></span></div>');
										} else {
											if (response.blockeditems[i][1] == 'NOSCRIPT' || response.blockeditems[i][1] == 'WEBBUG') {
												$("#blocked").append('<div class="thirditem" title="['+response.blockeditems[i][1]+'] '+$.trim(response.blockeditems[i][0].replace(/"/g, "'").replace(/\&lt;/g, "<").replace(/\&gt;/g, ">").replace(/\&amp;/g, "&"))+'" rel="x_'+itemdomainfriendly+'" data-domain="'+bkg.getDomain(itemdomain)+'" data-baddie="'+baddiesstatus+'"><span><span>&lt;'+response.blockeditems[i][1]+'&gt;</span> (<span rel="count_'+itemdomainfriendly+'">1</span>)</span></div>');
											} else if (response.blockeditems[i][1] == 'Canvas Fingerprint' || response.blockeditems[i][1] == 'Canvas Font Access' || response.blockeditems[i][1] == 'Audio Fingerprint' || response.blockeditems[i][1] == 'WebGL Fingerprint' || response.blockeditems[i][1] == 'Battery Fingerprint' || response.blockeditems[i][1] == 'Device Enumeration' || response.blockeditems[i][1] == 'Gamepad Enumeration' || response.blockeditems[i][1] == 'Spoofed Timezone' || response.blockeditems[i][1] == 'Client Rectangles' || response.blockeditems[i][1] == 'Clipboard Interference') {
												$("#blocked").append('<div class="thirditem" title="['+response.blockeditems[i][1]+'] '+$.trim(response.blockeditems[i][0].replace(/"/g, "'").replace(/\&lt;/g, "<").replace(/\&gt;/g, ">").replace(/\&amp;/g, "&"))+'" rel="x_'+itemdomainfriendly+'" data-domain="'+bkg.getDomain(itemdomain)+'" data-baddie="'+baddiesstatus+'"><span><span>'+response.blockeditems[i][1]+'</span> (<span rel="count_'+itemdomainfriendly+'">1</span>)</span></div>');
											} else {
												$("#blocked").append('<div class="thirditem" title="['+response.blockeditems[i][1]+'] '+$.trim(response.blockeditems[i][0].replace(/"/g, "'").replace(/\&lt;/g, "<").replace(/\&gt;/g, ">").replace(/\&amp;/g, "&"))+'" rel="x_'+itemdomainfriendly+'" data-domain="'+bkg.getDomain(itemdomain)+'" data-baddie="'+baddiesstatus+'"><span><span rel="r_'+itemdomainfriendly+'"></span><span>'+itemdomain+'</span> (<span rel="count_'+itemdomainfriendly+'">1</span>)</span><br /><span class="choices" rel="'+itemdomain+'" sn_list="-1"><span class="box box4 x_'+itemdomainfriendly+'" title="Clear Domain from List">'+chrome.i18n.getMessage("clear")+'</span><span class="box box1 x_whitelist" rel="0" title="Allow Domain">'+chrome.i18n.getMessage("allow")+'</span><span class="box box1 x_trust" rel="3" title="Trust Entire Domain">'+chrome.i18n.getMessage("trust")+'</span><span class="box box2 x_blacklist" rel="1" title="Deny">'+chrome.i18n.getMessage("deny")+'</span><span class="box box2 x_trust" rel="4" title="Distrust Entire Domain">'+chrome.i18n.getMessage("distrust")+'</span><span class="box box3 x_bypass" rel="2" title="Temporary">'+chrome.i18n.getMessage("temp")+'</span></span></div>');
												$("#blocked [rel='x_"+itemdomainfriendly+"'] .x_"+itemdomainfriendly).hide();
											}
										}
										$("#blocked [rel='x_"+itemdomainfriendly+"'] .x_"+itemdomainfriendly).bind("click", x_removehandle);
									} else {
										$("#blocked [rel='x_"+itemdomainfriendly+"']").attr("title",$("#blocked [rel='x_"+itemdomainfriendly+"']").attr("title")+"\r\n["+response.blockeditems[i][1]+"] "+$.trim(response.blockeditems[i][0].replace(/"/g, "'").replace(/\&lt;/g, "<").replace(/\&gt;/g, ">").replace(/\&amp;/g, "&")));
										$("#blocked [rel='count_"+itemdomainfriendly+"']").html((parseInt($("#blocked [rel='count_"+itemdomainfriendly+"']").html())+1));
									}
									if (response.rating == 'true') $("#blocked [rel='r_"+itemdomainfriendly+"']").html('<span class="download"><a href="'+response.blockeditems[i][0]+'" target="_blank">&#128269;</a></span>');
									if ((response.annoyances == 'true' && response.annoyancesmode == 'strict' && domainCheckStatus == '-1' && baddiesstatus == 1) || (response.antisocial == 'true' && baddiesstatus == '2')) {
										$("#blocked").append($("#blocked [rel='x_"+itemdomainfriendly+"']"));
										$("#blocked [rel='x_"+itemdomainfriendly+"'] .box1, #blocked [rel='x_"+itemdomainfriendly+"'] .x_trust, #blocked [rel='x_"+itemdomainfriendly+"'] .box3, #blocked [rel='x_"+itemdomainfriendly+"'] .box4").hide();
										if (response.antisocial == 'true' && baddiesstatus == '2') {
											$("#blocked [rel='x_"+itemdomainfriendly+"'] .x_blacklist").attr("title","Antisocial").html(chrome.i18n.getMessage("antisocialpopup")).addClass("selected");
										} else {
											$("#blocked [rel='x_"+itemdomainfriendly+"'] .x_blacklist").attr("title","Unwanted Content Provider").html(chrome.i18n.getMessage("unwanted")).addClass("selected");
										}
									} else if ((parentstatus == '1' || parentstatus == '-1') && domainCheckStatus == '0') {
										$("#blocked [rel='x_"+itemdomainfriendly+"'] .box1, #blocked [rel='x_"+itemdomainfriendly+"'] .x_trust, #blocked [rel='x_"+itemdomainfriendly+"'] .box3, #blocked [rel='x_"+itemdomainfriendly+"'] .box4").hide();
										$("#blocked [rel='x_"+itemdomainfriendly+"'] .x_blacklist").attr("title","Ignored allowed domain due to unlisted tab domain").html(chrome.i18n.getMessage("ignoredallow")).addClass("selected");
									} else if (response.annoyances == 'true' && domainCheckStatus == '-1' && baddiesstatus == '1') {
										$("#blocked [rel='x_"+itemdomainfriendly+"'] .x_"+itemdomainfriendly).hide();
										$("#blocked [rel='x_"+itemdomainfriendly+"'] .x_blacklist").attr("title","Unwanted Content Provider").html(chrome.i18n.getMessage("unwanted")).addClass("selected");
									} else if (itemdomain[0] == '[' || itemdomain.match(/^((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){3}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})$/g)) {
										$("#blocked [rel='x_"+itemdomainfriendly+"'] .x_trust").hide();
									}
									if (mode == 'allow') {
										if (bkg.in_array(itemdomain, response.temp)) {
											if (!intemp) intemp = true;
											$("#blocked [rel='x_"+itemdomainfriendly+"'] .x_blacklist").removeClass("selected");
											$("#blocked [rel='x_"+itemdomainfriendly+"'] .x_bypass").addClass("selected");
											$("#blocked [rel='x_"+itemdomainfriendly+"'] .x_"+itemdomainfriendly).hide();
										} else {
											$("#blocked [rel='x_"+itemdomainfriendly+"'] .x_bypass").hide();
										}
									}
								}
							}
							$("#blocked").append($('.thirditem:has([title="Ignored allowed domain due to unlisted tab domain"])'));
							$("#blocked").append($('.thirditem:has([title="Unwanted Content Provider"])'));
							$("#blocked").append($('.thirditem:has([title="Antisocial"])'));
							$("#blocked").append($('.thirditem:not(*>:has(.choices))'));
							$("#blocked").append($("#blocked [rel='x_web_bug']"));
							$("#blocked").append($("#blocked [rel='x_no_script']"));
							$("#blocked").append($("#blocked [rel='x_canvas_fingerprint']"));
							$("#blocked").append($("#blocked [rel='x_canvas_font_access']"));
							$("#blocked").append($("#blocked [rel='x_battery_fingerprint']"));
							$("#blocked").append($("#blocked [rel='x_audio_fingerprint']"));
							$("#blocked").append($("#blocked [rel='x_webgl_fingerprint']"));
							$("#blocked").append($("#blocked [rel='x_device_enumeration']"));
							$("#blocked").append($("#blocked [rel='x_gamepad_enumeration']"));
							$("#blocked").append($("#blocked [rel='x_client_rectangles']"));
							$("#blocked").append($("#blocked [rel='x_clipboard_interference']"));
							$("#blocked").append($("#blocked [rel='x_spoofed_timezone']"));
							$("#blocked").prepend($("#blocked [data-domain='"+tabdomainroot+"'][data-baddie='false']"));
							$("#blocked [rel='x_"+tabdomainfriendly+"']").children().first().css("font-weight", "bold");
							$("#blocked").prepend($("#blocked [rel='x_"+tabdomainfriendly+"']"));
						}
						if (responseAllowedCount != 0) {
							if (response.domainsort == 'true') response.alloweditems = bkg.domainSort(response.alloweditems);
							else response.alloweditems.sort();
							$("#parent").attr("rowspan","3");
							$(".thirds").parent().parent().append("<tr><td class='bolded' style='height: 14px; padding-top: 15px;'><span class='allowed'>"+chrome.i18n.getMessage("alloweditems")+"</span></td><td class='bolded'></td></tr><tr><td class='thirds' id='allowed'></td><td></td></tr>");
							if (blocked.length != 0) $("#parent").attr("rowspan","4");
							else $("td.bolded").css('padding-top', '0px');
							for (var i=0;i<responseAllowedCount;i++) {
								var itemdomain = response.alloweditems[i][2];
								if (itemdomain) {
									allowed.push(itemdomain);
									var itemdomainfriendly = itemdomain.replace(/[.\[\]:]/g,"_");
									var baddiesstatus = response.alloweditems[i][4];
									if ($('#allowed .choices[rel="'+itemdomain+'"]').length == 0) {
										if (response.alloweditems[i][3] == '0') {
											var trustval0 = '';
											var trustval1 = '';
											var allowedtype;
											var trustType = bkg.trustCheck(itemdomain);
											if (trustType == '1') {
												trustval0 = ' selected';
												allowedtype = 3;
											} else if (trustType == '2') {
												trustval1 = ' selected';
												allowedtype = 4;
											} else allowedtype = 0;
											$("#allowed").append('<div class="thirditem" title="['+response.alloweditems[i][1]+'] '+$.trim(response.alloweditems[i][0].replace(/"/g, "'").replace(/\&lt;/g, "<").replace(/\&gt;/g, ">").replace(/\&amp;/g, "&"))+'" rel="x_'+itemdomainfriendly+'" data-domain="'+bkg.getDomain(itemdomain)+'" data-baddie="'+baddiesstatus+'"><span><span rel="r_'+itemdomainfriendly+'"></span><span>'+itemdomain+'</span> (<span rel="count_'+itemdomainfriendly+'">1</span>)</span><br /><span class="choices" rel="'+itemdomain+'" sn_list="'+allowedtype+'"><span class="box box4 x_'+itemdomainfriendly+'" title="Clear Domain from List">'+chrome.i18n.getMessage("clear")+'</span><span class="box box1 x_whitelist selected" rel="0" title="Allow Domain">'+chrome.i18n.getMessage("allow")+'</span><span class="box box1 x_trust'+trustval0+'" rel="3" title="Trust Entire Domain">'+chrome.i18n.getMessage("trust")+'</span><span class="box box2 x_blacklist" rel="1" title="Deny">'+chrome.i18n.getMessage("deny")+'</span><span class="box box2 x_trust'+trustval1+'" rel="4" title="Distrust Entire Domain">'+chrome.i18n.getMessage("distrust")+'</span><span class="box box3 x_bypass" rel="2" title="Temporary">'+chrome.i18n.getMessage("temp")+'</span></span></div>');
											$("#allowed [rel='x_"+itemdomainfriendly+"'] .x_"+itemdomainfriendly).bind("click", x_removehandle);
										} else {
											$("#allowed").append('<div class="thirditem" title="['+response.alloweditems[i][1]+'] '+$.trim(response.alloweditems[i][0].replace(/"/g, "'").replace(/\&lt;/g, "<").replace(/\&gt;/g, ">").replace(/\&amp;/g, "&"))+'" rel="x_'+itemdomainfriendly+'" data-domain="'+bkg.getDomain(itemdomain)+'" data-baddie="'+baddiesstatus+'"><span><span rel="r_'+itemdomainfriendly+'"></span><span>'+itemdomain+'</span> (<span rel="count_'+itemdomainfriendly+'">1</span>)</span><br /><span class="choices" rel="'+itemdomain+'" sn_list="-1"><span class="box box4 x_'+itemdomainfriendly+'" title="Clear Domain from List">'+chrome.i18n.getMessage("clear")+'</span><span class="box box1 x_whitelist" rel="0" title="Allow Domain">'+chrome.i18n.getMessage("allow")+'</span><span class="box box1 x_trust" rel="3" title="Trust Entire Domain">'+chrome.i18n.getMessage("trust")+'</span><span class="box box2 x_blacklist" rel="1" title="Deny">'+chrome.i18n.getMessage("deny")+'</span><span class="box box2 x_trust" rel="4" title="Distrust Entire Domain">'+chrome.i18n.getMessage("distrust")+'</span><span class="box box3 x_bypass" rel="2" title="Temporary">'+chrome.i18n.getMessage("temp")+'</span></span></div>');
											$("#allowed [rel='x_"+itemdomainfriendly+"'] .x_"+itemdomainfriendly).hide();
										}
									} else {
										$("#allowed [rel='x_"+itemdomainfriendly+"']").attr("title",$("#allowed [rel='x_"+itemdomainfriendly+"']").attr("title")+"\r\n["+response.alloweditems[i][1]+"] "+response.alloweditems[i][0]);
										$("#allowed [rel='count_"+itemdomainfriendly+"']").html((parseInt($("#allowed [rel='count_"+itemdomainfriendly+"']").html())+1));
									}
									if (response.rating == 'true') $("#allowed [rel='r_"+itemdomainfriendly+"']").html('<span class="download"><a href="'+response.blockeditems[i][0]+'" target="_blank">&#128269;</a></span>');
									if (response.annoyances == 'true' && baddiesstatus == '1') {
										$("#allowed [rel='x_"+itemdomainfriendly+"'] .x_blacklist").attr("title","Unwanted Content Provider").html(chrome.i18n.getMessage("unwanted"));
									} else if (itemdomain[0] == '[' || itemdomain.match(/^((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){3}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})$/g)) {
										$("#allowed [rel='x_"+itemdomainfriendly+"'] .x_trust").hide();
									}
									if (mode == 'block') {
										if (bkg.in_array(itemdomain, response.temp)) {
											if (!intemp) intemp = true;
											$("#allowed [rel='x_"+itemdomainfriendly+"'] .x_whitelist").removeClass("selected");
											$("#allowed [rel='x_"+itemdomainfriendly+"'] .x_bypass").addClass("selected");
											$("#allowed [rel='x_"+itemdomainfriendly+"'] .x_"+itemdomainfriendly).hide();
										} else {
											$("#allowed [rel='x_"+itemdomainfriendly+"'] .x_bypass").hide();
										}
									}
								}
							}
							$("#allowed").prepend($("#allowed [data-domain='"+tabdomainroot+"'][data-baddie='false']"));
							$("#allowed [rel='x_"+tabdomainfriendly+"']").children().first().css("font-weight", "bold");
							$("#allowed").prepend($("#allowed [rel='x_"+tabdomainfriendly+"']"));
						}
						var blockedCount = blocked.length;
						var allowedCount = allowed.length;
						if (responseBlockedCount != 0 && blockedCount == 0) $(".thirds:first").html('<i>None</i>');
						if (responseAllowedCount != 0 && allowedCount == 0) $(".allowed").parent().hide();
						$(".x_whitelist,.x_blacklist,.x_trust,.x_bypass").bind("click", x_savehandle);
						var tempSel;
						if (responseAllowedCount == 0) tempSel = '.thirds';
						else tempSel = '#allowed';
						if (mode == 'block') {
							if ($('#blocked .thirditem').length == 1 && ($('#blocked .thirditem[rel="x_no_script"]').length == 1 || $('#blocked .thirditem[rel="x_web_bug"]').length == 1 || $('#blocked .thirditem[rel="x_canvas_fingerprint"]').length == 1 || $('#blocked .thirditem[rel="x_canvas_font_access"]').length == 1 || $('#blocked .thirditem[rel="x_audio_fingerprint"]').length == 1 || $('#blocked .thirditem[rel="x_webgl_fingerprint"]').length == 1 || $('#blocked .thirditem[rel="x_battery_fingerprint"]').length == 1 || $('#blocked .thirditem[rel="x_device_enumeration"]').length == 1 || $('#blocked .thirditem[rel="x_gamepad_enumeration"]').length == 1) || $('#blocked .thirditem[rel="x_timezone_offset"]').length == 1 || $('#blocked .thirditem[rel="x_client_rectangles"]').length == 1 || $('#blocked .thirditem[rel="x_clipboard_interference"]').length == 1) {
								// empty space
							} else {
								if ($("#blocked .x_whitelist:visible").length != 0) {
									$(tempSel).append('<br /><div class="box box3 allowsession" title="Allow all blocked items for the session (not including webbugs/noscript/fingerprinting/annoyances)">'+chrome.i18n.getMessage("allowallblocked")+'</div>');
								} else {
									$(tempSel).append('<br />');
								}
							}
						} else {
							$(tempSel).append('<br /><div class="box box3 allowsession" title="Block all allowed items for the session">'+chrome.i18n.getMessage("blockallallowed")+'</div>');
						}
						$(".allowsession").bind("click", bulkhandle);
						if (intemp || tabInTemp) {
							$(tempSel).append('<div class="box box5 prevoke" title="Revoke temporary permissions given to the current page">'+chrome.i18n.getMessage("revoketemp")+'</div>');
							$(".prevoke").bind("click", bulkhandle);
						}
					}
					if (typeof response.temp !== 'undefined' && response.temp.length) {
						$("#parent").append('<hr><div class="box box5 clearglobaltemp" title="Revoke all temporary permissions given in this entire browsing session">'+chrome.i18n.getMessage("revoketempall")+'</div>');
						$(".clearglobaltemp").bind("click", revokealltemp);
					}
					$("#parent").prepend('<div class="box box1 pallow" rel="0" title="Allow Current Domain">'+chrome.i18n.getMessage("allow")+'</div><div class="box box1 ptrust" rel="3" title="Trust Entire Domain">'+chrome.i18n.getMessage("trust")+'</div><div class="box box2 pdeny" rel="1" title="Deny">'+chrome.i18n.getMessage("deny")+'</div><div class="box box2 ptrust" rel="4" title="Distrust Entire Domain">'+chrome.i18n.getMessage("distrust")+'</div><div class="box box3 pbypass" rel="2" title="Temporary">'+chrome.i18n.getMessage("temp")+'</div><div class="box box4 pclear" title="Clear Domain from List">'+chrome.i18n.getMessage("clear")+'</div>').attr("sn_list",response.enable);
					$(".pallow,.pdeny,.pbypass,.ptrust").bind("click", savehandle);
					$(".pclear").bind("click", removehandle).hide();
					if (tabdomain[0] == '[' || tabdomain.match(/^((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){3}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})$/g)) $(".ptrust").hide();
					if (response.enable == '1' || response.enable == '4') {
						if (tabInTemp) {
							$(".pbypass, #blocked [rel='x_"+tabdomainfriendly+"'] .x_bypass").addClass('selected');
							$("#blocked [rel='x_"+tabdomainfriendly+"'] .x_blacklist").removeClass('selected').bind("click", x_savehandle);
							$("#blocked .x_"+tabdomainfriendly).hide();
						} else {
							$(".pbypass").hide();
							$(".pclear").show();
							$(".pdeny").addClass("selected");
							if (response.enable == '4') $(".ptrust[rel='4']").addClass("selected");
						}
						var domainCheckStatus = bkg.domainCheck(taburl, 1);
						var baddiesStatus = bkg.baddies(taburl, response.annoyancesmode, response.antisocial);
						if ((response.annoyances == 'true' && response.annoyancesmode == 'strict' && domainCheckStatus == '-1' && baddiesStatus == 1) || (response.antisocial == 'true' && baddiesStatus == '2')) {
							if (response.antisocial == 'true' && baddiesStatus == '2') {
								$(".pdeny").addClass("selected").attr("title","Blocked (antisocial)").text(chrome.i18n.getMessage("antisocialpopup"));
							} else {
								$(".pdeny").addClass("selected").attr("title","Blocked (provider of unwanted content)").text(chrome.i18n.getMessage("blocked"));
							}
							$(".pbypass, .ptrust[rel='3'], .ptrust[rel='4'], .pclear, .pallow").hide();
						} else if (response.annoyances == 'true' && domainCheckStatus == '-1' && baddiesStatus == 1) {
							$(".pdeny").addClass("selected").attr("title","Blocked (provider of unwanted content)").text(chrome.i18n.getMessage("blocked"));
							$(".pbypass").show();
							$(".pclear").hide();
						}
					} else if (response.enable == '0' || response.enable == '3') {
						if (tabInTemp) {
							$(".pbypass, #allowed [rel='x_"+tabdomainfriendly+"'] .x_bypass").addClass('selected');
							$("#allowed [rel='x_"+tabdomainfriendly+"'] .x_whitelist").removeClass('selected').bind("click", x_savehandle);
							$("#allowed .x_"+tabdomainfriendly).hide();
						} else {
							$(".pbypass").hide();
							$(".pclear").show();
							$(".pallow").addClass("selected");
							if (response.enable == '3') $(".ptrust[rel='3']").addClass("selected");
						}
					}
					if (response.status == 'true') $("#footer").prepend('<span class="box box2 snstatus" title="Disable ScriptSafe">'+chrome.i18n.getMessage("disable")+'</span>&nbsp;|&nbsp;');
					$(".snstatus").bind("click", statuschange);
					closepage = response.closepage;
				});
			}
		});
	});
}
function bulk(el) {
	var urlarray;
	if (el.hasClass("prevoke")) {
		if (mode == 'block') urlarray = allowed;
		else urlarray = blocked;
		chrome.extension.sendRequest({reqtype: "remove-temp", url: urlarray});
	} else {
		if (mode == 'block') urlarray = blocked;
		else urlarray = allowed;
		chrome.extension.sendRequest({reqtype: "temp", url: urlarray, mode: mode});
	}
	window.close();
}
function remove(url, el, type) {
	var val = el.attr("rel");
	var selected = el.hasClass("selected");
	if (val != 2 && selected) return;
	port.postMessage({url: taburl, tid: tabid});
	var trustType = bkg.trustCheck(url);
	if (trustType) {
		bkg.domainHandler('**.'+bkg.getDomain(url), 2);
		bkg.domainHandler('**.'+bkg.getDomain(url), 2, 1);
	} else {
		bkg.domainHandler(url, 2);
		bkg.domainHandler(url, 2, 1);
	}
	chrome.extension.sendRequest({reqtype: "refresh-page-icon", tid: tabid, type: 1});
	if (closepage == 'true') window.close();
	else {
		var urlfriendly = url.replace(/[.\[\]:]/g,"_");
		if (el.parent().attr("sn_list") == '0' || el.parent().attr("sn_list") == '3') {
			$("[rel='x_"+urlfriendly+"'] .choices, #parent").attr("sn_list", "-1");
		}
		el.hide();
		if (type == '0') {
			$(".x_"+urlfriendly).parent().children().removeClass("selected");
			$(".x_"+urlfriendly).hide();
			$(".pallow,.pdeny,.pbypass,.ptrust").removeClass("selected");
			if ($("[rel='x_"+urlfriendly+"'] .x_blacklist").text() == 'Unwanted') $("[rel='x_"+urlfriendly+"'] .x_blacklist").addClass("selected");
			$(".pbypass").show();
			$("[rel='x_"+urlfriendly+"'] .x_bypass").show();
		} else if (type == '1') {
			if (url == tabdomain) {
				$(".pallow,.pdeny,.pbypass,.ptrust").removeClass("selected");
				$(".pbypass").show();
				$('.pclear').hide();
			}
			$(".x_bypass", el.parent()).show();
			el.parent().children().removeClass("selected");
			if ($(".x_blacklist", el.parent()).text() == 'Unwanted') $(".x_blacklist", el.parent()).addClass("selected");
		}
	}
}
function save(url, el, type) {
	var val = el.attr("rel");
	var selected = el.hasClass("selected");
	if (val != 2 && selected) return;
	if (val < 2) {
		bkg.domainHandler(url, '2', '1');
		chrome.extension.sendRequest({reqtype: "save", url: url, list: val});
	} else if (val == 2) {
		if (selected) chrome.extension.sendRequest({reqtype: "remove-temp", url: url});
		else chrome.extension.sendRequest({reqtype: "temp", url: url, mode: mode});
	} else if (val == 3) {
		bkg.topHandler(url, 0);
		val = 0;
	} else if (val == 4) {
		bkg.topHandler(url, 1);
		val = 1;
	}
	if (url == tabdomain) chrome.extension.sendRequest({reqtype: "refresh-page-icon", tid: tabid, type: val});
	if (closepage == 'true') window.close();
	else {
		var urlfriendly = url.replace(/[.\[\]:]/g,"_");
		if (type == '0') {
			$(".pallow,.pdeny,.pbypass,.ptrust").removeClass("selected");
			$("[rel='x_"+urlfriendly+"'] .choices").children().removeClass("selected");
			$(".x_"+urlfriendly).hide();
			if (val == 0) $("[rel='x_"+urlfriendly+"'] .x_whitelist").addClass('selected');
			else if (val == 1) $("[rel='x_"+urlfriendly+"'] .x_blacklist").addClass('selected');
			else if (val == 2) $("[rel='x_"+urlfriendly+"'] .x_bypass").addClass('selected');
			$(".pclear").hide();
			if (el.attr("rel") == '3') {
				$(".pallow, [rel='x_"+urlfriendly+"'] .x_trust[rel='3']").addClass('selected');
			} else if (el.attr("rel") == '4') {
				$(".pdeny, [rel='x_"+urlfriendly+"'] .x_trust[rel='4']").addClass('selected');
			}
			if (val < 2) {
				$(".pbypass, [rel='x_"+urlfriendly+"'] .x_bypass").hide();
				$(".x_"+urlfriendly+", .pclear").show();
				el.addClass('selected');
			} else {
				if (!selected) {
					el.addClass('selected');
					$("[rel='x_"+urlfriendly+"'] .x_bypass").addClass('selected');
				} else {
					$("[rel='x_"+urlfriendly+"'] .x_bypass").removeClass('selected');
				}
			}
		} else if (type == '1') {
			el.parent().children().removeClass("selected");
			$(".x_"+urlfriendly).hide();
			if (url == tabdomain) {
				$(".pallow,.pdeny,.pbypass,.ptrust").removeClass("selected");
				$(".pclear").hide();
				if (val == 0) $(".pallow").addClass('selected');
				else if (val == 1) $(".pdeny").addClass('selected');
				if (el.attr("rel") == '3') {
					$(".ptrust[rel='3']").addClass('selected');
					$(".x_whitelist", el.parent()).addClass('selected');
				} else if (el.attr("rel") == '4') {
					$(".ptrust[rel='4']").addClass('selected');
					$(".x_blacklist", el.parent()).addClass('selected');
				}
			}
			if (val < 2) {
				if (url == tabdomain) {
					$(".pclear").show();
					$(".pbypass").hide();
				} else {
					if (el.attr("rel") == '3') $(".x_whitelist", el.parent()).addClass('selected');
					else if (el.attr("rel") == '4') $(".x_blacklist", el.parent()).addClass('selected');
				}
				el.addClass('selected');
				$(".x_"+urlfriendly).show();
				$(".x_bypass", el.parent()).hide();
			} else {
				if (!selected) {
					el.addClass('selected');
					if (url == tabdomain) $(".pbypass").addClass('selected').show();
				} else {
					if (url == tabdomain) $(".pbypass").removeClass('selected').show();
					if ($(".x_blacklist", el.parent()).text() == 'Unwanted') $(".x_blacklist", el.parent()).addClass("selected");
				}
				$(".x_bypass", el.parent()).show();
			}
		}
	}
	selected = false;
}
