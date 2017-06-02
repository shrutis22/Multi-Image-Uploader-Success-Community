/**
 * This JS file contains the code
 * which requires to be invoked
 * when the extension is opened
 * for the first time.
 */
"use strict";

/**
 * Object which holds the frame id
 * and tab id.
 */
var tabDetails = {};

/**
 * This object is defined to display
 * the Context Menu and what it should
 * do when it is clicked.
 */
var menuProperties = {
    id : "menuUpload" ,
    title : "Upload Multiple Images",
    contexts : ["frame"] ,
    onclick : function( info, tab ) {
        var details = {
            code : "showModal();"
        };

        /**
         * Collect the frame id and the
         * tab id.
         */
        tabDetails = {
            frameId : info.frameId,
            tabId : tab.id
        };

        chrome.tabs.executeScript(
            tab.id, 
            details,
            function() {}
        );
    }
};

chrome.runtime.onMessage.addListener(
    function( msg, sender, sendResponse ) {
        var images = "";

        /**
         * Iterate the selected images and create
         * <img/> tags to append to the text area.
         */
        msg.images.forEach(
            function( item ) {
                var img = '<img src="' + item.src + '" height="' + item.height + '" width="' + item.width + '" /><br />';

                images = images + img;
            }
        );

        /**
         * Append the images to the answer box.
         * Each answer box is an iframe of its
         * own and hence select the respective
         * iframe with the help of the frame id
         * and the tab id and append the created
         * <img/> tags to the body of the iframe.
         */
        var details = {
            code : "document.body.innerHTML += '" + images + "';",
            frameId : tabDetails.frameId,
            matchAboutBlank : true
        };
        
        chrome.tabs.executeScript(
            tabDetails.tabId,
            details,
            function() {
                sendResponse();
            }
        );
    }
);

chrome.contextMenus.create( menuProperties, function() {} );