/* 
 * EnablePlaceholder jQuery plugin.
 * https://github.com/marioizquierdo/enablePlaceholder
 * version 1.1 (Aug 8, 2011)
 * 
 * Copyright (c) 2011 Mario Izquierdo
 * Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
 * and GPL (http://www.opensource.org/licenses/gpl-license.php) licenses.
 */
(function(a){a.support.placeholder=("placeholder" in document.createElement("input"));a.EnablePlaceholder={defaults:{withPlaceholderClass:"placeholder"},alsoForModernBrowsers:false};a.fn.enablePlaceholder=function(e){return c(this,e,function(f,g){b(f,g);d(f,g);f.parents("form").first().submit(function(){f.clearPlaceholder(g);return true});a(window).unload(function(){f.clearPlaceholder(g);return true});f.showPlaceholder(g)})};a.fn.showPlaceholder=function(e){return c(this,e,function(f,h){if(f.val()===""){if(f.attr("type")==="password"){if(!f.data("ph_text")){var g=f.clone().attr("type","text").removeAttr("name").data({ph_pass:f,ph_id:f.attr("id"),ph_active:true});b(g,h);f.data({ph_text:g,ph_id:f.attr("id"),ph_active:true}).before(g)}f=f.removeAttr("id").hide();f.data("ph_text").attr("id",f.data("ph_id")).show();f=f.data("ph_text")}f.val(f.attr("placeholder")).addClass(h.withPlaceholderClass).data("ph_active",true)}})};a.fn.clearPlaceholder=function(e){return c(this,e,function(f,g){if(f.data("ph_active")){if(f.data("ph_pass")){f.data("ph_pass").clearPlaceholder(g).show().focus()}if(f.data("ph_text")){f.data("ph_text").attr("id",null).hide();f.attr("id",f.data("ph_id")).data("ph_text",null)}f.val("").removeClass(g.withPlaceholderClass).data("ph_active",false)}})};a.fn.updatePlaceholder=function(f,e){this.clearPlaceholder(e).attr("placeholder",f).showPlaceholder(e)};var c,b,d;c=function(h,f,e){if(!a.support.placeholder||a.EnablePlaceholder.alsoForModernBrowsers){var g=a.extend({},a.EnablePlaceholder.defaults,f);return h.each(function(){var i=a(this);e(i,g)})}};b=function(e,f){e.bind("focus focusin keydown paste",function(){e.clearPlaceholder(f)})};d=function(e,f){e.bind("blur focusout",function(){e.showPlaceholder(f)})}})(jQuery);