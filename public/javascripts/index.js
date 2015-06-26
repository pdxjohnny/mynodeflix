$(function(){
  dir_change();
  $("#directory").change(dir_change);
  $("#collection").keyup(collection_change);
});

function dir_change() {
  var dir_path = ["api", "movie", 0];
  dir_path[2] = $("#directory").val();
  dir_path = '/' + dir_path.join('/');
  $.get(dir_path, function (data) {
    console.log(data);
  });
}

function collection_change() {
}
