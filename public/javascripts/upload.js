$(function(){
  $("#directory").change(update_upload);
  $("#collection").keyup(update_upload);
  $("#upload_form_button").click(function () {
    var form_data = new FormData($("#upload_form")[0]);
    $.ajax({
        url: $("#upload_form").attr("action"),  //Server script to process data
        type: 'POST',
        xhr: function() {  // Custom XMLHttpRequest
            var myXhr = $.ajaxSettings.xhr();
            if(myXhr.upload){ // Check if upload property exists
                myXhr.upload.addEventListener('progress', upload_progress, false); // For handling the progress of the upload
            }
            return myXhr;
        },
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
});

function upload_finished() {
  $("#upload_form")[0].reset();
  $("#progress").attr("style", "width:100%");
  $("#progress").html("100%");
}

function update_upload() {
  var upload_path = ["api", "movie", 0, 0];
  upload_path[2] = $("#directory").val();
  upload_path[3] = $("#collection").val();
  upload_path = '/' + upload_path.join('/');
  $("#upload_form").attr("action", upload_path);
}

function upload_progress(event) {
  var percent = parseInt(100 - (event.loaded / event.total * 100));
  percent = percent + "%";
  $("#progress").attr("style", "width:" + percent);
  $("#progress").html(percent);
}
