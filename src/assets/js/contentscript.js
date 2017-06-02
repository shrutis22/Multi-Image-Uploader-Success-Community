"use strict";

/**
 * Get the token which is used
 * when making a HTTP POST Call
 * to upload the image.
 */
window.tokens = $( "body" ).html().match( /_CONFIRMATIONTOKEN=[A-z0-9]*/g );

window.dropzoneInstance = null;

window.replyFrame;

window.initMultiImgUploader = function() {
    window.uploadedImages = {};

    if( tokens !== null ) {
        /**
         * Creating dialog tag.
         */
        var $dialog = $(
            "<dialog/>",
            {
                id: "dlgMultiImageUpload"
            }
        ).append(
            $(
                "<table/>",
                {
                    "class": "miu-modal-header"
                }
            /**
             * Creating a title bar with a title
             * and a close button.
             */
            ).append(
                $( "<tr/>" ).append(
                    $(
                        "<td/>",
                        {
                            "html"  : "Multi Image Uploader",
                            "width" : "95%"
                        }
                    )
                ).append(
                    $( "<td/>" ).append(
                        $(
                            "<div/>",
                            {
                                html: "?",
                                class: "miu-icon miu-icon--help"
                            }
                        ).click(
                            function() {
                                if( tokens !== null ) {
                                    //To Do: Insert Blog Link
                                }
                            }
                        )
                    )
                ).append(
                    $( "<td/>" ).append(
                        $(
                            "<div/>",
                            {
                                html: "&times;",
                                class: "miu-icon miu-icon--close"
                            }
                        ).click(
                            function() {
                                if( tokens !== null ) {
                                    document.getElementById( "dlgMultiImageUpload" ).close();
                                }
                            }
                        )
                    )
                )
            )
        /**
         * Creating <form/> tag which is required
         * by the Dropzone JS.
         */
        ).append(
            $(
                "<form/>",
                {
                    action: "/_ui/common/request/servlet/RtaImageUploadServlet?" + tokens[ tokens.length - 1 ],
                    class: "dropzone",
                    id: "frmMultiImageUpload"
                }
            ).append(
                $(
                    "<input/>",
                    {
                        type: "hidden",
                        name: "fileName",
                        value: "upload.png"
                    }
                )
            ).append(
                $(
                    "<input/>",
                    {
                        type: "hidden",
                        name: "altText",
                        value: "upload"
                    }
                )
            )
        /**
         * Displays checkboxes corresponding 
         * to each image allowing the user
         * to select the images that s/he wants
         * to upload.
         */
        ).append(
            $(
                "<div/>",
                {
                    class: "miu-modal-content",
                    id: "divImageList"
                }
            ).append(
                $(
                    "<p/>",
                    {
                        html: "Please select an image to insert:",
                        class: "miu-msg"
                    }
                )
            )
        /**
         * Button to upload the selected images.
         */
        ).append(
            $(
                "<div/>",
                {
                    class: "miu-modal-footer",
                    id: "divModalFooter"
                }
            ).append(
                $(
                    "<button/>",
                    {
                        html: "Remove All",
                        class: "miu-button -red"
                    }
                ).click(
                    function() {
                        dropzoneInstance.removeAllFiles();

                        $( "#divImageList" ).hide();
                        $( "#divModalFooter" ).hide();

                        $( ".miu-checkbox:checkbox:checked" ).remove();
                        $( "#divImageList" ).html( "" );
                    }
                )
            ).append(
                $(
                    "<button/>",
                    {
                        html: "Insert Selected",
                        class: "miu-button -green"
                    }
                ).click(
                    function() {
                        var selectedCheckboxes = $( ".miu-checkbox:checkbox:checked" );

                        var images = "";

                        /**
                         * Fetch the image details of the
                         * selected images and collect them
                         * in an array.
                         */
                        var selectedImages = [];
                        for( var i = 0; i <= selectedCheckboxes.length - 1; i++ ) {
                            selectedImages.push( uploadedImages[selectedCheckboxes[i].id] );
                        }

                        /**
                         * If the User has clicked the Insert 
                         * Image button on the CKEditor, we 
                         * don't need to send a message to the 
                         * Background Page to insert the Images 
                         * and instead we can spot the 
                         * IFRAME(the reply box) and insert the 
                         * images right into it.
                         */
                        if( window.replyFrame ) {
                            selectedImages.forEach(
                                function( item ) {
                                    var img = '<img src="' + item.src + '" height="' + item.height + '" width="' + item.width + '" /><br />';

                                    images = images + img;
                                }
                            );

                            window.replyFrame[0].contentDocument.body.innerHTML += images;

                            closeModal();
                        }
                        else {
                            /**
                             * Sends the selected image details to
                             * the background.js via message passing
                             */
                            chrome.runtime.sendMessage( 
                                { images : selectedImages }, 
                                function() {
                                    closeModal();
                                }
                            );
                        }
                    }
                )
            )
        );

        $dialog.appendTo( "body" );

        Dropzone.options.frmMultiImageUpload = {
            acceptedFiles : "image/*",
            maxFilesize : 1,
            init: function() {
                dropzoneInstance = this;

                this.on(
                    "success",
                    function( file, response ) {
                        if( !$( ".miu-modal-content" ).is( ":visible" ) ) {
                            $( ".miu-modal-content" ).show();
                            $( ".miu-modal-footer" ).show();
                        }
                        /**
                         * The Salesforce gives the Response
                         * in 'while(1); {src: "/servlet/rtaImage?
                         * refid=0EM3A0000006I35", width: 500, 
                         * uploadStatus: true, isRunningTests: false,…}' 
                         * format. Hence removing 'while(1);'
                         * from the response will get us what
                         * we exactly want.
                         */
                        var obj = JSON.parse( response.replace( "while(1);", "" ) );
                        
                        /**
                         * Obtain just the Id of the inserted
                         * image from the URL.
                         */
                        var refId = new URL( obj.src, location.origin ).searchParams.get( "refid" );
                        
                        /**
                         * Create an object where the key
                         * will be the Id of the image and
                         * the value will be the JSON response
                         * as received from the POST.
                         */
                        uploadedImages[ refId ] = obj;

                        /**
                         * Generates checkboxes for each
                         * inserted image.
                         */
                        $( ".miu-modal-content" ).append(
                            $(
                                "<input/>",
                                {
                                    type: "checkbox",
                                    id: refId,
                                    class: "miu-checkbox",
                                    checked: true
                                }
                            )
                        ).append(
                            $( 
                                "<label/>",
                                {
                                    "html": file.name,
                                    "for": refId,
                                    class: "miu-checkbox-label"
                                }
                            )
                        ).append( $( "<br/>" ) ).append( $( "<br/>" ) );
                    }
                );

                /**
                 * This is written to make the dialog
                 * draggable.
                 */
                $( "#dlgMultiImageUpload" ).draggable( { handle: ".miu-modal-header" } );
            }
        };
    }
};

/**
 * Displays modal for uploading 
 * multiple images.
 */
window.showModal = function() {
    if( tokens !== null ) {
        document.getElementById( "dlgMultiImageUpload" ).showModal();
    }
};

/**
 * Closes the modal on clicking the
 * close button on the titlebar.
 */
window.closeModal = function() {
    if( tokens !== null ) {
        document.getElementById( "dlgMultiImageUpload" ).close();
    }
};

/**
 * Binds the click event to the
 * 'Select Image' button in the
 * answer box.
 */
window.bindEvents = function() {
    setInterval(
        function(){ 
            $( "[class='cke_button cke_button__sfdcimage cke_button_off']" ).each(
                function( item ) {
                    var $miuButton = $(
                        "<a/>",
                        {
                            class: "cke_button cke_button__sfdcimage cke_button_off miu-enabled"
                        }
                    ).append(
                        $(
                            "<span/>",
                            {
                                class: "cke_button_icon cke_button__sfdcimage_icon"
                            }
                        )
                    ).click(
                        function() {
                            showModal();

                            /**
                             * Grab the IFRAME closest to the 
                             * button. This IFRAME is actually 
                             * the reply box.
                             */
                            window.replyFrame = $( ".cke_button__sfdcimage " ).closest( "div" ).find( "iframe" ); 
                        }
                    ).insertAfter( this );

                    $( this ).remove();
                }
            );
        }, 
        500
    );
};

initMultiImgUploader();
bindEvents();