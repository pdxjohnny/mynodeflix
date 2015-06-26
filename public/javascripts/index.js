$(function(){
  $("#upload_form_button").click(function () {
    var form_data = new FormData($("#upload_form")[0]);
    $.ajax({
        url: $("#upload_form").attr("action"),  //Server script to process data
        type: 'POST',
        // xhr: function() {  // Custom XMLHttpRequest
        //     var myXhr = $.ajaxSettings.xhr();
        //     if(myXhr.upload){ // Check if upload property exists
        //         myXhr.upload.addEventListener('progress',progressHandlingFunction, false); // For handling the progress of the upload
        //     }
        //     return myXhr;
        // },
        //Ajax events
        success: upload_finished,
        // Form data
        data: form_data,
        //Options to tell jQuery not to process data or worry about content-type.
        cache: false,
        contentType: false,
        processData: false
    });
  });
  $("#video_dir").change(function () {
    console.log(this.value, $("#upload_form").attr("action").split("/"));
  })
});

function upload_finished() {
  $("#upload_form")[0].reset();
}
